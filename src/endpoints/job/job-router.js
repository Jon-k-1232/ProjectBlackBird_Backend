const express = require('express');
const jobRouter = express.Router();
const jobService = require('./job-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');

// Get all jobs for a company
jobRouter.route('/all/:company/:time').get(async (req, res) => {
  const db = req.app.get('db');
  const company = parseInt(req.params.company, 10);
  const time = parseInt(req.params.time, 10) ? parseInt(req.params.time, 10) : 730;
  const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

  jobService.getJobs(db, company, timeBetween.currDate, timeBetween.prevDate).then(allJobsForCompany => {
    const arrayOfIds = allJobsForCompany.map(item => item.jobDefinition);

    jobService.getJobDetail(db, arrayOfIds).then(details => {
      // Helper function maps jobDetails to each job
      const jobs = helperFunctions.addProperty(allJobsForCompany, details, 'jobDefinitionDetails', 'oid', 'jobDefinition');

      res.send({
        jobs,
        status: 200,
      });
    });
  });
});

/**
 * Gets all jobs for a specific time by 'days'. Today - x days
 */
jobRouter.route('/allJobs/:time').get(async (req, res) => {
  const db = req.app.get('db');
  const time = parseInt(req.params.time, 10) ? parseInt(req.params.time, 10) : 730;
  console.log(time);
  const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

  jobService.getAllJobs(db, timeBetween.currDate, timeBetween.prevDate).then(allJobsWithinTimeframe => {
    res.send({
      allJobsWithinTimeframe,
      status: 200,
    });
  });
});

/**
 * Add a job for a client
 */
jobRouter.route('/addJob').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const {
    jobDefinition,
    company,
    targetPrice,
    defaultTargetPrice,
    startDate,
    actualDate,
    contact,
    contactPhone,
    contactEmail,
    description,
    defaultDescription,
    isComplete,
  } = req.body;

  const newJob = sanitizeFields({
    jobDefinition,
    company,
    targetPrice,
    defaultTargetPrice,
    startDate,
    actualDate,
    contact,
    contactPhone,
    contactEmail,
    description,
    defaultDescription,
    isComplete,
  });

  jobService.insertNewJob(db, newJob).then(function () {
    res.send({ message: 'Job added successfully.', status: 200 });
  });
});

module.exports = jobRouter;
