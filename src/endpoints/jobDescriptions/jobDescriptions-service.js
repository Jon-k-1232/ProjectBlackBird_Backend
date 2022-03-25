const jobDescriptions = {
  /**
   * Gets all job descriptions
   * @param {*} db take in db
   * @returns [{},{}] array of objects. each object is a job description
   */
  getAllJobDescriptions(db) {
    return db.select().table('jobDefinition');
  },

  /**
   * Insert a new job type/ description
   * @param {*} db
   * @param {*} newJobDescription {}
   * @returns
   */
  insertNewJobDescription(db, newJobDescription) {
    return db.insert(newJobDescription).returning('*').into('jobDefinition');
  },

  /**
   * Update a job description/ type
   * @param {*} db
   * @param {*} descriptionId
   * @param {*} updatedDescription
   * @returns
   */
  updateJobDescription(db, descriptionId, updatedDescription) {
    return db.insert().from('jobDefinition').where('oid', descriptionId).update(updatedDescription);
  },
};

module.exports = jobDescriptions;
