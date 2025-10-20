# Integration Test JWT Mocking: Why and How

## Problem: JWT Verification in Integration Tests

When running integration tests for endpoints that require JWT authentication, you want to:
- Use a test-only keypair for signing and verifying JWTs
- Avoid hitting a real JWKS endpoint or using production keys
- Ensure your app code and test code both use the same mocked key

However, mocking libraries like `jose` in Node.js/ESM environments can be tricky. If the mock is not applied early enough, or if modules are imported statically, the real `jose` module may be loaded before the mock is in place. This leads to 401 Unauthorized errors in your tests, even if your mock looks correct.

## What Went Wrong (and Why)

- **Static imports**: If you import `jose` or your server/middleware before mocking, the real module is loaded and cached. Your mock is ignored by the app code.
- **`vi.mock` timing**: Using `vi.mock` after static imports is too late. The real module is already in use.
- **ESM/CJS boundaries**: Node.js module resolution can cause different copies of a module to be loaded, especially with ESM and dynamic imports.

## The Solution: `vi.doMock` and Dynamic Imports

To guarantee your mock is used everywhere (including in your app code):

1. **Remove all static imports of `jose` in your test file.**
2. **Use `vi.doMock` to mock `jose` before any code imports it.**
3. **Dynamically import `jose`, your server, and any other modules that depend on `jose` after the mock is set up.**

### Example Pattern

```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

let publicKey;
let user1Token;
let admin1Token;
let prisma;
let dbContainer;
let server;

vi.doMock("jose", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    createRemoteJWKSet: vi.fn(() => async () => publicKey),
  });
});

describe("Integration Test", () => {
  beforeAll(async () => {
    // ...setup DB, set env, etc.
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    const jose = await import("jose");
    // Generate keypair, set publicKey, etc.
    // Set JWKS_URI to dummy value
    process.env.JWKS_URI = "http://localhost:12345/fake";
    const { createServer } = await import("../../server.js");
    server = createServer().listen(9010);
    // ...rest of setup
  });
  // ...tests
});
```

## Why This Works

- **`vi.doMock`** ensures the mock is registered before any code loads `jose`.
- **Dynamic imports** (`await import(...)`) ensure that when your app code imports `jose`, it gets the mocked version.
- **No static imports** means no risk of the real module being loaded before the mock.
- **Your JWT verification always uses your test key, and tests pass reliably.**

## Key Takeaways

- Always mock before importing code that uses the module.
- Use dynamic imports after mocking to guarantee the mock is used everywhere.
- This pattern is essential for reliable JWT mocking in Node.js/ESM test environments.

---

**This approach ensures your integration tests are isolated, reliable, and do not depend on real JWKS endpoints or production keys.**
