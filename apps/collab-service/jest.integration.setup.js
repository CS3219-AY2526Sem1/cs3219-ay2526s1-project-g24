// Integration test setup - use real services but in test mode

// Set test mode
process.env.NODE_ENV = 'test';

// Database configuration - use test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/collab_test';

// Redis configuration - use test Redis instance
process.env.REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.TEST_REDIS_PORT || '6380';

// Service URLs
process.env.USER_SERVICE_URL = 'http://localhost:8000';
process.env.QUESTION_SERVICE_URL = 'http://localhost:3001';

// Auth configuration
process.env.ENABLE_MOCK_AUTH = 'true';
process.env.JWT_SECRET = 'test-integration-secret';
process.env.JWKS_URI = 'http://localhost:8000/.well-known/jwks.json';

// Port for integration tests
process.env.PORT = '3005';

// Log level
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// Suppress non-critical console output
const originalWarn = console.warn;
const originalLog = console.log;
const originalInfo = console.info;

global.console = {
  ...console,
  log: jest.fn((...args) => {
    // Allow specific logs if needed
    if (process.env.DEBUG_INTEGRATION_TESTS === 'true') {
      originalLog(...args);
    }
  }),
  info: jest.fn((...args) => {
    if (process.env.DEBUG_INTEGRATION_TESTS === 'true') {
      originalInfo(...args);
    }
  }),
  warn: jest.fn((...args) => {
    if (process.env.DEBUG_INTEGRATION_TESTS === 'true') {
      originalWarn(...args);
    }
  }),
  // Keep error for debugging
  error: console.error,
};
