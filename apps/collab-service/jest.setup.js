// Suppress console logs during tests to reduce noise
// Keep a reference to original console.error for critical errors
const originalError = console.error;

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Suppress console.error to prevent worker crashes from service code errors
  // These are expected during error handling tests
  error: jest.fn((message, ...args) => {
    // Only log actual test failures, not service code errors
    if (message && typeof message === 'string' && message.includes('Test suite failed')) {
      originalError(message, ...args);
    }
  }),
};

// Set test mode flag
process.env.NODE_ENV = 'test';

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.USER_SERVICE_URL = 'http://localhost:8000';
process.env.QUESTION_SERVICE_URL = 'http://localhost:3001';
process.env.ENABLE_MOCK_AUTH = 'true';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '3003';
