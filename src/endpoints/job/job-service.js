const jobService = {
	/**
	 * Gets all jobs for a user provided company
	 * @param {*} db takes in db
	 * @param {*} time company OID
	 * @returns [{},{}] Array of objects. Each object is a job for the given company
	 */
	getJobs(db, companyId, now, date) {
		return db
			.select()
			.from('job')
			.whereIn('company', [companyId])
			.whereBetween('startdate', [date, now]);
	},

	/**
	 * Gets all job details
	 * @param {*} db takes in db
	 * @param {*} arrayOfIds [array of ints]. Each int is a job number which is an 'oid' in 'jobdefinition' table
	 * @returns [{},{}] Array of objects. Each object is a matched job definition
	 */
	getJobDetail(db, arrayOfIds) {
		return db.select().from('jobdefinition').whereIn('oid', arrayOfIds);
	},

	/**
	 * Gets all jobs within a given timeframe
	 * @param {*} db takes in db
	 * @param {*} time company OID
	 * @returns [{},{}] Array of objects. Each object is a job
	 */
	getAllJobs(db, now, date) {
		return db.select().from('job').whereBetween('startdate', [date, now]);
	},

	/**
	 *
	 * @param {*} db
	 * @param {*} newMessage
	 * @returns
	 */
	insertNewJob(db, newJob) {
		return db.insert(newJob).returning('*').into('job');
	},
};

module.exports = jobService;
