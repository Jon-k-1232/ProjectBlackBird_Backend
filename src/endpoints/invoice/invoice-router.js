const express = require('express');
const invoiceRouter = express.Router();
const invoiceService = require('./invoice-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');

// Gets all invoices + invoice detail for a specific company
invoiceRouter.route('/all/:company').get(async (req, res) => {
	const company = req.params.company;
	const db = req.app.get('db');

	invoiceService.getCompanyInvoices(db, company).then(invoicesWithNoDetail => {
		const arrayOfIds = invoicesWithNoDetail.map(item => item.oid);

		invoiceService.getInvoiceDetail(db, arrayOfIds).then(details => {
			// Mapping invoice detail to each of the matching invoices
			const invoices = helperFunctions.addProperty(
				invoicesWithNoDetail,
				details,
				'invoiceDetails',
				'invoice',
				'oid',
			);

			res.send({
				invoices,
				status: 200,
			});
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
			const newInvoices = helperFunctions.addProperty(
				newBalanceInvoices,
				details,
				'invoiceDetails',
				'invoice',
				'oid',
			);

			res.send({
				newInvoices,
				status: 200,
			});
		});
	});
});

// for development
invoiceRouter.route('/a/a/a').post(jsonParser, async (req, res) => {
	const db = req.app.get('db');
	const {
		company,
		invoicenumber,
		contactname,
		address1,
		address2,
		address3,
		address4,
		address5,
		address6,
		beginningbalance,
		totalpayments,
		totalnewcharges,
		endingbalance,
		unpaidbalance,
		invoicedate,
		paymentduedate,
		dataenddate,
	} = req.body;

	const newInvoice = sanitizeFields({
		company,
		invoicenumber,
		contactname,
		address1,
		address2,
		address3,
		address4,
		address5,
		address6,
		beginningbalance,
		totalpayments,
		totalnewcharges,
		endingbalance,
		unpaidbalance,
		invoicedate,
		paymentduedate,
		dataenddate,
	});

	invoiceService.insertNewInvoice(db, newInvoice).then(function () {
		res.send({ message: 'invoice added successfully.', status: 200 });
	});
});

module.exports = invoiceRouter;
