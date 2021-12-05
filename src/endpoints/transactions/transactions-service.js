const transactions = {
	/**
	 * @param {*} db takes in db
	 * @param {*} date Integer, days to go back. example: 6
	 * @param {*} now todays rolling date - end of day
	 * @returns transactions that are between user selected days and now.
	 */
	getTransactions(db, now, date) {
		return db
			.select()
			.from('transaction')
			.whereBetween('transactiondate', [date, now]);
	},

	getCompanyTransactions(db, company, now, date) {
		return db
			.select()
			.from('transaction')
			.whereIn('company', [company])
			.whereBetween('transactiondate', [date, now]);
	},
};

module.exports = transactions;
