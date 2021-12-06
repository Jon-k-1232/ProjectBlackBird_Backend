const express = require('express');
const transactionsRouter = express.Router();
const transactions = require('./transactions-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');

/**
 * All Transactions within a given time frame- in days.
 * @:time - time in past whole days. example: 6 will get past 6 days
 */
transactionsRouter.route('/all/:time').get(async (req, res) => {
	const db = req.app.get('db');
	const time = req.params.time;
	const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

	transactions
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

		transactions
			.getCompanyTransactions(db, company, timeBetween.now, timeBetween.date)
			.then(sortedCompanyTransactions => {
				res.send({
					sortedCompanyTransactions,
					status: 200,
				});
			});
	});

module.exports = transactionsRouter;
