const express = require('express');
const invoiceRouter = express.Router();
const invoiceService = require('./invoice-service');

invoiceRouter.route('/all/:company').get(async (req, res) => {
	const company = req.params.company;
	const db = req.app.get('db');

	invoiceService.getCompanyInvoices(db, company).then(allInvoicesForCompany => {
		res.send({
			allInvoicesForCompany,
			status: 200,
		});
	});
});

invoiceRouter.route('/newInvoices').get(async (req, res) => {
	const db = req.app.get('db');

	invoiceService.getNewInvoices(db).then(newInvoices => {
		res.send({
			newInvoices,
			status: 200,
		});
	});
});

module.exports = invoiceRouter;
