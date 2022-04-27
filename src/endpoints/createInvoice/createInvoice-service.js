const createInvoiceService = {
  /**
   * Gets all paid to data
   * @param {*} db
   * @returns [{},{}] array of objects. Each object is a 'pay to' record
   */
  getInvoiceNumber(db) {
    return db.select('invoiceNumber').from('invoice').where('invoiceNumber', '>', '');
  },

  /**
   * Gets all companies that have a balance greater than 0
   * @param {*} db
   * @returns  [{},{}] array of objects. Each object is a 'company' record
   */
  getReadyToBill(db) {
    return db.select().from('company').where('currentBalance', '>', '0');
  },

  /**
   * Gets Jobs and transactions for a company between a given date and current
   * @param {*} db
   * @param {*} lastInvoiceDate
   * @param {*} now
   * @param {*} companyId
   * @returns
   */
  getCompanyTransactionsBetweenDates(db, lastInvoiceDate, now, companyId) {
    return db
      .select()
      .from('transaction')
      .innerJoin('job', 'transaction.job', '=', 'job.oid')
      .whereIn('transaction.company', [companyId])
      .whereBetween('transactionDate', [lastInvoiceDate, now]);
  },

  /**
   *
   * @param {*} db
   * @param {*} invoice
   * @returns
   */
  insertInvoiceDetails(db, invoice) {
    return db.insert(invoice).returning('*').into('invoiceDetail');
  },

  getLastInvoice(db) {
    const lastInvoiceNumber = async () => {
      const allInvoiceNumbers = await db.select('invoiceNumber').from('invoice').where('invoiceNumber', '>', '');
      const lastInvoice = allInvoiceNumbers.pop();
      return Number(lastInvoice.invoiceNumber);
    };

    return lastInvoiceNumber();
  },
};

module.exports = createInvoiceService;
