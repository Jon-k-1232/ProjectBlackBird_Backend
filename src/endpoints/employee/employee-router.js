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

  employeeService.getActiveEmployees(db).then(employees => {
    res.send({
      employees,
      status: 200,
    });
  });
});

employeeRouter.route('/findEmployee/:employeeId').get(async (req, res) => {
  const db = req.app.get('db');
  const employeeId = Number(req.params.employeeId);

  employeeService.getEmployee(db, employeeId).then(employee => {
    res.send({
      employee,
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

  const sanitizeEmployee = sanitizeFields({
    firstName,
    lastName,
    middleI,
    hourlyCost,
    inactive,
  });

  const newEmployee = convertToOriginalTypes(sanitizeEmployee);

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
employeeRouter.route('/update/employee/:employeeId').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { employeeId } = req.params;
  const id = Number(employeeId);
  const { firstName, lastName, middleI, hourlyCost, inactive } = req.body;

  const sanitizeEmployee = sanitizeFields({
    firstName,
    lastName,
    middleI,
    hourlyCost,
    inactive,
  });

  const updatedEmployee = convertToOriginalTypes(sanitizeEmployee);

  employeeService.updateEmployee(db, id, updatedEmployee).then(() => {
    employeeService.getAllEmployees(db).then(employees => {
      res.send({
        employees,
        message: 'Employee updated',
        status: 200,
      });
    });
  });
});

module.exports = employeeRouter;

const convertToOriginalTypes = sanitizeEmployee => {
  return {
    firstName: sanitizeEmployee.firstName,
    lastName: sanitizeEmployee.lastName,
    middleI: sanitizeEmployee.middleI,
    hourlyCost: Number(sanitizeEmployee.hourlyCost),
    inactive: Boolean(sanitizeEmployee.inactive),
  };
};
