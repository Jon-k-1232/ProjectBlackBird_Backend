const jobDescriptions = {
	getAllJobDescriptions(db) {
		return db.select().table('jobdefinition');
	},
};

module.exports = jobDescriptions;
