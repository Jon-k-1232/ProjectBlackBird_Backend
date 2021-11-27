const payToService = {
	getpayToInfo(db) {
		return db.select().table('setupdata');
	},
};

module.exports = payToService;
