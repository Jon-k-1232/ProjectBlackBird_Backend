const payToService = {
  /**
   * Gets all paid to data
   * @param {*} db
   * @returns [{},{}] array of objects. Each object is a 'pay to' record
   */
  getpayToInfo(db) {
    return db.select().table('setupData');
  },

  /**
   * Inserts updated pay to information
   * @param {*} db
   * @param {*} newRecord {}
   * @returns
   */
  insertPayToInfo(db, newRecord) {
    return db.insert(newRecord).returning('*').into('setupData');
  },
};

module.exports = payToService;
