const express = require('express');
const contactsRouter = express.Router();
const contactService = require('./contacts-service');

contactsRouter.route('/all').get(async (req, res) => {
	const db = req.app.get('db');

	contactService.getAllContactsInfo(db).then(allContactInfo => {
		res.send({
			allContactInfo,
			status: 200,
		});
	});
});

contactsRouter.route('/allActiveContacts').get(async (req, res) => {
	const db = req.app.get('db');

	contactService.getAllActiveContacts(db).then(activeContacts => {
		res.send({
			activeContacts,
			status: 200,
		});
	});
});

module.exports = contactsRouter;
