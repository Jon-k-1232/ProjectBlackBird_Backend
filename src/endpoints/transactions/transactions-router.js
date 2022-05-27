const express = require('express');
const transactionsRouter = express.Router();
const helperFunctions = require('../../helperFunctions/helperFunctions');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');
const { defaultDaysInPast } = require('../../config');
const transactionService = require('./transactions-service');
const handleChargesAndPayments = require('../transactions/TransactionOrchestrator');

/**
 * All Transactions within a given time frame- in days.
 * @:time - time in past whole days. example: 6 will get past 6 days
 */
transactionsRouter.route('/all/:time').get(async (req, res) => {
  const db = req.app.get('db');
  const time = Number(req.params.time) ? Number(req.params.time) : defaultDaysInPast;
  const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

  transactionService.getTransactions(db, timeBetween.currDate, timeBetween.prevDate).then(allTransactions => {
    res.send({
      allTransactions,
      status: 200,
    });
  });
});

/**
 * All Transactions within a given time frame- in days.
 * @:time - time in past whole days. example: 6 will get past 6 days
 */
transactionsRouter.route('/companyTransactions/:company/:time').get(async (req, res) => {
  const db = req.app.get('db');

  // Default time 360 days if user has not provided a time
  const time = req.params.time === Number(req.params.time) ? Number(req.params.time) : defaultDaysInPast;
  const company = Number(req.params.company);
  const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

  transactionService.getCompanyTransactions(db, company, timeBetween.currDate, timeBetween.prevDate).then(sortedCompanyTransactions => {
    res.send({
      sortedCompanyTransactions,
      status: 200,
    });
  });
});

/**
 *
 */
transactionsRouter.route('/jobTransactions/:companyId/:jobId/').get(async (req, res) => {
  const db = req.app.get('db');
  const companyId = Number(req.params.companyId);
  const jobId = Number(req.params.jobId);

  transactionService.getJobTransactions(db, companyId, jobId).then(jobTransactions => {
    res.send({
      jobTransactions,
      status: 200,
    });
  });
});

/**
 * Handles Payments, Charges, Time Charges, Adjustment, and updating the DB
 */
transactionsRouter.route('/new/addNewTransaction').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const {
    company,
    job,
    employee,
    transactionType,
    transactionDate,
    quantity,
    unitOfMeasure,
    unitTransaction,
    totalTransaction,
    discount,
    invoice,
    paymentApplied,
    ignoreInAgeing,
  } = req.body;

  const newTransaction = sanitizeFields({
    company,
    job,
    employee,
    transactionType,
    transactionDate,
    quantity,
    unitOfMeasure,
    unitTransaction,
    totalTransaction,
    discount,
    invoice,
    paymentApplied,
    ignoreInAgeing,
  });

  const balanceResponse = await handleChargesAndPayments(db, newTransaction);

  res.send({
    item: balanceResponse,
    message: 'Transaction and account updated successfully.',
    status: 200,
  });
});

module.exports = transactionsRouter;
