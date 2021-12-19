const express = require('express');
const employeeRouter = express.Router();
const employeeService = require('./employee-service');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');

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

/**
 * New Employee
 */
employeeRouter.route('/new/employee').post(jsonParser, async (req, res) => {
	const db = req.app.get('db');
	const {
		firstname,
		lastname,
		middlei,
		ssn,
		employeenumber,
		address1,
		address2,
		city,
		state,
		zip,
		homephone,
		mobilephone,
		workphone,
		pager,
		fax,
		otherphone,
		contact,
		startdate,
		availabledate,
		hourlycost,
		inactive,
		note,
		passwrd,
		usertype,
		username,
	} = req.body;

	const newEmployee = sanitizeFields({
		firstname,
		lastname,
		middlei,
		ssn,
		employeenumber,
		address1,
		address2,
		city,
		state,
		zip,
		homephone,
		mobilephone,
		workphone,
		pager,
		fax,
		otherphone,
		contact,
		startdate,
		availabledate,
		hourlycost,
		inactive,
		note,
		passwrd,
		usertype,
		username,
	});

	employeeService.insertEmployee(db, newEmployee).then(() => {
		res.send({
			message: 'New employee added',
			status: 200,
		});
	});
});

/**
 * Update employee
 */
employeeRouter
	.route('/update/employee/:employeeId')
	.put(jsonParser, async (req, res) => {
		const db = req.app.get('db');
		const { employeeId } = req.params;
		const {
			firstname,
			lastname,
			middlei,
			ssn,
			employeenumber,
			address1,
			address2,
			city,
			state,
			zip,
			homephone,
			mobilephone,
			workphone,
			pager,
			fax,
			otherphone,
			contact,
			startdate,
			availabledate,
			hourlycost,
			inactive,
			note,
			passwrd,
			usertype,
			username,
		} = req.body;

		const updatedEmployee = sanitizeFields({
			firstname,
			lastname,
			middlei,
			ssn,
			employeenumber,
			address1,
			address2,
			city,
			state,
			zip,
			homephone,
			mobilephone,
			workphone,
			pager,
			fax,
			otherphone,
			contact,
			startdate,
			availabledate,
			hourlycost,
			inactive,
			note,
			passwrd,
			usertype,
			username,
		});

		employeeService.updateEmployee(db, employeeId, updatedEmployee).then(() => {
			res.send({
				message: 'Employee updated',
				status: 200,
			});
		});
	});

module.exports = employeeRouter;
