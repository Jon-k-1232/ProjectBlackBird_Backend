const express = require('express');
const jobRouter = express.Router();
const jobService = require('./job-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');

// Get all jobs for a company
jobRouter.route('/all/:company').get(async (req, res) => {
	const company = req.params.company;
	const db = req.app.get('db');

	jobService.getJobs(db, company).then(allJobsForCompany => {
		const arrayOfIds = allJobsForCompany.map(item => item.jobdefinition);

		jobService.getJobDetail(db, arrayOfIds).then(details => {
			// Helper function maps jobDetails to each job
			const jobs = helperFunctions.addProperty(
				allJobsForCompany,
				details,
				'jobDefinitionDetails',
				'oid',
				'jobdefinition',
			);

			res.send({
				jobs,
				status: 200,
			});
		});
	});
});

module.exports = jobRouter;
