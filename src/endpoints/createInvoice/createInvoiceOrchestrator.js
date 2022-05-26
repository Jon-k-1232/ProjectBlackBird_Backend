const createInvoiceService = require('./createInvoice-service');
const invoiceService = require('../invoice/invoice-service');
const transactionService = require('../transactions/transactions-service');
const contactService = require('../contacts/contacts-service');
const helperFunctions = require('../../helperFunctions/helperFunctions');
const pdfAndZipFunctions = require('../../pdfCreator/pdfOrchestrator');
const dayjs = require('dayjs');
const { defaultInterestRate, defaultInterestMonthsInYear } = require('../../config');

/**
 * Take a company record. checks for outstanding invoices, calculates interest, and charges. Also creates a pdf bill.
 * @param {*} contactRecord {} object is company record
 * @param {*} i index of map
 * @param {*} db
 * @returns object {} object is the invoice with required fields
 */
const createNewInvoice = async (contactRecord, i, db) => {
  const removeNulls = array => array.filter(item => item);
  const lastInvoiceNumberInDb = await createInvoiceService.getLastInvoiceNumberInDB(db);
  const nextInvoiceNumber = Number(lastInvoiceNumberInDb[0].max) + 1;
  const transactionTimes = helperFunctions.timeSubtractionFromTodayCalculator(365);
  const invoiceTimes = helperFunctions.timeSubtractionFromTodayCalculator(730);

  //Getting outstanding invoices, and payments that are joined to those invoices
  const pastCompanyInvoicesWithPayments = await invoiceService.getCompanyPaidInvoicesBetweenDates(db, contactRecord.oid, invoiceTimes);
  const pastCompanyInvoicesWithNoPayments = await invoiceService.getCompanyInvoicesBetweenDates(db, contactRecord.oid, invoiceTimes);
  const pastCompanyInvoices = joinTwoArraysAndRemoveDuplicateObjects(
    pastCompanyInvoicesWithPayments,
    pastCompanyInvoicesWithNoPayments,
    'invoiceDate',
    'unPaidBalance',
  );
  // Sort the old invoices oldest to newest
  const invoicesOfCompanySortedByDate = helperFunctions.sortArrayByObjectProperty(pastCompanyInvoices, 'invoiceDate');
  // Checking past invoices for credits, or amounts unpaid
  const outstandingCompanyInvoices = findOutstandingInvoices(invoicesOfCompanySortedByDate);

  // Calculate interest
  const companyInterestRecords = await transactionService.getTransactionTypeToday(db, 'Interest', contactRecord.oid);
  const hasInterestBeenChargedToday =
    companyInterestRecords.length && companyInterestRecords.filter(item => item.transactionDate !== dayjs().format());
  const interestTransactions = outstandingCompanyInvoices.length ? calculateBillingInterest(outstandingCompanyInvoices) : [];
  const interestTransactionsWithoutNulls = hasInterestBeenChargedToday.length ? [] : removeNulls(interestTransactions);
  // Insert interest into transactions
  Promise.all(interestTransactionsWithoutNulls.map(async transaction => await transactionService.insertNewTransaction(db, transaction)));

  console.log(interestTransactionsWithoutNulls);
  // Getting transactions occurring between last billing cycle and today, grabs onto newly inserted interest transactions
  const lastCompanyInvoice = invoicesOfCompanySortedByDate[invoicesOfCompanySortedByDate.length - 1];
  const lastInvoiceDataEndDate = lastCompanyInvoice ? lastCompanyInvoice.dataEndDate : transactionTimes.prevDate;
  const newCompanyCharges = await createInvoiceService.getCompanyTransactionsAfterLastInvoice(
    db,
    lastInvoiceDataEndDate,
    Number(contactRecord.oid),
  );
  // Merges interest and transactions
  const newCompanyTransactions = [...newCompanyCharges, ...interestTransactionsWithoutNulls];
  // Aggregates transactions. Multiple transactions for the same job will add together and output with a single job, Each job will have totals
  const aggregatedTransactionTotalsByJob = aggregateTransactionTotalsByJob(newCompanyTransactions);
  const aggregatedAndSortedTotals = aggregateAndSortRemainingTotals(aggregatedTransactionTotalsByJob, nextInvoiceNumber);

  // Invoice created to send to pdf creation
  const invoiceObject = calculateInvoiceObject(contactRecord, aggregatedAndSortedTotals, outstandingCompanyInvoices, nextInvoiceNumber);

  insertInvoiceDetails(invoiceObject, nextInvoiceNumber, db);
  insertInvoice(invoiceObject, nextInvoiceNumber, db);
  //   updateContact(contactRecord, invoiceObject, db);

  const payTo = await createInvoiceService.getBillTo(db);
  pdfAndZipFunctions.pdfCreate(invoiceObject, payTo[0]);

  return invoiceObject;
};

module.exports = createNewInvoice;

