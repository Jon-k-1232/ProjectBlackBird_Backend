const payToService = {
	/**
	 * Gets all paid to data
	 * @param {*} db
	 * @returns [{},{}] array of objects. Each object is a 'pay to' record
	 */
	getpayToInfo(db) {
		return db.select().table('setupdata');
	},
};

module.exports = payToService;
