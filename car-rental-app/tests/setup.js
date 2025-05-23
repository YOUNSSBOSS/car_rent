// tests/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    // useNewUrlParser: true, // no longer needed
    // useUnifiedTopology: true, // no longer needed
  });
});

// Clear all data from all collections before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({}); // Deletes all documents
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