/**
 * Updates contact card with balance, and that a no new balance
 * @param {*} contactRecord
 * @param {*} invoiceObject
 * @param {*} db
 * @returns
 */
const updateContact = async (contactRecord, invoiceObject, db) => {
  const contact = {
    newBalance: false,
    balanceChanged: false,
    companyName: contactRecord.companyName,
    firstName: contactRecord.firstName,
    lastName: contactRecord.lastName,
    middleI: contactRecord.middleI,
    address1: contactRecord.address1,
    address2: contactRecord.address2,
    city: contactRecord.city,
    state: contactRecord.state,
    zip: contactRecord.zip,
    country: contactRecord.country,
    phoneNumber1: contactRecord.phoneNumber1,
    mobilePhone: contactRecord.mobilePhone,
    currentBalance: invoiceObject.endingBalance,
    beginningBalance: invoiceObject.beginningBalance,
    statementBalance: invoiceObject.endingBalance,
    inactive: contactRecord.inactive,
    originalCurrentBalance: invoiceObject.originalCurrentBalance,
    notBillable: contactRecord.notBillable,
  };
  return contactService.updateContact(db, contactRecord.oid, contact);
};

/**
 * Forms object for invoice and inserts.
 * @param {*} invoiceObject
 * @param {*} nextInvoiceNumber
 * @param {*} db
 * @returns no return
 */
const insertInvoice = async (invoiceObject, nextInvoiceNumber, db) => {
  const {
    company,
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
  } = invoiceObject;
  const invoice = {
    company: company,
    invoiceNumber: nextInvoiceNumber,
    contactName: contactName,
    address1: !address1 ? contactName : address1,
    address2: !address2 ? address3 : address2,
    address3: !address3 ? address4 : address3,
    address4: !address4 ? address5 : address4,
    address5: !address5 ? '' : address5,
    beginningBalance: beginningBalance,
    totalPayments: totalPayments,
    totalNewCharges: totalNewCharges,
    endingBalance: endingBalance,
    unPaidBalance: unPaidBalance,
    invoiceDate: invoiceDate,
    paymentDueDate: paymentDueDate,
    dataEndDate: dataEndDate,
  };
  return invoiceService.insertNewInvoice(db, invoice);
};

/**
 * Forms invoice detail
 * @param {*} invoiceObject
 * @param {*} invoiceNumber
 * @param {*} db
 * @returns no return
 */
const insertInvoiceDetails = (invoiceObject, invoiceNumber, db) => {
  invoiceObject.newChargesRecords.forEach(async transaction => {
    const { transactionType, description, totalTransaction, discount } = transaction;
    const invoiceDetail = {
      invoice: invoiceNumber,
      detailDate: dayjs().format(),
      detailType: transactionType,
      jobDescription: description,
      charges: totalTransaction,
      discount: discount,
      writeOff: transactionType === 'Write Off' ? totalTransaction : 0,
      net: totalTransaction,
      payment: transactionType === 'Payment' ? totalTransaction : 0,
    };
    return invoiceService.insertNewInvoiceDetails(db, invoiceDetail);
  });
};

/**
 * Aggregates all jobs, outstanding charges together to create the invoice.
 * @param {*} contactRecord
 * @param {*} aggregatedAndSortedTotals
 * @param {*} outstandingCompanyInvoices
 * @param {*} nextInvoiceNumber
 * @returns
 */
const calculateInvoiceObject = (contactRecord, aggregatedAndSortedTotals, outstandingCompanyInvoices, nextInvoiceNumber) => {
  // Adds amounts together
  const calculateGroupedJobTotals = (array, property) =>
    array.length ? array.reduce((prev, job) => Number(prev) + Number(job[property]), 0).toFixed(2) : 0;
  // Take an array and a property. The property is an [] array. Property on the array object to flatten.
  const flattenAllGroupedRecords = (array, property) => (array.length ? array.flatMap(job => job[property]) : []);

  const outstandingCharges = calculateGroupedJobTotals(outstandingCompanyInvoices, 'unPaidBalance');
  const payments = calculateGroupedJobTotals(aggregatedAndSortedTotals, 'totalPayments');
  const paymentRecords = flattenAllGroupedRecords(aggregatedAndSortedTotals, 'paymentTransactions');
  const charges = calculateGroupedJobTotals(aggregatedAndSortedTotals, 'overallJobTotal') - payments;
  // const timeRecords = flattenAllGroupedRecords(aggregatedAndSortedTotals, 'timeTransactions');
  // const adjustmentRecords = flattenAllGroupedRecords(aggregatedAndSortedTotals, 'adjustmentTransactions');
  // const chargesRecords = flattenAllGroupedRecords(aggregatedAndSortedTotals, 'chargeTransactions');
  // const interestRecords = flattenAllGroupedRecords(aggregatedAndSortedTotals, 'interestTransactions');
  const chargeItemRecords = aggregatedAndSortedTotals;
  const endingBalanceTotal = (Number(payments) + Number(charges) + Number(outstandingCharges)).toFixed(2);
  const unpaidTotal = (Number(payments) + Number(charges)).toFixed(2);
  const today = new Date();
  const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const now = dayjs().format('MM/DD/YYYY HH:mm:ss');
  const { oid, companyName, firstName, lastName, address1, city, state, zip } = contactRecord;

  return (newInvoiceObject = {
    company: oid,
    invoiceNumber: Number(nextInvoiceNumber),
    contactName: companyName,
    address1: firstName,
    address2: lastName,
    address3: address1,
    address4: `${city}, ${state} ${zip}`,
    address5: null,
    beginningBalance: outstandingCharges,
    outstandingInvoiceRecords: outstandingCompanyInvoices,
    totalPayments: payments,
    paymentRecords: paymentRecords,
    totalNewCharges: charges,
    newChargesRecords: chargeItemRecords,
    endingBalance: endingBalanceTotal,
    unPaidBalance: unpaidTotal,
    invoiceDate: now,
    paymentDueDate: endOfCurrentMonth,
    dataEndDate: now,
  });
};

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
 * Finds matching job transactions within company transactions, groups and adds together into new object.
 * @param {*} newCompanyTransactions
 * @returns [{},{},{}] Each object is a new job record.
 */
