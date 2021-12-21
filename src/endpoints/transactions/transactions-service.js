const transactionService = {
	/**
	 *  All transactions that are between user selected days and now.
	 * @param {*} db takes in db
	 * @param {*} date Integer, days to go back. example: 6
	 * @param {*} now todays rolling date - end of day
	 * @returns [{},{}]
	 */
	getTransactions(db, now, date) {
		return db.select().from('transaction').whereBetween('transactiondate', [date, now])
	},

	/**
	 * Transactions from a user selected company between today and a time in day a user selects
	 * @param {*} db takes in db
	 * @param {*} company company oid
	 * @param {*} now todays rolling date - end of day
	 * @param {*} date Integer, days to go back. example: 6
	 * @returns [{},{}]
	 */
	getCompanyTransactions(db, company, now, date) {
		return db.select().from('transaction').whereIn('company', [company]).whereBetween('transactiondate', [date, now])
	},

	/**
	 * inserts new transaction for a company
	 * @param {*} db
	 * @param {*} newTransaction {}
	 * @returns [{},{}]
	 */
	insertNewTransaction(db, newTransaction) {
		return db.insert(newTransaction).returning('*').into('transaction')
	},
}

module.exports = transactionService
