const express = require('express');
const jobRouter = express.Router();
const jobService = require('./job-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');

// Get all jobs for a company
jobRouter.route('/all/:company/:time').get(async (req, res) => {
	const db = req.app.get('db');
	const company = req.params.company;
	const time = req.params.time;
	const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

	jobService
		.getJobs(db, company, timeBetween.now, timeBetween.date)
		.then(allJobsForCompany => {
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

jobRouter.route('/allJobs/:time').get(async (req, res) => {
	const db = req.app.get('db');
	const time = req.params.time;
	const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

	jobService
		.getAllJobs(db, timeBetween.now, timeBetween.date)
		.then(allJobsWithinTimeframe => {
			res.send({
				allJobsWithinTimeframe,
				status: 200,
			});
		});
});

jobRouter.route('/addJob').post(jsonParser, async (req, res) => {
	const db = req.app.get('db');
	const {
		jobdefinition,
		company,
		targetprice,
		defaulttargetprice,
		scheduleddate,
		startdate,
		actualdate,
		contact,
		contactphone,
		contactemail,
		description,
		defaultdescription,
		percentcomplete,
		discount,
		hourstocomplete,
		iscomplete,
	} = req.body;

	const newJob = sanitizeFields({
		jobdefinition,
		company,
		targetprice,
		defaulttargetprice,
		scheduleddate,
		startdate,
		actualdate,
		contact,
		contactphone,
		contactemail,
		description,
		defaultdescription,
		percentcomplete,
		discount,
		hourstocomplete,
		iscomplete,
	});

	jobService.insertNewJob(db, newJob).then(function () {
		res.send({ message: 'Job added successfully.', status: 200 });
	});
});

module.exports = jobRouter;
