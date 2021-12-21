const express = require('express')
const payToRouter = express.Router()
const payToService = require('./payTo-service')
const jsonParser = express.json()
const { sanitizeFields } = require('../../utils')

// Gets most recent 'pay to' record
payToRouter.route('/recent').get(async (req, res) => {
	const db = req.app.get('db')

	payToService.getpayToInfo(db).then(payToInfo => {
		const payToMostRecent = payToInfo.pop()
		res.send({
			payToMostRecent,
			status: 200,
		})
	})
})

// Updates information for who to pay
payToRouter.route('/update/payTo').post(jsonParser, async (req, res) => {
	const db = req.app.get('db')
	const {
		customername,
		customeraddress,
		customercity,
		customerstate,
		customerzip,
		customerphone,
		customerfax,
		dayofweek,
		calendarweekrule,
		lastinvoicenumber,
		lockedby,
		statementtext,
	} = req.body

	const newRecord = sanitizeFields({
		customername,
		customeraddress,
		customercity,
		customerstate,
		customerzip,
		customerphone,
		customerfax,
		dayofweek,
		calendarweekrule,
		lastinvoicenumber,
		lockedby,
		statementtext,
	})

	payToService.insertPayToInfo(db, newRecord).then(() => {
		res.send({ message: 'invoice added successfully.', status: 200 })
	})
})

module.exports = payToRouter
