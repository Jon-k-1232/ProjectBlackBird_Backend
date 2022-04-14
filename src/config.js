module.exports = {
  PORT: 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://@localhost/jka_test',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://@localhost/jka_test',
  defaultDaysInPast: 730,
};
