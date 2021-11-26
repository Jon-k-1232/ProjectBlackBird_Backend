const payTo = {
	getpayToInfo(db) {
		return db.select().table('setupdata');
	},
};

module.exports = payTo;
