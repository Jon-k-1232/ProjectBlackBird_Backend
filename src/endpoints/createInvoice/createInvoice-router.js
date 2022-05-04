const express = require('express');
const createInvoiceRouter = express.Router();
const createInvoiceService = require('./createInvoice-service');
const invoiceService = require('../invoice/invoice-service');
const contactService = require('../contacts/contacts-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const pdfAndZipFunctions = require('../../pdfCreator/pdfOrchestrator');
const dayjs = require('dayjs');
const { defaultInterestRate, defaultInterestMonthsInYear } = require('../../config');

createInvoiceRouter.route('/download').get(async (req, res) => {
  // here we assigned the name to our downloaded file!
  const file_after_download = 'downloaded_file.zip';

  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
  res.download(`${__dirname}/pdf_holder/${dayjs().format('YYYY-MM-DD')}/output.zip`);
});

createInvoiceRouter.route('/createAllInvoices').get(async (req, res) => {
  const db = req.app.get('db');

  // Keep readyToBillContacts here as later a single company will be passed on a separate endpoint, using same code
  const readyToBillContacts = await createInvoiceService.getReadyToBill(db);
  // ToDo -> Maybe want to send back to allow user to select, or deselect which invoices to send.

  const newInvoices = await createNewInvoice(readyToBillContacts, db);
  // ToDo create PDF off each returned invoice
  // ToDo create a zip file in a file system

  res.send({ newInvoices });
});

module.exports = createInvoiceRouter;

// ********************************************************************?????????????????????

const createNewInvoice = async (readyToBillContacts, db) => {
  const companyInvoices = readyToBillContacts.map(async (contactRecord, i) => {
    const lastInvoiceNumberInDb = await createInvoiceService.getLastInvoiceNumberInDB(db);
    const nextInvoiceNumber = lastInvoiceNumberInDb + 1 + i;
    const transactionTimes = helperFunctions.timeSubtractionFromTodayCalculator(365);
    const invoiceTimes = helperFunctions.timeSubtractionFromTodayCalculator(730);

    // Getting company invoices
    const companyInvoices = await invoiceService.getCompanyInvoicesBetweenDates(db, contactRecord.oid, invoiceTimes);
    const invoicesOfCompanySortedByDate = helperFunctions.sortArrayByObjectProperty(companyInvoices, 'invoiceDate');

    // Checking invoices for credits, or amounts unpaid -> insert into 'beginning balance' of 'invoice' table
    const outstandingCompanyInvoices = findOutstandingInvoices(invoicesOfCompanySortedByDate);
    // Calculate interest
    const interestTransactions = outstandingCompanyInvoices.length ? calculateBillingInterest(outstandingCompanyInvoices) : [];
    // ToDo interest insert into transactions.

    // Getting transactions occurring between last billing cycle and today, grabs onto newly inserted interest transactions
    const lastCompanyInvoice = invoicesOfCompanySortedByDate.pop();
    const lastCompanyInvoiceDate = companyInvoices.length === 0 ? transactionTimes.prevDate : lastCompanyInvoice.invoiceDate;
    const newCompanyTransactions = await createInvoiceService.getCompanyTransactionsBetweenDates(
      db,
      lastCompanyInvoiceDate,
      transactionTimes.currDate,
      contactRecord.oid,
    );

    // Aggregates transactions. Multiple transactions for the same job will add together and output with a single job, Each job will have totals
    const aggregatedTransactionTotalsByJob = aggregateTransactionTotalsByJob(newCompanyTransactions);
    const aggregatedAndSortedTotals = aggregateAndSortRemainingTotals(aggregatedTransactionTotalsByJob);

    // ToDO THINK ABOUT THIS STEP IF NEEDED LATER IN PROCESS... Each Job that appeared on job should have a separate insert into invoiceDetails showing job totals.
    // insertJobsIntoDB(aggregatedTransactionTotalsByJob, nextInvoiceNumber);
    // ToDo Total the ending balance up. Note: Need to account for credits on account. aggregateTotalsByJob = new transactions. outstandingCompanyInvoices= search for credits and outstanding bills. nextInvoiceNumber= invoice Number
    // const newlyCreatedInvoice = calculateTotals(
    //   contactRecord,
    //   aggregateTransactionTotalsByJob,
    //   outstandingCompanyInvoices,
    //   nextInvoiceNumber,
    // );
    // ToDo Insert invoice into invoice table.
    // insertInvoiceIntoDB();
    // ToDo Update 'company' table Contact with balance and amounts, and booleans
    // const updatedContactFinancials = updateContactFinancials(contactRecord, newInvoice.invoice);
    // ToDo FORM OBJECT TO BE PRINTED ON INVOICE. Totals each catagory: Beginning Balance, TotalPayments, Total New charges, ending balance.
    // const createPDF(newlyCreatedInvoice);

    // ***********
    // const calculatedJobs = calculateTotals(grouped);
    // const newInvoice = formatInvoiceInserts(calculatedJobs, contactRecord, nextInvoiceNumber);

    return aggregatedAndSortedTotals;
  });

  return Promise.all(companyInvoices);
};

// *************************************************************************
// const calculateTotals = (contactRecord, aggregateTotalsByJob, outstandingCompanyInvoices, nextInvoiceNumber) => {
//   // aggregate totals

//   return newBill;
// };

const aggregateAndSortRemainingTotals = aggregatedTransactionTotalsByJob => {
  return aggregatedTransactionTotalsByJob.map(companyJob => {
    if (companyJob !== undefined && companyJob.allJobTransactions.length) {
      // additional properties to push onto aggregatedTotals
      let newTotalsPerJob = {
        ...companyJob,
        totalPayments: 0,
        paymentTransactions: [],
        totalAdjustments: 0,
        adjustmentTransactions: [],
        totalWriteOffs: 0,
        writeOffTransactions: [],
        totalInterest: 0,
        interestTransactions: [],
        totalCharges: 0,
        chargeTransactions: [],
        totalTime: 0,
        timeTransactions: [],
      };

      companyJob.allJobTransactions.map(transaction => {
        switch (transaction.transactionType) {
          case 'Payment':
            newTotalsPerJob.totalPayments = (Number(newTotalsPerJob.totalPayments) + Number(transaction.totalTransaction)).toFixed(2);
            newTotalsPerJob.paymentTransactions.push(transaction);
            break;
          case 'Adjustment':
            newTotalsPerJob.totalAdjustments = (Number(newTotalsPerJob.totalAdjustments) + Number(transaction.totalTransaction)).toFixed(2);
            newTotalsPerJob.adjustmentTransactions.push(transaction);
            break;
          case 'Writeoff':
            newTotalsPerJob.totalWriteOffs = (Number(newTotalsPerJob.totalWriteOffs) + Number(transaction.totalTransaction)).toFixed(2);
            newTotalsPerJob.writeoffTransactions.push(transaction);
            break;
          case 'Interest':
            newTotalsPerJob.totalInterest = (Number(newTotalsPerJob.totalInterest) + Number(transaction.totalTransaction)).toFixed(2);
            newTotalsPerJob.interestTransactions.push(transaction);
            break;
          case 'Charge':
            newTotalsPerJob.totalCharges = (Number(newTotalsPerJob.totalCharges) + Number(transaction.totalTransaction)).toFixed(2);
            newTotalsPerJob.chargeTransactions.push(transaction);
            break;
          case 'Time':
            newTotalsPerJob.totalTime = (Number(newTotalsPerJob.totalTime) + Number(transaction.totalTransaction)).toFixed(2);
            newTotalsPerJob.timeTransactions.push(transaction);
            break;
          default:
            -1;
        }
      });
      return newTotalsPerJob;
    }
    return newTotalsPerJob;
  });
};

/**
 * Finds invoices that have either credits, or outstanding amounts.
 * @param {*} invoices [{},{},{}]
 * @returns [{},{},{}]
 */
const findOutstandingInvoices = invoices => {
  return invoices.filter(invoice => {
    const { beginningBalance, totalPayments, totalNewCharges, endingBalance } = invoice;
    const totalCharges = beginningBalance + totalNewCharges;
    // totalPayments is a negative number in DB
    const net = totalCharges + totalPayments;

    // Scenario where the balance is more than payments, and or there is a credit on account
    if (net >= 0.01 || endingBalance >= 0.01 || net <= -0.01 || endingBalance <= -0.01) {
      return invoice;
    }
  });
};

/**
 * Calculates billing interest. Reducing amount model, per annum, rate = 18%
 * @param {*} outstandingCompanyInvoices
 * @returns[{},{},{}] and array of objects. each object is a interest record in 'transaction' table form
 */
const calculateBillingInterest = outstandingCompanyInvoices => {
  const calculatedInterest = balance => Number(((balance * defaultInterestRate) / defaultInterestMonthsInYear).toFixed(2));

  const interestRecords = outstandingCompanyInvoices.map(invoice => {
    if (invoice !== undefined && invoice.endingBalance >= 0.01) {
      // Forming Object to insert to transaction
      const interestTransaction = {
        oid: invoice.company,
        company: invoice.company,
        job: 1,
        employee: null,
        transactionType: 'Interest',
        transactionDate: dayjs().format('MM/DD/YYYY HH:mm:ss'),
        quantity: 1,
        unitOfMeasure: 'Each',
        unitTransaction: calculatedInterest(invoice.endingBalance),
        totalTransaction: calculatedInterest(invoice.endingBalance),
        discount: 0,
        invoice: invoice.invoiceNumber,
        paymentApplied: false,
        ignoreInAgeing: null,
      };

      return interestTransaction;
    }

    return;
  });

  return interestRecords;
};

/**
 * Finds matching job transactions within company transactions, groups and adds together into new object.
 * @param {*} newCompanyTransactions
 * @returns [{},{},{}] Each object is a new job record.
 */
const aggregateTransactionTotalsByJob = newCompanyTransactions => {
  return newCompanyTransactions.reduce((previousTransactions, currentTransaction) => {
    // Company may not have any transactions
    if (currentTransaction !== undefined) {
      let newObject = {
        job: currentTransaction.job,
        company: currentTransaction.company,
        employee: currentTransaction.employee,
        description: currentTransaction.description,
        overallJobTotal: Number(currentTransaction.totalTransaction).toFixed(2),
        allJobTransactions: [currentTransaction],
      };

      // If previous has any items start searching for job matches to group
      if (previousTransactions.length) {
        // Find matching job in previous items
        const foundJobGroupTransactionIndex = previousTransactions.findIndex(prevTrans => prevTrans.job === currentTransaction.job);
        const foundJobGroupTransaction = previousTransactions[foundJobGroupTransactionIndex];

        // If a job match is found aggregate the amounts together, and put the transaction is a list of grouped transactions.
        if (foundJobGroupTransactionIndex !== -1) {
          const flattenGroupedTransactions = foundJobGroupTransaction.allJobTransactions.flatMap(item => item);
          const groupedTransactions = flattenGroupedTransactions.concat(currentTransaction);

          // Add job matches, and group matches to a new property So we can see all the grouped matching transactions
          newObject;
          newObject.allJobTransactions = groupedTransactions;
          newObject.overallJobTotal = (
            Number(currentTransaction.totalTransaction) + Number(foundJobGroupTransaction.overallJobTotal)
          ).toFixed(2);

          // Remove prior transaction record from previous so it is not counted again
          previousTransactions.splice(foundJobGroupTransactionIndex, 1);
        }
      }

      previousTransactions.push(newObject);
    }
    return previousTransactions;
  }, []);
};

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

/*
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

*/
