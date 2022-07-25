const dayjs = require('dayjs');

module.exports = {
  PORT: 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://@localhost/jka_time_and_billing',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://@localhost/jka_time_and_billing',
  defaultDaysInPast: 730,
  // interest Calculation
  defaultInterestRate: 15 / 100,
  defaultInterestMonthsInYear: 12,
  // PDF Creation
  defaultPdfSaveLocation: `${__dirname}/pdf_holder/${dayjs().format('YYYY-MM-DD')}`,
};

// const dayjs = require('dayjs');

// module.exports = {
//   PORT: 8000,
//   NODE_ENV: process.env.NODE_ENV || 'development',
//   DATABASE_URL: process.env.DATABASE_URL || 'postgresql://@localhost/jka_test',
//   TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://@localhost/jka_test',
//   defaultDaysInPast: 730,
//   // interest Calculation
//   defaultInterestRate: 15 / 100,
//   defaultInterestMonthsInYear: 12,
//   // PDF Creation
//   defaultPdfSaveLocation: `${__dirname}/pdf_holder/${dayjs().format('YYYY-MM-DD')}`,
//   // defaultPdfSaveLocation: `/Users/jonkimmel/Desktop/pdf_holder`,
// };
