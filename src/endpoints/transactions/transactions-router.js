const express = require('express');
const transactionsRouter = express.Router();
const transactions = require('./transactions-service');

transactionsRouter.route('/all/:time').get(async (req, res) => {
	const time = req.params.time;
	const db = req.app.get('db');
	transactions.getTransactions(db, time).then(allTransactions => {
		res.send({
			allTransactions,
			status: 200,
		});
	});
});

module.exports = transactionsRouter;
