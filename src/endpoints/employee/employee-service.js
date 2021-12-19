const employeeService = {
	/**
	 * Gets all employees
	 * @param {*} db
	 * @returns [{},{}] Array of objects. Each object is an employee
	 */
	getAllEmployees(db) {
		return db.select().table('employee');
	},

	/**
	 * Gets only active employees
	 * @param {*} db
	 * @returns [{},{}] Array of objects. Each object is an employee
	 */
	getActiveEmployees(db) {
		return db.select().from('employee').whereIn('inactive', [false]);
	},

	updateEmployee(db, employeeId, updatedEmployee) {
		return db
			.insert()
			.from('employee')
			.where('oid', employeeId)
			.update(updatedEmployee);
	},

	insertEmployee(db, newEmployee) {
		return db.insert(newEmployee).returning('*').into('employee');
	},
};

module.exports = employeeService;
