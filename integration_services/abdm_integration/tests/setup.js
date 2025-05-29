/**
 * Jest test setup
 */

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '8101';
process.env.ABDM_BASE_URL = 'https://dev.abdm.gov.in/gateway';
process.env.ABDM_CLIENT_ID = 'test-client-id';
process.env.ABDM_CLIENT_SECRET = 'test-client-secret';
process.env.ABDM_AUTH_URL = 'https://dev.abdm.gov.in/gateway/v0.5/sessions';
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
