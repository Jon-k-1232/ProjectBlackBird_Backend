const jobService = {
	/**
	 * @param {*} db takes in db
	 * @param {*} time company OID
	 * @returns returns a list of jobs for user input company
	 */
	getJobs(db, companyId) {
		return db.select().from('job').whereIn('company', [companyId]);
	},
};

module.exports = jobService;
