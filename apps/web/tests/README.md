# Playwright E2E Testing

This directory contains end-to-end tests for the PeerPrep web application using Playwright.

## Test Structure

```
tests/e2e/
├── fixtures.ts          # Custom test fixtures and helpers
├── landing.spec.ts      # Landing page tests
├── signin.spec.ts       # Sign-in page tests
├── navigation.spec.ts   # Navigation flow tests
├── performance.spec.ts  # Performance and load tests
├── responsive.spec.ts   # Responsive design tests
├── seo.spec.ts         # SEO and accessibility tests
└── visual.spec.ts      # Visual regression tests
```

## Running Tests

### Run all tests
```bash
pnpm test:e2e
```

### Run tests in UI mode (interactive)
```bash
pnpm test:e2e:ui
```

### Run tests in headed mode (visible browser)
```bash
pnpm test:e2e:headed
```

### Run tests in debug mode
```bash
pnpm test:e2e:debug
```

### Run tests on specific browsers
```bash
# Chromium only
pnpm test:e2e:chromium

# Firefox only
pnpm test:e2e:firefox

# WebKit (Safari) only
pnpm test:e2e:webkit

# Mobile browsers only
pnpm test:e2e:mobile
```

### View test report
```bash
pnpm test:e2e:report
```

### Generate test code (record your actions)
```bash
pnpm test:e2e:codegen
```

## Test Coverage

The test suite covers:

### Functional Testing
- ✅ Landing page rendering and content
- ✅ Sign-in page functionality
- ✅ Navigation between pages
- ✅ Button clicks and interactions
- ✅ Form validations

### Accessibility Testing
- ✅ WCAG compliance using axe-core
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Color contrast
- ✅ Alt text for images

### Performance Testing
- ✅ Page load times
- ✅ Resource loading
- ✅ Network requests
- ✅ JavaScript errors

### Responsive Design
- ✅ Mobile viewports (320px - 414px)
- ✅ Tablet viewports (768px - 1024px)
- ✅ Desktop viewports (1024px - 1920px)
- ✅ Orientation changes

### Visual Regression
- ✅ Screenshot comparison
- ✅ Component-level snapshots
- ✅ Full-page snapshots

### SEO
- ✅ Meta tags
- ✅ Heading hierarchy
- ✅ Semantic HTML
- ✅ Link text

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test code here
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Using Custom Fixtures

```typescript
import { test, expect } from './fixtures';

test('authenticated test', async ({ authenticatedPage }) => {
  // Use authenticatedPage instead of page
  await authenticatedPage.goto('/home');
  await expect(authenticatedPage.locator('h1')).toContainText('Welcome');
});
```

### Mocking API Responses

```typescript
import { mockApiResponse } from './fixtures';

test('should handle API data', async ({ page }) => {
  await mockApiResponse(page, '**/api/questions', {
    questions: [{ id: 1, title: 'Test Question' }]
  });
  
  await page.goto('/questions');
  // Test with mocked data
});
```

## Best Practices

1. **Use descriptive test names**: Test names should clearly describe what they're testing
2. **Keep tests independent**: Each test should be able to run in isolation
3. **Use Page Object Model**: Extract common selectors and actions into reusable functions
4. **Wait for elements properly**: Use `waitForSelector` or `waitForLoadState` when needed
5. **Use data-testid attributes**: Add `data-testid` to elements for stable selectors
6. **Test user journeys**: Focus on critical user paths
7. **Don't test implementation details**: Test behavior, not internal structure

## Debugging Tests

### Visual debugging
```bash
pnpm test:e2e:debug
```

### Screenshots on failure
Screenshots are automatically captured on test failures in the `test-results` directory.

### Traces
Traces are captured on first retry. View them with:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## CI/CD Integration

Tests are configured to run in CI with:
- Automatic retries (2 retries in CI)
- HTML, JSON, and JUnit reports
- Screenshots and videos on failure
- Optimized for CI performance

## Configuration

See `playwright.config.ts` for detailed configuration including:
- Test directory
- Browsers to test
- Base URL
- Timeouts
- Reporters
- Web server settings

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)
