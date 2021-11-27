const dayjs = require('dayjs');

const transactions = {
	/**
	 * @param {*} db takes in db
	 * @param {*} time user selected param in 'days'
	 * @returns transactions that are between user selected days and now.
	 */
	getTransactions(db, time) {
		const now = dayjs().format('MM/DD/YYYY HH:mm:ss');
		const date = dayjs()
			.subtract(time, 'days')
			.startOf('days')
			.format('MM/DD/YYYY HH:mm:ss');
		return db
			.select()
			.from('transaction')
			.whereBetween('transactiondate', [date, now]);
	},
};

module.exports = transactions;
