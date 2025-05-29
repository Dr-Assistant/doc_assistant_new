/**
 * Jest test setup
 */

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '8004';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'dr_assistant_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise during tests

// Mock logger to prevent console output during tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));
