const express = require('express');
const employeeRouter = express.Router();
const employeeService = require('./employee-service');

// Returns all employees active and inactive
employeeRouter.route('/all').get(async (req, res) => {
	const db = req.app.get('db');

	employeeService.getAllEmployees(db).then(employees => {
		res.send({
			employees,
			status: 200,
		});
	});
});

// Returns all active employees
employeeRouter.route('/allActiveEmployees').get(async (req, res) => {
	const db = req.app.get('db');

	employeeService.getActiveEmployees(db).then(activeEmployeeList => {
		res.send({
			activeEmployeeList,
			status: 200,
		});
	});
});

module.exports = employeeRouter;
