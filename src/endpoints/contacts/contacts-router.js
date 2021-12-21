const express = require('express')
const contactsRouter = express.Router()
const contactService = require('./contacts-service')
const jsonParser = express.json()
const { sanitizeFields } = require('../../utils')

/**
 * Gets all contacts
 */
contactsRouter.route('/all').get(async (req, res) => {
	const db = req.app.get('db')

	contactService.getAllContactsInfo(db).then(allContactInfo => {
		res.send({
			allContactInfo,
			status: 200,
		})
	})
})

/**
 * Gets all active contacts
 */
contactsRouter.route('/allActiveContacts').get(async (req, res) => {
	const db = req.app.get('db')

	contactService.getAllActiveContacts(db).then(activeContacts => {
		res.send({
			activeContacts,
			status: 200,
		})
	})
})

/**
 * Adds a new contact
 */
contactsRouter.route('/new/contact').post(jsonParser, async (req, res) => {
	const db = req.app.get('db')
	const {
		phantompayment,
		newbalance,
		balancechanged,
		companyname,
		firstname,
		lastname,
		middlei,
		address1,
		address2,
		address3,
		city,
		state,
		zip,
		country,
		phonenumber1,
		phonenumber2,
		mobilephone,
		fax,
		email,
		url,
		outlookid,
		currentbalance,
		beginningbalance,
		statementbalance,
		other,
		inactive,
		note,
		originalcurrentbalance,
		usertag,
		ageingadjustment,
		notbillable,
		agingcorrection,
	} = req.body

	const newContact = sanitizeFields({
		phantompayment,
		newbalance,
		balancechanged,
		companyname,
		firstname,
		lastname,
		middlei,
		address1,
		address2,
		address3,
		city,
		state,
		zip,
		country,
		phonenumber1,
		phonenumber2,
		mobilephone,
		fax,
		email,
		url,
		outlookid,
		currentbalance,
		beginningbalance,
		statementbalance,
		other,
		inactive,
		note,
		originalcurrentbalance,
		usertag,
		ageingadjustment,
		notbillable,
		agingcorrection,
	})

	contactService.insertNewContact(db, newContact).then(() => {
		res.send({
			message: 'Contact added successfully.',
			status: 200,
		})
	})
})

/**
 * Updates a user specified user. Param is integer
 */
contactsRouter.route('/update/contact/:contactId').put(jsonParser, async (req, res) => {
	const db = req.app.get('db')
	const { contactId } = req.params
	const {
		phantompayment,
		newbalance,
		balancechanged,
		companyname,
		firstname,
		lastname,
		middlei,
		address1,
		address2,
		address3,
		city,
		state,
		zip,
		country,
		phonenumber1,
		phonenumber2,
		mobilephone,
		fax,
		email,
		url,
		outlookid,
		currentbalance,
		beginningbalance,
		statementbalance,
		other,
		inactive,
		note,
		originalcurrentbalance,
		usertag,
		ageingadjustment,
		notbillable,
		agingcorrection,
	} = req.body

	const updatedContact = sanitizeFields({
		phantompayment,
		newbalance,
		balancechanged,
		companyname,
		firstname,
		lastname,
		middlei,
		address1,
		address2,
		address3,
		city,
		state,
		zip,
		country,
		phonenumber1,
		phonenumber2,
		mobilephone,
		fax,
		email,
		url,
		outlookid,
		currentbalance,
		beginningbalance,
		statementbalance,
		other,
		inactive,
		note,
		originalcurrentbalance,
		usertag,
		ageingadjustment,
		notbillable,
		agingcorrection,
	})

	contactService.updateContact(db, contactId, updatedContact).then(() => {
		contactService.getAllContactsInfo(db).then(contacts => {
			res.send({
				contacts,
				message: 'Job description updated',
				status: 200,
			})
		})
	})
})

module.exports = contactsRouter
