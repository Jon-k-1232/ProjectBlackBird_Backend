require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const app = express();
const contactsRouter = require('./endpoints/contacts/contacts-router');
const jobDescriptionRouter = require('./endpoints/jobDescriptions/jobDescriptions-router');
const payTo = require('./endpoints/payTo/payTo-router');
const transactions = require('./endpoints/transactions/transactions-router');
const employee = require('./endpoints/employee/employee-router');
const company = require('./endpoints/job/job-router');
const invoices = require('./endpoints/invoice/invoice-router');
const createInvoices = require('./endpoints/createInvoice/createInvoice-router');

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

//middleware
app.use(morgan(morganOption));
app.use(helmet());
app.use(express.json());

app.use(
  cors({
    origin: '*',
  }),
);

/* ///////////////////////////\\\\  USER ENDPOINTS  ////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.use('/contacts', contactsRouter);
app.use('/jobs', company);
app.use('/jobDescription', jobDescriptionRouter);
app.use('/payTo', payTo);
app.use('/transactions', transactions);
app.use('/employee', employee);
app.use('/invoices', invoices);
app.use('/create', createInvoices);

/* ///////////////////////////\\\\  ERROR HANDLER  ////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
