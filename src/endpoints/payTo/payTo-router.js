const express = require('express');
const payToRouter = express.Router();
const payToService = require('./payTo-service');

// Gets most recent 'pay to' record
payToRouter.route('/recent').get(async (req, res) => {
	const db = req.app.get('db');

	payToService.getpayToInfo(db).then(payToInfo => {
		const payToMostRecent = payToInfo.pop();
		res.send({
			payToMostRecent,
			status: 200,
		});
	});
});

module.exports = payToRouter;