const aggregateTransactionTotalsByJob = newCompanyTransactions => {
  return newCompanyTransactions.reduce((previousTransactions, currentTransaction) => {
    const { job, company, employee, description, totalTransaction } = currentTransaction;
    // Company may not have any transactions
    if (currentTransaction !== undefined) {
      let newObject = {
        job: job,
        company: company,
        employee: employee,
        description: currentTransaction.job === 1 ? 'Interest' : description,
        overallJobTotal: Number(totalTransaction).toFixed(2),
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

/**
 * Calculates billing interest. Reducing amount model, per annum, rate = 18%
 * @param {*} outstandingCompanyInvoices
 * @returns[{},{},{}] and array of objects. each object is a interest record in 'transaction' table form
 */
const calculateBillingInterest = outstandingCompanyInvoices => {
  const calculatedInterest = balance => Number(((balance * defaultInterestRate) / defaultInterestMonthsInYear).toFixed(2));

  const interestRecords = outstandingCompanyInvoices.map(invoice => {
    const { oid, company, unPaidBalance, paymentDueDate } = invoice;
    const now = dayjs().format('MM/DD/YYYY HH:mm:ss');
    const dueDate = dayjs(paymentDueDate).format('MM/DD/YYYY HH:mm:ss');
    const pastDue = dayjs(now).isAfter(dueDate);

    if (invoice && unPaidBalance >= 0.01 && pastDue) {
      // Forming Object to insert to transaction
      const interestTransaction = {
        company: company,
        job: 1,
        employee: null,
        transactionType: 'Interest',
        transactionDate: now,
        quantity: 1,
        unitOfMeasure: 'Each',
        unitTransaction: calculatedInterest(unPaidBalance),
        totalTransaction: calculatedInterest(unPaidBalance),
        discount: 0,
        invoice: oid,
        paymentApplied: false,
        ignoreInAgeing: false,
      };

      return interestTransaction;
    }
    return;
  });

  return interestRecords;
};

/**
 * Finds invoices that have either credits, or outstanding amounts.
 * @param {*} invoices [{},{},{}]
 * @returns [{},{},{}]
 */
const findOutstandingInvoices = invoices => {
  return invoices.filter(invoice => {
    const { beginningBalance, totalPayments, totalNewCharges, endingBalance, unPaidBalance } = invoice;
    const totalCharges = beginningBalance + totalNewCharges;
    // totalPayments is a negative number in DB
    const net = totalCharges + totalPayments;

    if (unPaidBalance >= 0.01 || net <= -0.01 || endingBalance <= -0.01) {
      return invoice;
    }
  });
};

/**
 * Takes two arrays that are to be joined, then removes duplicate items by checking against two properties inside object.
 * @param {*} pastCompanyInvoicesWithPayments [] array
 * @param {*} pastCompanyInvoicesWithNoPayments [] array
 * @param {*} propertyOne property to check one
 * @param {*} propertyTwo property to check two
 * @returns [{},{}] single array of objects.
 */
const joinTwoArraysAndRemoveDuplicateObjects = (
  pastCompanyInvoicesWithPayments,
  pastCompanyInvoicesWithNoPayments,
  propertyOne,
  propertyTwo,
) => {
  const invoicesWithDuplicates = [...pastCompanyInvoicesWithPayments, ...pastCompanyInvoicesWithNoPayments];
  return invoicesWithDuplicates.filter(
    (value, index, self) =>
      index ===
      self.findIndex(t => Number(t[propertyOne]) === Number(value[propertyOne]) && Number(t[propertyTwo]) === Number(value[propertyTwo])),
  );
};