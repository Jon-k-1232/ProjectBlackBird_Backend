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
  const { firstName, lastName, middleI, hourlyCost, inactive } = req.body;

  const newEmployee = sanitizeFields({
    firstName,
    lastName,
    middleI,
    hourlyCost,
    inactive,
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
employeeRouter.route('/update/employee/:employeeId').put(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { employeeId } = req.params;
  const { firstName, lastName, middleI, hourlyCost, inactive } = req.body;

  const updatedEmployee = sanitizeFields({
    firstName,
    lastName,
    middleI,
    hourlyCost,
    inactive,
  });

  employeeService.updateEmployee(db, employeeId, updatedEmployee).then(() => {
    res.send({
      message: 'Employee updated',
      status: 200,
    });
  });
});

module.exports = employeeRouter;
