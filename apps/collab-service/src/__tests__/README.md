# Collab Service Test Suite

This directory contains comprehensive unit tests for the Collaboration Service.

## Test Structure

```
src/
├── __mocks__/              # Mock implementations
│   ├── prisma.ts          # Prisma client mocks
│   ├── redis.ts           # Redis client mocks
│   └── yjs.ts             # Y.js document mocks
├── __tests__/
│   └── helpers/           # Test utilities
│       └── test-utils.ts  # Helper functions
├── services/
│   └── __tests__/         # Service tests
│       ├── session.service.test.ts
│       ├── snapshot.service.test.ts
│       └── yjs.service.test.ts
├── middleware/
│   └── __tests__/         # Middleware tests
│       ├── auth.test.ts
│       └── errorHandler.test.ts
├── routes/
│   └── __tests__/         # Route tests
│       └── session.routes.test.ts
└── utils/
    └── __tests__/         # Utility tests
        └── errors.test.ts
```

## Running Tests

### Install Dependencies

```bash
cd apps/collab-service
pnpm install
```

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

### Run Tests with Coverage

```bash
pnpm test:coverage
```

## Test Coverage

The test suite aims for 70%+ coverage across:

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

Coverage reports are generated in `coverage/` directory.

## What's Tested

### Services

- **SessionService**: Session CRUD operations, participant validation, expiration
- **SnapshotService**: Periodic snapshots, snapshot saving/loading, cleanup
- **YjsService**: Document management, Redis integration, garbage collection

### Middleware

- **Authentication**: JWT verification, JWKS validation, mock auth mode
- **Error Handler**: Error response formatting, status codes

### Routes

- **Session Routes**: All REST endpoints with authentication and authorization

### Utilities

- **Error Utilities**: CollaborationError, ErrorHandler, retry logic

## Mocking Strategy

### Prisma

- All database operations are mocked using `mockPrismaClient`
- Reset before each test with `resetPrismaMocks()`

### Redis

- Redis client, pub/sub clients mocked separately
- Reset before each test with `resetRedisMocks()`

### Y.js

- Custom mock implementations for Y.Doc, Y.Text, Y.Map
- Mock Awareness for collaboration features

### External Services

- JWKS authentication is mocked
- Config values can be overridden in tests

## Test Utilities

### Helper Functions

```typescript
createMockSession(); // Create mock session objects
createMockSnapshot(); // Create mock snapshot objects
createMockJWTPayload(); // Create mock JWT payload
createMockRequest(); // Create Express request mock
createMockResponse(); // Create Express response mock
createMockNext(); // Create Express next function
```

## Best Practices

1. **Isolation**: Each test is isolated with proper setup/teardown
2. **Mocking**: External dependencies are mocked to avoid integration test complexity
3. **Coverage**: Aim for high coverage but focus on meaningful tests
4. **Readability**: Test names clearly describe what is being tested
5. **Assertions**: Tests verify both success and failure scenarios

## Integration Tests

Integration tests will be added in a separate phase and will test:

- Real database connections
- Redis pub/sub functionality
- WebSocket connections
- End-to-end workflows

## Debugging Tests

To debug a specific test:

```bash
# Run a single test file
pnpm test session.service.test.ts

# Run tests matching a pattern
pnpm test --testNamePattern="should create session"

# Run with verbose output
pnpm test --verbose
```

## CI/CD Integration

Tests run automatically on:

- Pre-commit hooks (if configured)
- Pull request builds
- Main branch builds

Failed tests will block merges to ensure code quality.
