const express = require('express');
const createInvoiceRouter = express.Router();
const createInvoiceService = require('./createInvoice-service');
const invoiceService = require('../invoice/invoice-service');
const contactService = require('../contacts/contacts-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const dayjs = require('dayjs');

// ToDo needs refactor and Error handleing

// Gets most recent 'pay to' record
createInvoiceRouter.route('/createAllInvoices').get(async (req, res) => {
  const db = req.app.get('db');

  // Gets a list of contacts where balance has changed since last billing cycle.[{},{}]array of objects
  const readyToBillContacts = await createInvoiceService.getReadyToBill(db);

  // Loop through each contact
  readyToBillContacts.map((contactRecord, i) => {
    // Gets latest invoice and increments based on index
    createInvoiceService.getInvoiceNumber(db).then(lastInvoice => {
      let lastInvoiceNumber = Number(lastInvoice.pop().invoiceNumber) + 1 + i;

      // Get most recent invoice for perticular contact
      invoiceService.getCompanyInvoices(db, contactRecord.oid).then(mostRecentInvoice => {
        // returns todays date and date of prior based on passed arg
        const time = helperFunctions.timeSubtractionFromTodayCalculator(365);
        const lastInvoiceDate = mostRecentInvoice.length === 0 ? time.prevDate : mostRecentInvoice[0].invoiceDate;

        // Get all transactions, with linked jobs between last invoice date and now.
        createInvoiceService
          .getAllTransactions(db, lastInvoiceDate, time.currDate, contactRecord.oid)
          .then(allTransactionsWithLinkedJobs => {
            const grouped = groupByJob(allTransactionsWithLinkedJobs);
            const calculatedJobs = calculateTotals(grouped);
            const newInvoice = formatInvoiceInserts(calculatedJobs, contactRecord, lastInvoiceNumber);
            const updatedContactFinancials = updateContactFinancials(contactRecord, newInvoice.invoice);

            // Insert all items into respective tables
            invoiceService.insertNewInvoice(db, newInvoice.invoice).then(() => {
              createInvoiceService.insertInvoiceDetails(db, newInvoice.invoiceDetails).then(() => {
                contactService.updateContact(db, contactRecord.oid, updatedContactFinancials);
              });
            });
          });
      });
    });
    return contactRecord;
  });
});

createInvoiceRouter.route('/test/tests').get(async (req, res) => {
  const db = req.app.get('db');

  const readyToBillContacts = await createInvoiceService.getReadyToBill(db);
  const newInvoices = await createNewInvoice(readyToBillContacts, db);

  res.send({ newInvoices });
});

module.exports = createInvoiceRouter;

// ********************************************************************?????????????????????

const createNewInvoice = async (readyToBillContacts, db) => {
  const companyInvoices = readyToBillContacts.map(async (contactRecord, i) => {
    const lastInvoice = await createInvoiceService.getLastInvoice(db);
    const nextInvoiceNumber = lastInvoice + 1 + i;
    const companyInvoices = await invoiceService.getCompanyInvoices(db, contactRecord.oid);
    const invoiceOfCompanySortedByDate = helperFunctions.sortArrayByObjectProperty(companyInvoices, 'invoiceDate');
    const time = helperFunctions.timeSubtractionFromTodayCalculator(365);
    const lastInvoiceDate = companyInvoices.length === 0 ? time.prevDate : invoiceOfCompanySortedByDate.pop().invoiceDate;

    // ToDo check if a company has new transactions. If no transactions array length will === 0, we know the company has a balance due though as it came up in initial query as having a balance. Calc Interest. If no then proceed to send bill.
    const newCompanyTransactions = await createInvoiceService.getCompanyTransactionsBetweenDates(
      db,
      lastInvoiceDate,
      time.currDate,
      contactRecord.oid,
    );

    // ToDo Check to see if below function is working correctly. https://data.page/json/csv
    // const aggregatedTotalsByJob = aggregateTotalsByJob(newCompanyTransactions);
    // const newTransactions = [...newCompanyTransactions];

    // const grouped = groupByJob(newTransactions);
    // const calculatedJobs = calculateTotals(grouped);
    // const newInvoice = formatInvoiceInserts(calculatedJobs, contactRecord, nextInvoiceNumber);
    // const updatedContactFinancials = updateContactFinancials(contactRecord, newInvoice.invoice);

    return newCompanyTransactions;
  });

  return Promise.all(companyInvoices);
};

// ToDo Check if working.
// ???????? ******************************* MAYBE WORKING ***************
const aggregateTotalsByJob = newCompanyTransactions => {
  const companyTransactions = [...newCompanyTransactions];

  return companyTransactions.reduce((previousTransactions, currentTransaction) => {
    if (previousTransactions.length) {
      const foundJobGroupTransactionIndex = previousTransactions.findIndex(prevTrans => prevTrans.job === currentTransaction.job);
      const foundJobGroupTransaction = previousTransactions[foundJobGroupTransactionIndex];

      if (foundJobGroupTransactionIndex !== -1) {
        currentTransaction.totalTransaction = currentTransaction.totalTransaction + foundJobGroupTransaction.totalTransaction;
        previousTransactions.splice(foundJobGroupTransactionIndex, 1);
      }
    }

    previousTransactions.push(currentTransaction);
    return previousTransactions;
  }, []);
};

// /**
//  * Groups Array of objects by job.
//  * @param {*} data each object must have job property
//  * @returns [[],[]] Array of arrays each array is a grouping by job
//  */
// const groupByJob = data => {
//   // Making a list of Job Id's and removing any duplicates. Array of integers
//   const jobListWithDuplicates = data.map(record => record.job);
//   const jobListWithDuplicatesRemoved = [...new Set(jobListWithDuplicates)];

//   return jobListWithDuplicatesRemoved.map(jobId => {
//     let groupedRecords = [];

//     data.map(record => {
//       if (record.job === jobId) {
//         groupedRecords = [...groupedRecords, record];
//       }
//       return record;
//     });
//     return groupedRecords;
//   });
// };

// /**
//  * Each array within and array is a job on a company, calculates charged, payments, and net for perticular job
//  * @param {*} sortedRecords [[2],[1],[3]] each array within the array is a job grouping. The inner array length varies based on transaction length for given job
//  * @returns [[],[],[]] returns array of arrays, each inner array is a job. details of the job calculations are pushed onto each object
//  */
// const calculateTotals = sortedRecords => {
//   let groupDetail = '';
//   sortedRecords.map(groupedItemList => {
//     let details = {
//       detailDate: '',
//       detailType: '',
//       jobDescription: 0,
//       charges: [],
//       discount: 0,
//       writeoff: 0,
//       net: [],
//       payment: [],
//       rawCharges: 0,
//     };

//     return groupedItemList.map(record => {
//       if (record.transactionType === 'Charge') {
//         details.charges = [...details.charges, record.totalTransaction];
//       } else if (record.transactionType === 'Payment') {
//         details.payment = [...details.payment, record.totalTransaction];
//       }

//       // Once the last record in the group is reach perform the calculations
//       if (record === groupedItemList[groupedItemList.length - 1]) {
//         const totalCharges = details.charges.reduce((prev, curr) => prev + curr, 0);
//         const totalPayments = details.payment.reduce((prev, curr) => prev + curr, 0);

//         // Making final calculations at job level, and pushing to return object. Completes the object to be used for invoice details
//         details.detailDate = dayjs().startOf('days').format('MM/DD/YYYY HH:mm:ss');
//         details.detailType = record.transactionType;
//         details.jobDescription = record.defaultDescription;
//         details.charges = totalCharges;
//         details.discount = 0;
//         details.net = totalCharges - totalPayments;
//         details.payment = totalPayments;
//         // pushing details to return for overall func
//         groupDetail = [...groupDetail, details];
//       }
//       return record;
//     });
//   });
//   return groupDetail;
// };

// /**
//  * Creates invoice, and Invoice details objects for DB insert
//  * @param {*} calculatedJobs
//  * @param {*} contactRecord
//  * @param {*} lastInvoiceNumber
//  * @returns An array of objects [{},[{},{}]] first object is invoice, second is an array of objects. Each object is a job
//  */
// const formatInvoiceInserts = (calculatedJobs, contactRecord, lastInvoiceNumber) => {
//   const invoice = {
//     company: null,
//     invoiceNumber: null,
//     contactName: null,
//     address1: '',
//     address2: '',
//     address3: '',
//     address4: '',
//     address5: '',
//     address6: '',
//     beginningBalance: 0,
//     totalPayments: 0,
//     totalNewCharges: 0,
//     endingBalance: 0,
//     unpaidBalance: 0,
//     invoiceDate: null,
//     paymentDueDate: null,
//     dataEndDate: null,
//   };

//   // Forms and calculates the invoice
//   calculatedJobs.forEach(job => {
//     invoice.company = contactRecord.oid;
//     invoice.invoiceNumber = lastInvoiceNumber;
//     invoice.contactName = contactRecord.firstName + contactRecord.lastName;
//     invoice.address1 = contactRecord.companyName;
//     invoice.address2 = contactRecord.firstName + contactRecord.lastName;
//     invoice.address3 = contactRecord.address1;
//     invoice.address4 = `${contactRecord.city}, ${contactRecord.state} ${contactRecord.zip}`;
//     invoice.address5 = null;
//     // invoice.address6 = null;
//     invoice.beginningBalance = contactRecord.beginningBalance;
//     invoice.totalPayments = job.payment + invoice.totalPayments;
//     invoice.totalNewCharges = job.charges + invoice.totalNewCharges;
//     invoice.endingBalance = invoice.beginningBalance + invoice.totalNewCharges - invoice.totalPayments;
//     invoice.unpaidBalance = invoice.beginningBalance === 0 ? 0 : invoice.beginningBalance - invoice.totalPayments;
//     invoice.invoiceDate = job.detailDate;
//     invoice.paymentDueDate = job.detailDate;
//     invoice.dataEndDate = job.detailDate;
//     return job;
//   });

//   // Add a sync'd invoice number to detail and invoice
//   const invoiceDetails = calculatedJobs.map(job => {
//     const detail = { invoice, ...job };
//     detail.invoice = lastInvoiceNumber;
//     return detail;
//   });
//   return { invoice, invoiceDetails };
// };

// /**
//  * Forms contact object to update contact amounts on account.
//  * @param {*} contactRecord
//  * @param {*} invoice
//  * @returns {} all contact info with the updated invoice amounts
//  */

// const updateContactFinancials = (contactRecord, invoice) => {
//   contactRecord = {
//     ...contactRecord,
//     newBalance: false,
//     balanceChanged: false,
//     beginningBalance: invoice.endingBalance,
//     statementBalance: invoice.endingBalance,
//   };

//   return contactRecord;
// };

// /**
//  * Psuedo
//  *
//  * Get list of contact ready for billing
//  * 	all contacts that have a balance on thier account in 'company' table
//  *
//  * Loop through each contact that has balance
//  * 	Get the latest invoice number an increment.
//  * 	Get date of the last invoice for aperticular company
//  * 	Get all transactions for a company based on the last invoice date to current day
//  * 		Group all transaction by job number
//  * 		Calculate all grouped jobs
//  * 		Form grouped objects for 'invoiceDetail'
//  * 		Calculate final invoice
//  * 			Calculate all jobs for invoice
//  * 			Update invoiceDetails per job, and invoice with sync'd invoice number
//  * 		Form object to insert for invoice
//  * 		Form contact object that will update contact in 'company' table
//  * 		Insert 'invoice' with invoice amounts, linked to 'invoiceDetails' by invoice number
//  * 		Insert 'invoiceDetails' with totals for jobs, linked to 'invoice' by invoice number
//  * 		Insert 'company' with updated totals
//  */
