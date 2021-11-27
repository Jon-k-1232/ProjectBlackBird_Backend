const contactService = {
	getAllContactsInfo(db) {
		return db.select().table('company');
	},

	getAllActiveContacts(db) {
		return db.select().from('company').whereIn('inactive', [false]);
	},
};

module.exports = contactService;
