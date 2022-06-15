const jobService = {
  /**
   * Gets all jobs for a user provided company
   * @param {*} db takes in db
   * @param {*} time company OID
   * @returns [{},{}] Array of objects. Each object is a job for the given company
   */
  getJobs(db, companyId, currDate, prevDate) {
    return db.select().from('job').whereIn('company', [companyId]).whereBetween('startDate', [prevDate, currDate]);
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
   * Gets all jobs within a given time frame
   * @param {*} db takes in db
   * @param {*} time company OID
   * @returns [{},{}] Array of objects. Each object is a job
   */
  getAllJobs(db, currDate, prevDate) {
    return db.select().from('job').whereBetween('startDate', [prevDate, currDate]);
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

  /**
   * Get last oid
   * @param {*} db
   * @returns
   */
  getLastJobOidInDB(db) {
    return db.from('job').max('oid');
  },
};

module.exports = jobService;
