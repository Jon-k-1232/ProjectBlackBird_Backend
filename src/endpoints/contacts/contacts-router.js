const express = require('express');
const contactsRouter = express.Router();
const contactService = require('./contacts-service');
const jsonParser = express.json();
const { sanitizeFields } = require('../../utils');

/**
 * Gets all contacts
 */
contactsRouter.route('/all').get(async (req, res) => {
  const db = req.app.get('db');

  contactService.getAllContactsInfo(db).then(allContactInfo => {
    res.send({
      allContactInfo,
      status: 200,
    });
  });
});

/**
 * Finds company with company id
 */
contactsRouter.route('/company/:companyId').get(async (req, res) => {
  const db = req.app.get('db');
  const companyId = parseInt(req.params.companyId, 10);

  contactService.getContactInfo(db, companyId).then(companyContactInformation => {
    res.send({
      companyContactInformation,
      status: 200,
    });
  });
});

/**
 * Gets all active contacts
 */
contactsRouter.route('/allActiveContacts').get(async (req, res) => {
  const db = req.app.get('db');

  contactService.getAllActiveContacts(db).then(activeContacts => {
    res.send({
      activeContacts,
      status: 200,
    });
  });
});

/**
 * Adds a new contact
 */
contactsRouter.route('/new/contact').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const {
    oid,
    newBalance,
    balanceChanged,
    companyName,
    firstName,
    lastName,
    middleI,
    address1,
    address2,
    city,
    state,
    zip,
    country,
    phoneNumber1,
    mobilePhone,
    currentBalance,
    beginningBalance,
    statementBalance,
    inactive,
    originalCurrentBalance,
    notBillable,
  } = req.body;

  const newContact = sanitizeFields({
    oid,
    newBalance,
    balanceChanged,
    companyName,
    firstName,
    lastName,
    middleI,
    address1,
    address2,
    city,
    state,
    zip,
    country,
    phoneNumber1,
    mobilePhone,
    currentBalance,
    beginningBalance,
    statementBalance,
    inactive,
    originalCurrentBalance,
    notBillable,
  });

  contactService.insertNewContact(db, newContact).then(() => {
    res.send({
      message: 'Contact added successfully.',
      status: 200,
    });
  });
});

/**
 * Updates a user specified user. Param is integer
 */
contactsRouter.route('/update/contact/:contactId').put(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { contactId } = parseInt(req.params, 10);
  const {
    oid,
    newBalance,
    balanceChanged,
    companyName,
    firstName,
    lastName,
    middleI,
    address1,
    address2,
    city,
    state,
    zip,
    country,
    phoneNumber1,
    mobilePhone,
    currentBalance,
    beginningBalance,
    statementBalance,
    inactive,
    originalCurrentBalance,
    notBillable,
  } = req.body;

  const updatedContact = sanitizeFields({
    oid,
    newBalance,
    balanceChanged,
    companyName,
    firstName,
    lastName,
    middleI,
    address1,
    address2,
    city,
    state,
    zip,
    country,
    phoneNumber1,
    mobilePhone,
    currentBalance,
    beginningBalance,
    statementBalance,
    inactive,
    originalCurrentBalance,
    notBillable,
  });

  contactService.updateContact(db, contactId, updatedContact).then(() => {
    contactService.getAllContactsInfo(db).then(contacts => {
      res.send({
        contacts,
        message: 'Job description updated',
        status: 200,
      });
    });
  });
});

module.exports = contactsRouter;
