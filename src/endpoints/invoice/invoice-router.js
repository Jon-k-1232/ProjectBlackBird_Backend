const express = require('express');
const invoiceRouter = express.Router();
const invoiceService = require('./invoice-service');

// Gets all invoices + invoice detail for a specific company
invoiceRouter.route('/all/:company').get(async (req, res) => {
	const company = req.params.company;
	const db = req.app.get('db');

	// Tables invoices the OID is to reference the table invoiceTable invoice column
	// Getting invoices that have no billing detail
	invoiceService.getCompanyInvoices(db, company).then(invoicesWithNoDetail => {
		// Creates an array of oids for query to search for
		const arrayOfIds = invoicesWithNoDetail.map(item => item.oid);

		// Calling For invoice detail
		invoiceService.getInvoiceDetail(db, arrayOfIds).then(details => {
			// Mapping the none detail invoices to the matching invoice detail
			const invoices = invoicesWithNoDetail.map(invoiceWoDetail => {
				const matchingDetailItem = details.find(
					detailItem => detailItem.invoice === invoiceWoDetail.oid,
				);

				//Adding property to every item in case nothing is found.
				invoiceWoDetail.details = null;

				if (matchingDetailItem.invoice === invoiceWoDetail.oid) {
					invoiceWoDetail.details = matchingDetailItem;
				}

				return invoiceWoDetail;
			});

			res.send({
				invoices,
				status: 200,
			});
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
