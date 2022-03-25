const invoiceService = {
  /**
   * Gets a list of invoices for user provided company
   * @param {*} db takes in db
   * @param {*} time company OID
   * @returns [{},{}] Array of objects.
   */
  getCompanyInvoices(db, companyId) {
    return db.select().from('invoice').whereIn('company', [companyId]);
  },

  /**
   * Finds invoice details with invoice OID in invoices column
   * @param {*} db takes in db
   * @param {*} arrayOfIds Array of OIDs [1,2,3]
   * @returns [{},{}] Array of objects. Array of invoice details.
   * Each object is a new invoice detail. EACH DETAIL NEEDS PAIRED TO AN INVOICE UPON RETURN
   */
  getInvoiceDetail(db, arrayOfIds) {
    return db.select().from('invoiceDetail').whereIn('invoice', arrayOfIds);
  },

  /**
   * Gets all items that are showing a balance
   * @param {*} db
   * @returns All new invoices for companies that have balances greater than zero. Used for end of month statements
   */
  getNewInvoices(db) {
    return db.select().from('invoice').where('endingBalance', '>', 0).orWhere('totalNewCharges', '>', 0).orWhere('unpaidbalance', '>', 0);
  },

  /**
   * Insert a new invoice for a company
   * @param {*} db
   * @param {*} newInvoice {}
   * @returns
   */
  insertNewInvoice(db, newInvoice) {
    return db.insert(newInvoice).returning('*').into('invoice');
  },
};

module.exports = invoiceService;
