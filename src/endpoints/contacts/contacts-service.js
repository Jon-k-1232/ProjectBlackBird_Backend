const contactService = {
	getAllContactsInfo(db) {
		return db.select().table('company');
	},
};

module.exports = contactService;
