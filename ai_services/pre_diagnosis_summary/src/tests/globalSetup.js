const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  // Start in-memory MongoDB instance for testing
  const mongod = new MongoMemoryServer();
  await mongod.start();
  
  const uri = mongod.getUri();
  
  // Store the URI and instance for cleanup
  global.__MONGOD__ = mongod;
  process.env.MONGODB_TEST_URI = uri;
  
  console.log('Test MongoDB started at:', uri);
};
