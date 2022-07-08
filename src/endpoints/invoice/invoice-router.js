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

/**
 *
 */
invoiceRouter.route('/outstandingInvoices/:oid').get(async (req, res) => {
  const db = req.app.get('db');
  const { oid } = req.params;

  invoiceService.getOutstandingCompanyInvoice(db, Number(oid)).then(outstandingInvoiceForCompany => {
    if (outstandingInvoiceForCompany.length) {
      const { oid, invoiceNumber, unPaidBalance, invoiceDate, paymentDueDate } = outstandingInvoiceForCompany[0];

      const outstandingInvoices = {
        oid: oid,
        invoiceNumber: invoiceNumber,
        unPaidBalance: unPaidBalance,
        invoiceDate: invoiceDate,
        paymentDueDate: paymentDueDate,
      };

      res.send({
        outstandingInvoices,
        status: 200,
      });
    } else {
      const outstandingInvoices = {};
      res.send({
        outstandingInvoices,
        status: 200,
      });
    }
  });
});

invoiceRouter.route('/single/:invoiceId/:companyId').get(async (req, res) => {
  const invoice = req.params.invoiceId;
  const company = req.params.companyId;
  const dataToPass = { invoice, company };
  const db = req.app.get('db');

  const returnedInvoice = await invoiceService.getSingleCompanyInvoice(db, dataToPass);
  const invoiceDetails = await invoiceService.getInvoiceDetail(db, [returnedInvoice[0].oid]);

  res.send({
    returnedInvoice,
    invoiceDetails,
    status: 200,
  });
});

/**
 * Updates and Invoice that already exists
 */
invoiceRouter.route('/updateInvoice').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');

  const {
    oid,
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

  const cleanedFields = sanitizeFields({
    oid,
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

  const invoiceData = convertToOriginalTypes(cleanedFields);

  await invoiceService.updateWholeCompanyInvoice(db, invoiceData.invoiceNumber, invoiceData).then(invoiceConfirmed => {
    res.send({
      item: invoiceConfirmed,
      message: 'Transaction and account updated successfully.',
      status: 200,
    });
  });
});

module.exports = invoiceRouter;

const convertToOriginalTypes = invoice => {
  return {
    company: Number(invoice.company),
    invoiceNumber: Number(invoice.invoiceNumber),
    contactName: invoice.contactName,
    address1: invoice.address1,
    address2: invoice.address2,
    address3: invoice.address3,
    address4: invoice.address4,
    address5: invoice.address5,
    beginningBalance: Number(invoice.beginningBalance),
    totalPayments: Number(invoice.totalPayments),
    totalNewCharges: Number(invoice.totalNewCharges),
    endingBalance: Number(invoice.endingBalance),
    unPaidBalance: Number(invoice.unPaidBalance),
    invoiceDate: invoice.invoiceDate,
    paymentDueDate: invoice.paymentDueDate,
    dataEndDate: invoice.dataEndDate,
  };
};
