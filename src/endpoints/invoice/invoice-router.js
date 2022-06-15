const express = require('express');
const invoiceRouter = express.Router();
const invoiceService = require('./invoice-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');
const { defaultDaysInPast } = require('../../config');

invoiceRouter.route('/all/time/:time').get(async (req, res) => {
  const db = req.app.get('db');
  const time = Number(req.params.time) ? Number(req.params.time) : defaultDaysInPast;
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
  const company = Number(req.params.company);
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

invoiceRouter.route('/single/:invoiceId/:companyId').get(async (req, res) => {
  const invoice = req.params.invoiceId;
  const company = req.params.companyId;
  const dataToPass = { invoice, company };
  const db = req.app.get('db');

  const returnedInvoice = await invoiceService.getSingleCompanyInvoice(db, dataToPass);
  invoiceService.getInvoiceDetail(db, [returnedInvoice[0].oid]).then(invoiceDetails => {
    res.send({
      returnedInvoice,
      invoiceDetails,
      status: 200,
    });
  });
});

module.exports = invoiceRouter;
