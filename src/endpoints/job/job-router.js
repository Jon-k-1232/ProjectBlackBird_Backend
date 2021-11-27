const express = require('express');
const jobRouter = express.Router();
const jobService = require('./job-service');

jobRouter.route('/all/:company').get(async (req, res) => {
	const company = req.params.company;
	const db = req.app.get('db');

	jobService.getJobs(db, company).then(allJobsForCompany => {
		res.send({
			allJobsForCompany,
			status: 200,
		});
	});
});

module.exports = jobRouter;
