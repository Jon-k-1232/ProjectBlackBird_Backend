const transactionService = require('./transactions-service');
const invoiceService = require('../invoice/invoice-service');
const contactService = require('../contacts/contacts-service');

const handleChargesAndPayments = async (db, newTransaction) => {
  const contactRecordArray = await contactService.getContactInfo(db, newTransaction.company);
  const contactRecord = contactRecordArray[0];

  const invoiceRecordArray = await invoiceService.getSingleCompanyInvoice(db, newTransaction);
  const invoiceRecord = invoiceRecordArray[0];

  if (newTransaction.transactionType === 'Charge' || newTransaction.transactionType === 'Time') {
    // Insures that all charges and Time charges are positive
    if (newTransaction.totalTransaction <= 0) newTransaction.totalTransaction = Math.abs(newTransaction.totalTransaction);
    const contactRecordUpdate = updateCompanyTotal(contactRecord, newTransaction);
    await contactService.updateThreeCompanyColumns(db, contactRecordUpdate);
    await transactionService.insertNewTransaction(db, newTransaction);
    return newTransaction;
  }

  if (newTransaction.transactionType === 'Payment' || newTransaction.transactionType === 'Write Off') {
    // ToDo need check for if invoice or not.
    // Insures that all Payments and WriteOffs are negative
    if (newTransaction.totalTransaction >= 0) newTransaction.totalTransaction = -Math.abs(newTransaction.totalTransaction);
    const contactRecordPaymentChange = updateCompanyTotal(contactRecord, newTransaction);
    const invoiceRecordChange = invoiceRecord && newTransaction.invoice ? updateInvoice(invoiceRecord, newTransaction) : newTransaction;
    await contactService.updateThreeCompanyColumns(db, contactRecordPaymentChange);
    invoiceRecord && (await invoiceService.updateCompanyInvoice(db, invoiceRecordChange));
    await transactionService.insertNewTransaction(db, newTransaction);
    return invoiceRecordChange;
  }

  if (newTransaction.transactionType === 'Adjustment') {
    const contactRecordPaymentChange = updateCompanyTotal(contactRecord, newTransaction);
    await contactService.updateThreeCompanyColumns(db, contactRecordPaymentChange);
    await transactionService.insertNewTransaction(db, newTransaction);
    return newTransaction;
  }
};

module.exports = handleChargesAndPayments;

const updateInvoice = (invoiceRecord, newTransaction) => {
  const unPaidBalance = (Number(invoiceRecord.unPaidBalance) + Number(newTransaction.totalTransaction)).toFixed(2);
  return { ...invoiceRecord, unPaidBalance };
};

const updateCompanyTotal = (contactRecord, newTransaction) => {
  const newBalance = (Number(contactRecord.currentBalance) + Number(newTransaction.totalTransaction)).toFixed(2);
  const updateProperties = {
    currentBalance: newBalance,
    newBalance: newBalance === 0 ? false : true,
    balanceChanged: true,
  };

  return { ...contactRecord, ...updateProperties };
};
