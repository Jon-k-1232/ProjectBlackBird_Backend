const express = require('express');
const transactionsRouter = express.Router();
const helperFunctions = require('../../helperFunctions/helperFunctions');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');
const { defaultDaysInPast } = require('../../config');
const transactionService = require('./transactions-service');
const contactService = require('../contacts/contacts-service');
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

  const cleanedFields = sanitizeFields({
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

  const newTransaction = convertToOriginalTypes(cleanedFields);

  // Orchestrator in transactionOrchestrator file.
  const balanceResponse = await handleChargesAndPayments(db, newTransaction);
  const updatedAccountInfo = await contactService.getContactInfo(db, newTransaction.company);

  res.send({
    balanceResponse,
    updatedAccountInfo,
    message: 'Transaction and account updated successfully.',
    status: 200,
  });
});

module.exports = transactionsRouter;

const convertToOriginalTypes = newTransaction => {
  return {
    company: Number(newTransaction.company),
    job: Number(newTransaction.job),
    employee: Number(newTransaction.employee),
    transactionType: newTransaction.transactionType,
    transactionDate: newTransaction.transactionDate,
    quantity: Number(newTransaction.quantity).toFixed(1),
    unitOfMeasure: newTransaction.unitOfMeasure,
    unitTransaction: Number(newTransaction.unitTransaction).toFixed(2),
    totalTransaction: Number(newTransaction.totalTransaction).toFixed(2),
    discount: Number(newTransaction.discount),
    invoice: Number(newTransaction.invoice),
    paymentApplied: Boolean(newTransaction.paymentApplied),
    ignoreInAgeing: Boolean(newTransaction.ignoreInAgeing),
  };
};
