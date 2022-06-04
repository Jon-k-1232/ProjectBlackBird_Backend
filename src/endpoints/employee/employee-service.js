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

  /**
   *
   * @param {*} db
   * @param {*} employeeId
   * @returns
   */
  getEmployee(db, employeeId) {
    return db.select().from('employee').whereIn('oid', [employeeId]);
  },

  /**
   * Updates employee record
   * @param {*} db
   * @param {*} employeeId int
   * @param {*} updatedEmployee {}
   * @returns
   */
  updateEmployee(db, employeeId, updatedEmployee) {
    return db.update(updatedEmployee).from('employee').where('oid', employeeId);
  },

  /**
   * Create new employee
   * @param {*} db
   * @param {*} newEmployee {}
   * @returns
   */
  insertEmployee(db, newEmployee) {
    return db.insert(newEmployee).returning('*').into('employee');
  },
};

module.exports = employeeService;
