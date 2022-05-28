const transactionService = {
  /**
   *  All transactions that are between user selected days and now.
   * @param {*} db takes in db
   * @param {*} date Integer, days to go back. example: 6
   * @param {*} now todays rolling date - end of day
   * @returns [{},{}]
   */
  getTransactions(db, currDate, prevDate) {
    return db.select().from('transaction').whereBetween('transactionDate', [prevDate, currDate]);
  },

  /**
   * Transactions from a user selected company between today and a time in day a user selects
   * @param {*} db takes in db
   * @param {*} company company oid
   * @param {*} now todays rolling date - end of day
   * @param {*} date Integer, days to go back. example: 6
   * @returns [{},{}]
   */
  getCompanyTransactions(db, company, currDate, prevDate) {
    return db.select().from('transaction').whereIn('company', [company]).whereBetween('transactionDate', [prevDate, currDate]);
  },

  /**
   * Get transactions for a given job
   * @param {*} db
   * @param {*} jobId
   */
  getJobTransactions(db, companyId, jobId) {
    return db.select().from('job').whereIn('company', [companyId]).whereIn('jobDefinition', [jobId]);
  },

  /**
   * inserts new transaction for a company
   * @param {*} db
   * @param {*} newTransaction {}
   * @returns [{},{}]
   */
  insertNewTransaction(db, newTransaction) {
    return db.insert(newTransaction).returning('*').into('transaction');
  },

  getCompanyTransactionTypeAfterGivenDate(db, companyId, dateInPast, type) {
    return db
      .select()
      .from('transaction')
      .whereIn('company', [companyId])
      .whereIn('transactionType', [type])
      .where('transactionDate', '>', dateInPast);
  },

  getTransactionTypeToday(db, type, oid) {
    const records = db.select().from('transaction').where('company', oid).where('transactionType', type);
    return records;
  },
};

module.exports = transactionService;
