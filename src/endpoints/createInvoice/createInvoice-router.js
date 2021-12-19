const express = require('express');
const createInvoiceRouter = express.Router();
const createInvoiceService = require('./createInvoice-service');
const dayjs = require('dayjs');

// Gets most recent 'pay to' record
createInvoiceRouter.route('/createAllInvoices').get(async (req, res) => {
	const db = req.app.get('db');

	// Gets the last invoice number, Integer
	const lastInvoiceNumber = await createInvoiceService
		.getInvoiceNumber(db)
		.then(lastInvoice => parseInt(lastInvoice.pop().invoicenumber) + 1);

	// Gets a list of contacts where balance has changed since last billing cycle.[{},{}]array of objects
	const readyToBillContacts = await createInvoiceService.getReadyToBill(db);

	readyToBillContacts.map(contactRecord => {
		// Get most recent invoice for perticular contact
		createInvoiceService
			.getMostRecentInvoice(db, contactRecord.oid)
			.then(mostRecentInvoice => {
				const now = dayjs().format('MM/DD/YYYY HH:mm:ss');
				const leadTime = dayjs()
					.subtract(6, 'months')
					.startOf('days')
					.format('MM/DD/YYYY HH:mm:ss');
				const lastInvoiceDate =
					// ToDo: instead of jan 1,2020 do - 6 months from today
					mostRecentInvoice.length === 0
						? leadTime
						: mostRecentInvoice[0].invoicedate;
				// Get all transactions, with linked jobs between last invoice date and now.
				createInvoiceService
					.getAllTransactions(db, lastInvoiceDate, now, contactRecord.oid)
					.then(allTransactionsWithLinkedJobs => {
						// DO STUFF
						const grouped = groupByJob(allTransactionsWithLinkedJobs);
						const calculation = calculateTotals(grouped);
						//
					});
			});

		return contactRecord;
	});
});

module.exports = createInvoiceRouter;

const groupByJob = data => {
	const jobListWithDuplicates = data.map(record => record.job);
	const jobListWithDuplicatesRemoved = [...new Set(jobListWithDuplicates)];

	return jobListWithDuplicatesRemoved.map(jobId => {
		let groupedRecords = [];

		data.map(record => {
			if (record.job === jobId) {
				groupedRecords = [...groupedRecords, record];
			}
			return record;
		});
		return groupedRecords;
	});
};

/**
 * Each array within and array is a job on a company, calculates charged, payments, and net for perticular job
 * @param {*} sortedRecords [[2],[1],[3]] each array within the array is a job grouping. The inner array length varies based on transaction length for given job
 * @returns [[],[],[]] returns array of arrays, each inner array is a job. details of the job calculations are pushed onto each object
 */
const calculateTotals = sortedRecords => {
	let groupDetail = '';
	sortedRecords.map(groupedItemList => {
		let details = { company: '', job: [], charges: [], payments: [], net: [] };

		return groupedItemList.map(record => {
			if (record.transactiontype === 'Charge') {
				details.charges = [...details.charges, record.totaltransaction];
			} else if (record.transactiontype === 'Payment') {
				details.payments = [...details.payments, record.totaltransaction];
			}

			// Once the last record in the group is reach perform the calculations
			if (record === groupedItemList[groupedItemList.length - 1]) {
				const totalCharges = details.charges.reduce(
					(prev, curr) => prev + curr,
					0,
				);
				const totalPayments = details.payments.reduce(
					(prev, curr) => prev + curr,
					0,
				);

				// Making final calculations, and pushing to return object
				details.net = totalCharges - totalPayments;
				details.charges = totalCharges;
				details.payments = totalPayments;
				details.job = record.job;
				details.company = record.company;
				// pushing details
				groupDetail = [...groupDetail, details];
			}
			return record;
		});
	});
	return groupDetail;
};

// res.send({
// 	arrayOfJobs,
// 	status: 200,
// });
