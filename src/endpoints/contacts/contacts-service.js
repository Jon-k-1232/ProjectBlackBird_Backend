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
};

module.exports = contactService;
