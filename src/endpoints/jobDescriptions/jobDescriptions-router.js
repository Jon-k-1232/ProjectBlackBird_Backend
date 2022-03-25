const express = require('express');
const jobDescriptionsRouter = express.Router();
const jobDescriptionService = require('./jobDescriptions-service');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');

/**
 * Gets all job descriptions
 */
jobDescriptionsRouter.route('/all').get(async (req, res) => {
  const db = req.app.get('db');

  jobDescriptionService.getAllJobDescriptions(db).then(allJobDescriptions => {
    res.send({
      allJobDescriptions,
      status: 200,
    });
  });
});

/**
 * Adds a new Job Description
 */
jobDescriptionsRouter.route('/new/addNewDescription').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { description, defaultTargetPrice, billable } = req.body;

  const newJobDescription = sanitizeFields({
    description,
    defaultTargetPrice,
    billable,
  });

  jobDescriptionService.insertNewJobDescription(db, newJobDescription).then(() => {
    res.send({
      message: 'Job description added successfully.',
      status: 200,
    });
  });
});

/**
 * Updates a Job Description with a given oid. Param is a Integer
 */
jobDescriptionsRouter.route('/update/jobDescription/:descriptionId').put(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { descriptionId } = req.params;
  const { description, defaultTargetPrice, billable } = req.body;

  const updatedDescription = sanitizeFields({
    description,
    defaultTargetPrice,
    billable,
  });

  jobDescriptionService.updateJobDescription(db, descriptionId, updatedDescription).then(() => {
    jobDescriptionService.getAllJobDescriptions(db).then(jobDescriptions => {
      res.send({
        jobDescriptions,
        message: 'Job description updated',
        status: 200,
      });
    });
  });
});
module.exports = jobDescriptionsRouter;
