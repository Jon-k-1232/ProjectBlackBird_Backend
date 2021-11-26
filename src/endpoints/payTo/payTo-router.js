const express = require('express');
const payToRouter = express.Router();
const payTo = require('./payTo-service');

payToRouter.route('/recent').get(async (req, res) => {
	const db = req.app.get('db');

	payTo.getpayToInfo(db).then((payToInfo) => {
		const payToMostRecent = payToInfo.pop();
		res.send({
			payToMostRecent,
			status: 200,
		});
	});
});

module.exports = payToRouter;
