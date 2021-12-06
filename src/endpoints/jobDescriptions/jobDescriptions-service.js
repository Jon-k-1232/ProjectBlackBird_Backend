const jobDescriptions = {
	/**
	 * Gets all job descriptions
	 * @param {*} db take in db
	 * @returns [{},{}] array of objects. each object is a job description
	 */
	getAllJobDescriptions(db) {
		return db.select().table('jobdefinition');
	},
};

module.exports = jobDescriptions;
