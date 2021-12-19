const express = require('express');
const transactionsRouter = express.Router();
const transactionService = require('./transactions-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');
const contactService = require('../contacts/contacts-service');
const { idleTimeoutMillis } = require('pg/lib/defaults');

/**
 * All Transactions within a given time frame- in days.
 * @:time - time in past whole days. example: 6 will get past 6 days
 */
transactionsRouter.route('/all/:time').get(async (req, res) => {
	const db = req.app.get('db');
	const time = req.params.time;
	const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

	transactionService
		.getTransactions(db, timeBetween.now, timeBetween.date)
		.then(allTransactions => {
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
transactionsRouter
	.route('/companyTransactions/:company/:time')
	.get(async (req, res) => {
		const db = req.app.get('db');
		// Default time 360 days if user has not provided a time
		const time = req.params.time === 'null' ? 360 : req.params.time;
		const company = req.params.company;
		const timeBetween =
			helperFunctions.timeSubtractionFromTodayCalculator(time);

		transactionService
			.getCompanyTransactions(db, company, timeBetween.now, timeBetween.date)
			.then(sortedCompanyTransactions => {
				res.send({
					sortedCompanyTransactions,
					status: 200,
				});
			});
	});

/**
 *
 */
transactionsRouter
	.route('/new/addNewTransaction')
	.post(jsonParser, async (req, res) => {
		const db = req.app.get('db');
		const {
			company,
			job,
			employee,
			transactiontype,
			transactiondate,
			quantity,
			unitofmeasure,
			unittransaction,
			totaltransaction,
			starttime,
			endtime,
			reference,
			noteordescription,
			discount,
			invoice,
			usertag,
			paymentapplied,
			ignoreinageing,
		} = req.body;

		const newTransaction = sanitizeFields({
			company,
			job,
			employee,
			transactiontype,
			transactiondate,
			quantity,
			unitofmeasure,
			unittransaction,
			totaltransaction,
			starttime,
			endtime,
			reference,
			noteordescription,
			discount,
			invoice,
			usertag,
			paymentapplied,
			ignoreinageing,
		});

		contactService
			.getContactInfo(db, newTransaction.company)
			.then(contactInfo => {
				contactInfo.forEach(contact => {
					if (newTransaction.transactiontype === 'Charge') {
						contact.currentbalance =
							contact.currentbalance + newTransaction.totaltransaction;
						contact.newbalance = true;
						contact.balancechanged = true;
					} else if (newTransaction.transactiontype === 'Payment') {
						contact.currentbalance =
							contact.currentbalance - newTransaction.totaltransaction;
						contact.newbalance = true;
						contact.balancechanged = true;
					}
					return contact;
				});
				contactService
					.updateContact(db, newTransaction.company, contactInfo[0])
					.then(() => {
						transactionService
							.insertNewTransaction(db, newTransaction)
							.then(() => {
								res.send({
									message: 'Transaction and account updated successfully.',
									status: 200,
								});
							});
					});
			});
	});

module.exports = transactionsRouter;
