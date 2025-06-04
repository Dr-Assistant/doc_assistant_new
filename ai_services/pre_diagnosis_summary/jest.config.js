module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/src/tests/**/*.test.js',
    '**/src/**/*.test.js'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/app.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Test timeout
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Transform configuration
  transform: {},

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Global setup and teardown
  globalSetup: '<rootDir>/src/tests/globalSetup.js',
  globalTeardown: '<rootDir>/src/tests/globalTeardown.js'
};
