const express = require('express');
const transactionsRouter = express.Router();
const transactions = require('./transactions-service');
const dayjs = require('dayjs');

/**
 * All Transactions within a given time frame- in days.
 * @:time - time in past whole days. example: 6 will get past 6 days
 */
transactionsRouter.route('/all/:time').get(async (req, res) => {
	const db = req.app.get('db');
	const time = req.params.time;
	const timeBetween = timeCalculator(time);

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
		const timeBetween = timeCalculator(time);

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

/**
 * Helpper function to help subtract a user given time in days from todays date.
 * @param {*} time
 * @returns an object with todays date, and the calculated date
 */
const timeCalculator = time => {
	const now = dayjs().format('MM/DD/YYYY HH:mm:ss');
	const date = dayjs()
		.subtract(time, 'days')
		.startOf('days')
		.format('MM/DD/YYYY HH:mm:ss');
	return { date, now };
};
