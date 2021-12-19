// NEW FUNC
const groupByJob = data => {
	const jobListWithDuplicates = data.map(record => record.job);
	const jobList = [...new Set(jobListWithDuplicates)];

	const sortedRecords = jobList.map(jobId => {
		let groupedRecords = [];

		data.map(record => {
			if (record.job === jobId) {
				groupedRecords = [...groupedRecords, record];
			}
			return record;
		});
		return groupedRecords;
	});

	const calculation = calculateTotals(sortedRecords);
	console.log(calculation);
};

// NEW FUNC
const calculateTotals = sortedRecords => {
	return sortedRecords.map(groupedItemList => {
		let details = { job: [], charges: [], payments: [], net: [] };

		return groupedItemList.map(record => {
			if (record.transactiontype === 'Charge') {
				details.charges = [...details.charges, record.totaltransaction];
			} else if (record.transactiontype === 'Payment') {
				details.payments = [...details.payments, record.totaltransaction];
			}

			if (record === groupedItemList[groupedItemList.length - 1]) {
				const totalCharges = details.charges.reduce(
					(prev, curr) => prev + curr,
					0,
				);
				const totalPayments = details.payments.reduce(
					(prev, curr) => prev + curr,
					0,
				);
				details.net = totalCharges - totalPayments;
				details.charges = totalCharges;
				details.payments = totalPayments;
				details.job = record.job;
				groupedItemList.forEach(item => {
					item.groupDetails = details;
				});
			}
			return record;
		});
	});
};
