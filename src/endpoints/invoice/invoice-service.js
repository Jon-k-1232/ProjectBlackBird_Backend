const invoiceService = {
	/**
	 * @param {*} db takes in db
	 * @param {*} time company OID
	 * @returns returns a list of jobs for user input company
	 */
	getCompanyInvoices(db, companyId) {
		return db.select().from('invoice').whereIn('company', [companyId]);
	},

	/**
	 *
	 * @param {*} db
	 * @returns All new invoices for companies that have balances greater than zero. Used for end of month statements
	 */
	getNewInvoices(db) {
		return db
			.select()
			.from('invoice')
			.where('endingbalance', '>', 0)
			.orWhere('totalnewcharges', '>', 0)
			.orWhere('unpaidbalance', '>', 0);
	},
};

module.exports = invoiceService;
