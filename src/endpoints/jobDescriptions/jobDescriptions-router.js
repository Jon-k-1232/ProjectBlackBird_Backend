const express = require('express');
const jobDescriptionsRouter = express.Router();
const jobDescriptionService = require('./jobDescriptions-service');

// Gets all job descriptions
jobDescriptionsRouter.route('/all').get(async (req, res) => {
	const db = req.app.get('db');

	jobDescriptionService.getAllJobDescriptions(db).then(allJobDescriptions => {
		res.send({
			allJobDescriptions,
			status: 200,
		});
	});
});

module.exports = jobDescriptionsRouter;
