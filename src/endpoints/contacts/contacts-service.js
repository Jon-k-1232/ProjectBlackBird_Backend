const contactService = {
  /**
   * Gets all contacts
   * @param {*} db
   * @returns [{},{}] Array of objects. Each object is a contact
   */
  getAllContactsInfo(db) {
    return db.select().table('company');
  },

  /**
   * Gets all active contacts
   * @param {*} db
   * @returns [{},{}] Array of objects. Each object is a active contact
   */
  getAllActiveContacts(db) {
    return db.select().from('company').whereIn('inactive', [false]);
  },

  /**
   * Updates contact information
   * @param {*} db
   * @param {*} id int
   * @returns [{}] array of object. object is company record
   */
  getContactInfo(db, id) {
    return db.select().from('company').whereIn('oid', [id]);
  },

  /**
   * Creates new company/ contact
   * @param {*} db
   * @param {*} newContact
   * @returns [{},{}] Array of objects. Each object is a active contact
   */
  insertNewContact(db, newContact) {
    return db.insert(newContact).into('company').returning();
  },

  getLastContactOidInDB(db) {
    return db.from('company').max('oid');
  },

  /**
   * Updates a specific contact
   * @param {*} db
   * @param {*} contactId Integer, ID to be updated
   * @param {*} updatedContact all contact fields
   * @returns [{},{}] Array of objects. Each object is a active contact
   */
  updateContact(db, contactId, updatedContact) {
    return db.update(updatedContact).from('company').where('oid', contactId);
  },

  updateThreeCompanyColumns(db, updatedContact) {
    const { oid, newBalance, balanceChanged, currentBalance } = updatedContact;
    return db
      .update('newBalance', newBalance)
      .update('balanceChanged', balanceChanged)
      .update('currentBalance', currentBalance)
      .from('company')
      .where('oid', oid);
  },
};

module.exports = contactService;
