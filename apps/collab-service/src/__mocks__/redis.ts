/**
 * Mock Redis clients for testing
 */

export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
  disconnect: jest.fn(),
  quit: jest.fn(),
  ping: jest.fn(),
  on: jest.fn(),
};

export const mockRedisPubClient = {
  publish: jest.fn(),
  disconnect: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
};

export const mockRedisSubClient = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  disconnect: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
};

// Mock the redis module
jest.mock('../utils/redis.js', () => ({
  getRedisClient: jest.fn(() => mockRedisClient),
  getRedisPubClient: jest.fn(() => Promise.resolve(mockRedisPubClient)),
  getRedisSubClient: jest.fn(() => Promise.resolve(mockRedisSubClient)),
  disconnectRedis: jest.fn(),
}));

export const resetRedisMocks = () => {
  Object.values(mockRedisClient).forEach(fn => {
    if (typeof fn === 'function' && 'mockReset' in fn) {
      (fn as jest.Mock).mockReset();
    }
  });
  Object.values(mockRedisPubClient).forEach(fn => {
    if (typeof fn === 'function' && 'mockReset' in fn) {
      (fn as jest.Mock).mockReset();
    }
  });
  Object.values(mockRedisSubClient).forEach(fn => {
    if (typeof fn === 'function' && 'mockReset' in fn) {
      (fn as jest.Mock).mockReset();
    }
  });
};
