const express = require('express')
const createInvoiceRouter = express.Router()
const createInvoiceService = require('./createInvoice-service')
const invoiceService = require('../invoice/invoice-service')
const contactService = require('../contacts/contacts-service')
const helperFunctions = require('../../helperFunctions/helperFunctions')
const dayjs = require('dayjs')

// ToDo needs refactor and Error handleing

// Gets most recent 'pay to' record
createInvoiceRouter.route('/createAllInvoices').get(async (req, res) => {
	const db = req.app.get('db')

	// Gets a list of contacts where balance has changed since last billing cycle.[{},{}]array of objects
	const readyToBillContacts = await createInvoiceService.getReadyToBill(db)

	// Loop through each contact
	readyToBillContacts.map((contactRecord, i) => {
		// Gets latest invoice and increments based on index
		createInvoiceService.getInvoiceNumber(db).then(lastInvoice => {
			let lastInvoiceNumber = parseInt(lastInvoice.pop().invoicenumber) + 1 + i

			// Get most recent invoice for perticular contact
			invoiceService.getCompanyInvoices(db, contactRecord.oid).then(mostRecentInvoice => {
				// returns todays date and date of prior based on passed arg
				const time = helperFunctions.timeSubtractionFromTodayCalculator(365)
				const lastInvoiceDate = mostRecentInvoice.length === 0 ? time.date : mostRecentInvoice[0].invoicedate

				// Get all transactions, with linked jobs between last invoice date and now.
				createInvoiceService.getAllTransactions(db, lastInvoiceDate, time.now, contactRecord.oid).then(allTransactionsWithLinkedJobs => {
					const grouped = groupByJob(allTransactionsWithLinkedJobs)
					const calculatedJobs = calculateTotals(grouped)
					const newInvoice = formatInvoiceInserts(calculatedJobs, contactRecord, lastInvoiceNumber)
					const updatedContactFinancials = updateContactFinancials(contactRecord, newInvoice.invoice)

					// Insert all items into respective tables
					invoiceService.insertNewInvoice(db, newInvoice.invoice).then(() => {
						createInvoiceService.insertInvoiceDetails(db, newInvoice.invoiceDetails).then(() => {
							contactService.updateContact(db, contactRecord.oid, updatedContactFinancials)
						})
					})
				})
			})
		})
		return contactRecord
	})
})

module.exports = createInvoiceRouter

/**
 * Groups Array of objects by job.
 * @param {*} data each object must have job property
 * @returns [[],[]] Array of arrays each array is a grouping by job
 */
const groupByJob = data => {
	// Making a list of Job Id's and removing any duplicates. Array of integers
	const jobListWithDuplicates = data.map(record => record.job)
	const jobListWithDuplicatesRemoved = [...new Set(jobListWithDuplicates)]

	return jobListWithDuplicatesRemoved.map(jobId => {
		let groupedRecords = []

		data.map(record => {
			if (record.job === jobId) {
				groupedRecords = [...groupedRecords, record]
			}
			return record
		})
		return groupedRecords
	})
}

/**
 * Each array within and array is a job on a company, calculates charged, payments, and net for perticular job
 * @param {*} sortedRecords [[2],[1],[3]] each array within the array is a job grouping. The inner array length varies based on transaction length for given job
 * @returns [[],[],[]] returns array of arrays, each inner array is a job. details of the job calculations are pushed onto each object
 */
const calculateTotals = sortedRecords => {
	let groupDetail = ''
	sortedRecords.map(groupedItemList => {
		let details = {
			detaildate: '',
			detailtype: '',
			jobdescription: 0,
			charges: [],
			discount: 0,
			writeoff: 0,
			net: [],
			payment: [],
			rawcharges: 0,
		}

		return groupedItemList.map(record => {
			if (record.transactiontype === 'Charge') {
				details.charges = [...details.charges, record.totaltransaction]
			} else if (record.transactiontype === 'Payment') {
				details.payment = [...details.payment, record.totaltransaction]
			}

			// Once the last record in the group is reach perform the calculations
			if (record === groupedItemList[groupedItemList.length - 1]) {
				const totalCharges = details.charges.reduce((prev, curr) => prev + curr, 0)
				const totalPayments = details.payment.reduce((prev, curr) => prev + curr, 0)

				// Making final calculations at job level, and pushing to return object. Completes the object to be used for invoice details
				details.detaildate = dayjs().startOf('days').format('MM/DD/YYYY HH:mm:ss')
				details.detailtype = record.transactiontype
				details.jobdescription = record.defaultdescription
				details.charges = totalCharges
				details.discount = 0
				details.net = totalCharges - totalPayments
				details.payment = totalPayments
				// pushing details to return for overall func
				groupDetail = [...groupDetail, details]
			}
			return record
		})
	})
	return groupDetail
}

