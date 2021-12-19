const createInvoiceService = {
	/**
	 * Gets all paid to data
	 * @param {*} db
	 * @returns [{},{}] array of objects. Each object is a 'pay to' record
	 */
	getInvoiceNumber(db) {
		return db
			.select('invoicenumber')
			.from('invoice')
			.where('invoicenumber', '>', '');
	},

	getReadyToBill(db) {
		return db.select().from('company').where('currentbalance', '>', '0');
	},

	getMostRecentInvoice(db, companyId) {
		return db.select().from('invoice').whereIn('company', [companyId]);
	},

	getAllTransactions(db, lastInvoiceDate, now, companyId) {
		return db
			.select()
			.from('transaction')
			.innerJoin('job', 'transaction.job', '=', 'job.oid')
			.whereIn('transaction.company', [companyId])
			.whereBetween('transactiondate', [lastInvoiceDate, now]);
	},
};

module.exports = createInvoiceService;

/**
 * getContactInfo(db, companyId) {
		return db.select().from('company').whereIn('oid', [companyId]);
	},

	getMostRecentInvoice(db, companyId) {
		return db.select().from('invoice').whereIn('company', [companyId]);
	},

	getAllTransactions(db, lastInvoiceDate, now, companyId) {
		return db
			.select()
			.from('transaction')
			.whereIn('company', [companyId])
			.whereBetween('transactiondate', [lastInvoiceDate, now]);
	},

	getAllMatchingJobs(db, jobs) {
		return db.select().from('job').whereIn('job', [companyId]);
	},

		getJobsWithTransactions(db, contactId) {
		return db
			.from('job')
			.innerJoin('invoice', 'company.oid', 'invoices.company')
			.where('company.oid', [contactId]);
	},
 */
