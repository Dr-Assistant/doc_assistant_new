const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_TEST_URI = mongoUri;
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  id: '12345678-1234-1234-1234-123456789012',
  username: 'testdoctor',
  email: 'test@example.com',
  role: 'doctor',
  specialty: 'General Medicine',
  ...overrides
});

global.createMockRecordingData = (overrides = {}) => ({
  encounterId: '11111111-1111-1111-1111-111111111111',
  patientId: '22222222-2222-2222-2222-222222222222',
  doctorId: '12345678-1234-1234-1234-123456789012',
  duration: 120,
  deviceInfo: 'Test Device',
  originalFileName: 'test-recording.mp3',
  mimeType: 'audio/mpeg',
  ...overrides
});

global.createMockAudioBuffer = (size = 1024) => {
  return Buffer.alloc(size, 'test audio data');
};
