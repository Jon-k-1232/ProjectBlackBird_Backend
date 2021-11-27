const employeeService = {
	getAllEmployees(db) {
		return db.select().table('employee');
	},

	getActiveEmployees(db) {
		return db.select().from('employee').whereIn('inactive', [false]);
	},
};

module.exports = employeeService;
