/**
 * For e2e testing we need to mock this values
 */
process.env = {
  ...process.env,
  MONGO_DATABASE_URL: 'mongodb://localhost/codingcoach_test',
};
