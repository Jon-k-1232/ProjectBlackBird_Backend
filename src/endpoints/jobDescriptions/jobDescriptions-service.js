const jobDescriptions = {
	/**
	 * Gets all job descriptions
	 * @param {*} db take in db
	 * @returns [{},{}] array of objects. each object is a job description
	 */
	getAllJobDescriptions(db) {
		return db.select().table('jobdefinition')
	},

	/**
	 * Insert a new job type/ description
	 * @param {*} db
	 * @param {*} newJobDescription {}
	 * @returns
	 */
	insertNewJobDescription(db, newJobDescription) {
		return db.insert(newJobDescription).returning('*').into('jobdefinition')
	},

	/**
	 * Update a job description/ type
	 * @param {*} db
	 * @param {*} descriptionId
	 * @param {*} updatedDescription
	 * @returns
	 */
	updateJobDescription(db, descriptionId, updatedDescription) {
		return db.insert().from('jobdefinition').where('oid', descriptionId).update(updatedDescription)
	},
}

module.exports = jobDescriptions