/**
 * Creates invoice, and Invoice details objects for DB insert
 * @param {*} calculatedJobs
 * @param {*} contactRecord
 * @param {*} lastInvoiceNumber
 * @returns An array of objects [{},[{},{}]] first object is invoice, second is an array of objects. Each object is a job
 */
const formatInvoiceInserts = (calculatedJobs, contactRecord, lastInvoiceNumber) => {
	const invoice = {
		company: null,
		invoicenumber: null,
		contactname: null,
		address1: '',
		address2: '',
		address3: '',
		address4: '',
		address5: '',
		address6: '',
		beginningbalance: 0,
		totalpayments: 0,
		totalnewcharges: 0,
		endingbalance: 0,
		unpaidbalance: 0,
		invoicedate: null,
		paymentduedate: null,
		dataenddate: null,
	}

	// Forms and calculates the invoice
	calculatedJobs.forEach(job => {
		invoice.company = contactRecord.oid
		invoice.invoicenumber = lastInvoiceNumber
		invoice.contactname = contactRecord.firstname + contactRecord.lastname
		invoice.address1 = contactRecord.companyname
		invoice.address2 = contactRecord.firstname + contactRecord.lastname
		invoice.address3 = contactRecord.address1
		invoice.address4 = `${contactRecord.city}, ${contactRecord.state} ${contactRecord.zip}`
		invoice.address5 = null
		invoice.address6 = null
		invoice.beginningbalance = contactRecord.beginningbalance
		invoice.totalpayments = job.payment + invoice.totalpayments
		invoice.totalnewcharges = job.charges + invoice.totalnewcharges
		invoice.endingbalance = invoice.beginningbalance + invoice.totalnewcharges - invoice.totalpayments
		invoice.unpaidbalance = invoice.beginningbalance === 0 ? 0 : invoice.beginningbalance - invoice.totalpayments
		invoice.invoicedate = job.detaildate
		invoice.paymentduedate = job.detaildate
		invoice.dataenddate = job.detaildate
		return job
	})

	// Add a sync'd invoice number to detail and invoice
	const invoiceDetails = calculatedJobs.map(job => {
		const detail = { invoice, ...job }
		detail.invoice = lastInvoiceNumber
		return detail
	})
	return { invoice, invoiceDetails }
}

/**
 * Forms contact object to update contact amounts on account.
 * @param {*} contactRecord
 * @param {*} invoice
 * @returns {} all contact info with the updated invoice amounts
 */

const updateContactFinancials = (contactRecord, invoice) => {
	contactRecord = {
		...contactRecord,
		newbalance: false,
		balancechanged: false,
		beginningbalance: invoice.endingbalance,
		statementbalance: invoice.endingbalance,
	}

	return contactRecord
}

/**
 * Psuedo
 *
 * Get list of contact ready for billing
 * 	all contacts that have a balance on thier account in 'company' table
 *
 * Loop through each contact that has balance
 * 	Get the latest invoice number an increment.
 * 	Get date of the last invoice for aperticular company
 * 	Get all transactions for a company based on the last invoice date to current day
 * 		Group all transaction by job number
 * 		Calculate all grouped jobs
 * 		Form grouped objects for 'invoiceDetail'
 * 		Calculate final invoice
 * 			Calculate all jobs for invoice
 * 			Update invoiceDetails per job, and invoice with sync'd invoice number
 * 		Form object to insert for invoice
 * 		Form contact object that will update contact in 'company' table
 * 		Insert 'invoice' with invoice amounts, linked to 'invoiceDetails' by invoice number
 * 		Insert 'invoiceDetails' with totals for jobs, linked to 'invoice' by invoice number
 * 		Insert 'company' with updated totals
 */
