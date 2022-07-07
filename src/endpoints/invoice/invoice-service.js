const dayjs = require('dayjs');

const invoiceService = {
  /**
   * Gets all invoices
   * @param {*} db
   * @returns
   */
  getAllInvoices(db, currDate, prevDate) {
    return db.select().from('invoice').whereBetween('invoiceDate', [prevDate, currDate]);
  },

  /**
   * Gets a list of invoices for user provided company
   * @param {*} db takes in db
   * @param {*} time company OID
   * @returns [{},{}] Array of objects.
   */
  getCompanyInvoices(db, companyId) {
    return db.select().from('invoice').whereIn('company', [companyId]);
  },

  getSingleCompanyInvoice(db, companyDetails) {
    const { company, invoice } = companyDetails;
    return db.select().from('invoice').whereIn('invoiceNumber', [invoice]).whereIn('company', [company]);
  },

  getInvoiceByInvoiceId(db, invoiceId) {
    return db.select().from('invoice').whereIn('invoiceNumber', [invoiceId]);
  },

  getCompanyInvoicesBetweenDates(db, companyId, invoiceTimes) {
    const { prevDate, currDate } = invoiceTimes;
    return db.select().from('invoice').whereIn('company', [companyId]).whereBetween('invoiceDate', [prevDate, currDate]);
  },

  getCompanyPaidInvoicesBetweenDates(db, companyId, invoiceTimes) {
    const { prevDate, currDate } = invoiceTimes;

    return db
      .select()
      .from('invoice')
      .whereIn('invoice.company', [companyId])
      .whereBetween('invoice.invoiceDate', [prevDate, currDate])
      .innerJoin('transaction', 'invoice.oid', '=', 'transaction.invoice')
      .where('transaction.transactionType', 'Payment');
  },

  /**
   * Finds invoice details with invoice OID in invoices column
   * @param {*} db takes in db
   * @param {*} arrayOfIds Array of OIDs [1,2,3]
   * @returns [{},{}] Array of objects. Array of invoice details.
   * Each object is a new invoice detail. EACH DETAIL NEEDS PAIRED TO AN INVOICE UPON RETURN
   */
  getInvoiceDetail(db, arrayOfIds) {
    return db.select().from('invoicedetail').whereIn('invoice', arrayOfIds);
  },

  /**
   * Gets all items that are showing a balance
   * @param {*} db
   * @returns All new invoices for companies that have balances greater than zero. Used for end of month statements
   */
  getNewInvoices(db) {
    return db.select().from('invoice').where('endingBalance', '>', 0).orWhere('totalNewCharges', '>', 0).orWhere('unPaidBalance', '>', 0);
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

  insertNewInvoiceDetails(db, job) {
    return db.insert(job).returning('*').into('invoicedetail');
  },

  updateCompanyInvoice(db, invoiceRecord) {
    const { oid, unPaidBalance, invoiceNumber } = invoiceRecord;
    return db.update('unPaidBalance', unPaidBalance).from('invoice').where('oid', oid).where('invoiceNumber', invoiceNumber);
  },

  updateWholeCompanyInvoice(db, invoiceNumber, invoiceData) {
    return db.update(invoiceData).into('invoice').where('invoiceNumber', invoiceNumber).returning('*');
  },

  getOutstandingCompanyInvoice(db, oid) {
    return db.select().from('invoice').where('company', oid).where('unPaidBalance', '>', 0);
  },

  getCreditedCompanyAmounts(db, oid) {
    return db.select().from('invoice').where('company', oid).where('unPaidBalance', '<', 0);
  },

  getMostRecentCompanyInvoiceNumber(db, oid) {
    return db.select().from('invoice').where('company', oid).max('invoiceNumber');
  },

  getMostRecentCompanyInvoice(db, oid, invoiceNumber) {
    return db.select().from('invoice').whereIn('invoiceNumber', [invoiceNumber]).whereIn('company', [oid]);
  },
};

module.exports = invoiceService;
