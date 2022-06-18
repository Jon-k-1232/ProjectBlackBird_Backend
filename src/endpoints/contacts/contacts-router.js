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
  const companyId = Number(req.params.companyId);

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
 * Gets priorClients
 */
contactsRouter.route('/allPriorContacts').get(async (req, res) => {
  const db = req.app.get('db');

  contactService.getAllPriorContacts(db).then(priorContacts => {
    res.send({
      priorContacts,
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

  const cleanedFields = sanitizeFields({
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

  const contactInfo = convertToRequiredTypes(cleanedFields);
  const lastOid = await contactService.getLastContactOidInDB(db);
  const oid = Number(lastOid[0].max) + 1;
  const newContact = { ...contactInfo, oid };

  contactService.insertNewContact(db, newContact).then(updatedContact => {
    res.send({
      updatedContact,
      message: 'Contact added successfully.',
      status: 200,
    });
  });
});

/**
 * Updates a user specified user. Param is integer
 */
contactsRouter.route('/update/contact/:contactId').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { contactId } = req.params;
  const id = Number(contactId);
  const {
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

  const cleanedFields = sanitizeFields({
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

  const updatedContact = convertToRequiredTypes(cleanedFields);

  contactService.updateContact(db, id, updatedContact).then(updatedContact => {
    res.send({
      updatedContact,
      message: 'Contact description updated',
      status: 200,
    });
  });
});

module.exports = contactsRouter;

/**
 * Takes params and converts required items to correct type for db insert.
 * @param {*} contactItem
 * @returns
 */
const convertToRequiredTypes = contactItem => {
  return {
    newBalance: Boolean(contactItem.newBalance),
    balanceChanged: Boolean(contactItem.balanceChanged),
    companyName: contactItem.companyName,
    firstName: contactItem.firstName,
    lastName: contactItem.lastName,
    middleI: contactItem.middleI,
    address1: contactItem.address1,
    address2: contactItem.address2,
    city: contactItem.city,
    state: contactItem.state,
    zip: contactItem.zip,
    country: contactItem.country,
    phoneNumber1: contactItem.phoneNumber1,
    mobilePhone: contactItem.mobilePhone,
    currentBalance: Number(contactItem.currentBalance),
    beginningBalance: Number(contactItem.beginningBalance),
    statementBalance: Number(contactItem.statementBalance),
    inactive: Boolean(contactItem.inactive),
    originalCurrentBalance: Number(contactItem.originalCurrentBalance),
    notBillable: Boolean(contactItem.notBillable),
  };
};
