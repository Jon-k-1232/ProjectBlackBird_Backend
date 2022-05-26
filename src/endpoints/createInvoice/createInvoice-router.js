const express = require('express');
const createInvoiceRouter = express.Router();
const createInvoiceService = require('./createInvoice-service');
const dayjs = require('dayjs');
const createNewInvoice = require('./createInvoiceOrchestrator');
const contactService = require('../contacts/contacts-service');

// createInvoiceRouter.route('/download').get(async (req, res) => {
//   // here we assigned the name to our downloaded file!
//   const file_after_download = 'downloaded_file.zip';

//   res.set('Content-Type', 'application/octet-stream');
//   res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
//   res.download(`${__dirname}/pdf_holder/${dayjs().format('YYYY-MM-DD')}/output.zip`);
// });

createInvoiceRouter.route('/createAllInvoices').get(async (req, res) => {
  const db = req.app.get('db');

  const readyToBillContacts = await createInvoiceService.getReadyToBill(db);
  const newInvoices = await Promise.all(readyToBillContacts.map((contactRecord, i) => createNewInvoice(contactRecord, i, db)));
  res.send({ newInvoices });
});

createInvoiceRouter.route('/createInvoice').get(async (req, res) => {
  const db = req.app.get('db');
  const readyToBillContacts = await contactService.getContactInfo(db, 59);

  const newInvoice = await Promise.all(readyToBillContacts.map((contactRecord, i) => createNewInvoice(contactRecord, i, db)));
  res.send({ newInvoice });
});

module.exports = createInvoiceRouter;
