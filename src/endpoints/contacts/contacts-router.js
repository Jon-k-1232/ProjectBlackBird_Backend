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
contactsRouter.route('/cleanAndDeactivate/:list').post(jsonParser, async (req, res) => {
  const db = req.app.get('db');
  const list = req.params.list;

  const sanitizedData = sanitizeFields({ list });
  // Since sanitized, list is one giant string, must be separated at commas then converted into ints
  const stringedIds = sanitizedData.list.split(',');
  const arrayOfIntegerIds = stringedIds.map(id => Number(id));
  // const arrayOfIds = [245];

  await Promise.all(arrayOfIntegerIds.map(contactId => cleanup(contactId, db)));

  res.send({ status: 200 });
});

/**
 * Debug
 * http://localhost:8000/contacts/cleanAndDeactivate/debug
 */
// contactsRouter.route('/cleanAndDeactivate/debug').get(async (req, res) => {
//   const db = req.app.get('db');

//   const arrayOfIds = [
//     164593, 482, 347, 484, 26, 58774, 83, 305, 150445, 423, 281, 174840, 156, 113818, 408027, 154776, 361449, 164527, 86786, 259, 125705,
//     164632, 70474, 83134, 383, 648, 188, 386, 221121, 384780, 600, 115492, 131283, 133850, 133849, 81396, 217469, 290, 20, 249, 463, 152033,
//     520, 325, 73876, 103187, 13, 385, 349579, 342, 86839, 68614, 145, 267796, 340210, 179643, 173, 606, 408130, 329607, 627, 641, 353014,
//     162994, 236667, 207158, 304945, 340402, 115497, 195824, 239961, 223812, 359353, 59739, 152328, 167, 148515, 70442, 152208, 123941,
//     125738, 212866, 194249, 135981, 408, 66997, 267503, 281012, 197749, 349370, 228, 339, 375, 114055, 337889, 213, 335512, 90073, 101133,
//     642, 152325, 663, 467, 200864, 402, 198026, 149, 63, 315037, 133773, 359048, 92, 130173, 241460, 246102, 569, 131277, 338001, 131276,
//     130174, 388, 165987, 51637, 532, 364, 333251, 632, 337893, 312315, 179902, 24, 315292, 315204, 262, 70207, 239948, 56286, 105851, 398,
//     312379, 159454, 138, 200569, 99242, 317, 128100, 410284, 480, 219376, 219223, 322, 410426, 152, 75960, 100924, 100904, 373, 139662, 410,
//     169525, 190082, 95, 387, 377, 378, 225, 349187, 349494, 335178, 113692, 103100, 125974, 77913, 82, 54, 546, 214, 59, 660, 289828,
//     382623, 223, 282, 164, 372, 265617, 236329, 124023, 583, 164548, 212774, 169, 83643, 248113, 338, 111571, 277, 59616, 202, 61, 94,
//     72228, 86936, 86934, 255138, 114, 80854, 335, 83940, 240, 128070, 128073, 128076, 129939,
//   ];

//   await Promise.all(arrayOfIds.map(contactId => cleanup(contactId, db)));

//   res.send({ status: 200 });
// });

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
