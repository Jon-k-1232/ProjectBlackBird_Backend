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
		return db.insert(newContact).returning('*').into('company');
	},

	/**
	 * Updates a specific contact
	 * @param {*} db
	 * @param {*} contactId Integer, ID to be updated
	 * @param {*} updatedContact all contact fields
	 * @returns [{},{}] Array of objects. Each object is a active contact
	 */
	updateContact(db, contactId, updatedContact) {
		return db
			.insert()
			.from('company')
			.where('oid', contactId)
			.update(updatedContact);
	},
};

module.exports = contactService;
