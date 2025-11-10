# Integration Tests for Collaboration Service

This directory contains integration tests that test services with real dependencies (database, Redis, etc.) in a controlled test environment.

## Structure

```
__integration__/
├── helpers/
│   ├── test-db.ts      # Database test utilities
│   └── test-redis.ts   # Redis test utilities
├── services/
│   ├── session.integration.test.ts
│   └── snapshot.integration.test.ts
└── middleware/
    └── auth.integration.test.ts
```

## Running Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Watch mode
pnpm test:integration:watch

# Run specific test file
pnpm test:integration -- session.integration.test.ts
```

## Prerequisites

Integration tests require:
- PostgreSQL test database running
- Redis test instance running (optional, depends on test)

### Database Setup

The integration tests use a separate test database. Set the connection string in your environment:

```bash
export TEST_DATABASE_URL="postgresql://test:test@localhost:5433/collab_test"
```

Or use the default from `jest.integration.setup.js`.

### Redis Setup (Optional)

If testing Redis-dependent features:

```bash
export TEST_REDIS_HOST="localhost"
export TEST_REDIS_PORT="6380"
```

## Test Database Lifecycle

Each test suite:
1. **Setup**: Connects to database
2. **Before Each**: Cleans all test data
3. **Test**: Runs with clean database
4. **After All**: Disconnects from database

## Writing Integration Tests

Example:

```typescript
import { ServiceName } from '../../services/service-name.js';
import { TestDatabase } from '../helpers/test-db.js';

describe('ServiceName Integration Tests', () => {
  beforeAll(async () => {
    await TestDatabase.setup();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  it('should do something', async () => {
    // Your test code
  });
});
```

## Differences from Unit Tests

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| Dependencies | Mocked | Real (DB, Redis) |
| Speed | Fast (~5s) | Slower (~30s) |
| Isolation | Complete | Shared resources |
| Setup | Minimal | Requires services |
| Configuration | `jest.config.cjs` | `jest.integration.config.cjs` |

## Tips

- Integration tests run serially (`maxWorkers: 1`) to avoid conflicts
- Each test gets a clean database state
- Use meaningful test data that reflects real scenarios
- Test happy paths and error cases
- Verify database state after operations
