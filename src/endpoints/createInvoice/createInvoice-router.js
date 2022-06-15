const express = require('express');
const createInvoiceRouter = express.Router();
const createInvoiceService = require('./createInvoice-service');
const createNewInvoice = require('./createInvoiceOrchestrator');
const contactService = require('../contacts/contacts-service');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');
const { read } = require('pdfkit');

// createInvoiceRouter.route('/download').get(async (req, res) => {
//   // here we assigned the name to our downloaded file!
//   const file_after_download = 'downloaded_file.zip';

//   res.set('Content-Type', 'application/octet-stream');
//   res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
//   res.download(`${__dirname}/pdf_holder/${dayjs().format('YYYY-MM-DD')}/output.zip`);
// });

/**
 * Multi invoice
 */
createInvoiceRouter.route('/createAllInvoices').get(async (req, res) => {
  const db = req.app.get('db');

  const readyToBillContacts = await createInvoiceService.getReadyToBill(db);
  const newInvoices = await Promise.all(readyToBillContacts.map((contactRecord, i) => createNewInvoice(contactRecord, i, db)));
  res.send({ newInvoices });
});

/**
 * List of invoice ready to bill. User to select which to create
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
 * single invoice
 */
createInvoiceRouter.route('/createInvoice').get(async (req, res) => {
  const db = req.app.get('db');
  const readyToBillContacts = await contactService.getContactInfo(db, 245);

  const newInvoice = await Promise.all(readyToBillContacts.map((contactRecord, i) => createNewInvoice(contactRecord, i, db)));
  res.send({ newInvoice });
});

module.exports = createInvoiceRouter;
