const express = require('express');
const createInvoiceRouter = express.Router();
const createInvoiceService = require('./createInvoice-service');
const invoiceService = require('./../invoice/invoice-service');
const transactionService = require('./../transactions/transactions-service');
const createNewInvoice = require('./createInvoiceOrchestrator');
const pdfAndZipFunctions = require('../../pdfCreator/pdfOrchestrator');
const { defaultPdfSaveLocation } = require('../../config');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');

/**
 * List of invoice ready to bill. User to select which invoices to create
 */
createInvoiceRouter.route('/createInvoices/readyToBill').get(async (req, res) => {
  const db = req.app.get('db');

  const readyToBillContacts = await createInvoiceService.getReadyToBill(db);
  res.send({
    readyToBillContacts,
    status: 200,
  });
});

/**
 * User selected invoices, create invoices
 */
createInvoiceRouter.route('/createInvoices/readyToBill/:list').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const list = req.params.list;

  const sanitizedData = sanitizeFields({ list });
  // Since sanitized, list is one giant string, must be separated at commas then converted into ints
  const separatedList = sanitizedData.list.split(',');
  const arrayOfIds = separatedList.map(item => Number(item));

  const newInvoices = await Promise.all(arrayOfIds.map((contactRecord, i) => createNewInvoice(contactRecord, i, db)));
  res.send({
    newInvoices,
    status: 200,
  });
});

/**
 * Zips the pdf files and sends to front end
 */
createInvoiceRouter.route('/download').get(async (req, res) => {
  // Zip the files
  await pdfAndZipFunctions.zipCreate();

  // Assigned the name to downloaded file!
  const file_after_download = 'downloaded_file.zip';

  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
  res.download(`${defaultPdfSaveLocation}/output.zip`);
});

/**
 * DEBUG
 * http://localhost:8000/create/createInvoices/readyToBill/debug
 */
createInvoiceRouter.route('/createInvoices/readyToBill/debug').get(jsonParser, async (req, res) => {
  const db = req.app.get('db');

  const arrayOfIds = [372677];
  // const arrayOfIds = [245];

  const newInvoices = await Promise.all(arrayOfIds.map((contactRecord, i) => createNewInvoice(contactRecord, i, db)));
  res.send({
    newInvoices,
    status: 200,
  });
});

/**
 * Reprint a invoice that already exists
 */
createInvoiceRouter.route('/createInvoices/rePrint/:id').get(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  // Get data from DB to rebuild invoice
  const invoiceId = Number(id);
  const invoiceFromDb = await invoiceService.getInvoiceByInvoiceId(db, invoiceId);
  const invoice = invoiceFromDb[0];
  const transactionsFromDB = await transactionService.getInvoiceTransactions(db, invoice.oid);
  const transactions = transactionsFromDB;
  const payToFromDb = await createInvoiceService.getBillTo(db);
  const payTo = payToFromDb[0];

  // Form object to pass to pdf creator
  const invoiceObject = {
    ...invoice,
    beginningBalance: invoice.beginningBalance.toFixed(2),
    totalPayments: invoice.totalPayments.toFixed(2),
    totalNewCharges: invoice.totalNewCharges.toFixed(2),
    endingBalance: invoice.endingBalance.toFixed(2),
    unPaidBalance: invoice.unPaidBalance.toFixed(2),
    // Unable to get outstanding records at the specific time in history. Would need to create new table to capture unpaid invoices and their balances.
    outstandingInvoiceRecords: [],
    paymentRecords: transactions.filter(trans => trans.transactionType === 'Payment' || trans.transactionType === 'WriteOff'),
    newChargesRecords: transactions.filter(
      trans =>
        trans.transactionType === 'Adjustment' ||
        trans.transactionType === 'Charge' ||
        trans.transactionType === 'Interest' ||
        trans.transactionType === 'Time',
    ),
  };

  // Create Pdf
  await pdfAndZipFunctions.pdfCreate(invoiceObject, payTo);

  res.send({ invoiceObject, status: 200 });
});

module.exports = createInvoiceRouter;
