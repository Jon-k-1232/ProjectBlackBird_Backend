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

/**
 * Take an array of integers, company oids, or an array with a single OID. Will zero the account, and deactivate.
 * http://localhost:8000/contacts/cleanAndDeactivate
 */
contactsRouter.route('/zeroAndDeactivate').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { companyIds } = req.body;

  const sanitizedData = sanitizeFields({ companyIds });
  // Since sanitized, companyIds is one giant string, must be separated at commas then converted into ints
  const stringedIds = sanitizedData.companyIds.split(',');
  const arrayOfIntegerIds = stringedIds.map(id => Number(id));

  const contact = await Promise.all(arrayOfIntegerIds.map(contactId => cleanup(contactId, db)));
  const updatedContact = contact[0][0];

  res.send({
    updatedContact,
    status: 200,
  });
});

/**
 * http://localhost:8000/contacts/zeroOutCompany
 * Takes an array with integers (oid's).
 */
contactsRouter.route('/zeroOutCompany').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const { companyIds } = req.body;

  const contact = await Promise.all(companyIds.map(contactId => zeroContact(contactId, db)));
  const updatedContact = contact[0][0];

  res.send({
    updatedContact,
    status: 200,
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

const cleanup = async (contactId, db) => {
  const update = {
    statementBalance: 0,
    currentBalance: 0,
    beginningBalance: 0,
    originalCurrentBalance: 0,
    inactive: true,
    notBillable: true,
    newBalance: false,
    balanceChanged: false,
  };

  // const contact = await contactService.getContactInfo(db, contactId);
  const updateContact = await contactService.companyCleanupForDeactivation(db, contactId, update);

  return updateContact;
};

const zeroContact = async (contactId, db) => {
  const update = {
    statementBalance: 0,
    currentBalance: 0,
    beginningBalance: 0,
    originalCurrentBalance: 0,
    newBalance: false,
    balanceChanged: false,
  };

  // const contact = await contactService.getContactInfo(db, contactId);
  const updateContact = await contactService.companyZeroOut(db, contactId, update);

  return updateContact;
};
