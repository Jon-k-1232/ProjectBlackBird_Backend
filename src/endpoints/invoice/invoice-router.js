const express = require('express');
const invoiceRouter = express.Router();
const invoiceService = require('./invoice-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');

invoiceRouter.route('/all/time/:time').get(async (req, res) => {
  const db = req.app.get('db');
  const time = parseInt(req.params.time, 10) ? parseInt(req.params.time, 10) : 1095;
  const timeBetween = helperFunctions.timeSubtractionFromTodayCalculator(time);

  invoiceService.getAllInvoices(db, timeBetween.currDate, timeBetween.prevDate).then(invoices => {
    res.send({
      invoices,
      status: 200,
    });
  });
});

// Gets all invoices + invoice detail for a specific company
invoiceRouter.route('/all/company/:company').get(async (req, res) => {
  const company = parseInt(req.params.company, 10);
  const db = req.app.get('db');

  invoiceService.getCompanyInvoices(db, company).then(invoicesWithNoDetail => {
    res.send({
      invoicesWithNoDetail,
      status: 200,
    });
  });
});

// Gets all invoices that have a balance
invoiceRouter.route('/newInvoices').get(async (req, res) => {
  const db = req.app.get('db');

  invoiceService.getNewInvoices(db).then(newBalanceInvoices => {
    const arrayOfIds = newBalanceInvoices.map(item => item.oid);

    invoiceService.getInvoiceDetail(db, arrayOfIds).then(details => {
      // Mapping invoice detail to each of the matching invoices
      const newInvoices = helperFunctions.addProperty(newBalanceInvoices, details, 'invoiceDetails', 'invoice', 'oid');

      res.send({
        newInvoices,
        status: 200,
      });
    });
  });
});

// ToDo make a manual entery for a user. will need to take in invoice details, invoice insert, and update contact financials
invoiceRouter.route('/a/a/a').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const {
    company,
    invoiceNumber,
    contactName,
    address1,
    address2,
    address3,
    address4,
    address5,
    beginningBalance,
    totalPayments,
    totalNewCharges,
    endingBalance,
    unPaidBalance,
    invoiceDate,
    paymentDueDate,
    dataEndDate,
  } = req.body;

  const newInvoice = sanitizeFields({
    company,
    invoiceNumber,
    contactName,
    address1,
    address2,
    address3,
    address4,
    address5,
    beginningBalance,
    totalPayments,
    totalNewCharges,
    endingBalance,
    unPaidBalance,
    invoiceDate,
    paymentDueDate,
    dataEndDate,
  });

  invoiceService.insertNewInvoice(db, newInvoice).then(() => {
    res.send({ message: 'invoice added successfully.', status: 200 });
  });
});

module.exports = invoiceRouter;
