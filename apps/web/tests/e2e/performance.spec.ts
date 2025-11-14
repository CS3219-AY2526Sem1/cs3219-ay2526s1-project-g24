import { test, expect, Page, Response, Request } from '@playwright/test';

test.describe('Performance Tests', () => {
    test('should load landing page within acceptable time', async ({ page }: { page: Page }) => {
        const startTime = Date.now();
        await page.goto('/landing');
        const loadTime = Date.now() - startTime;

        // Should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
    });

    test('should have reasonable page size', async ({ page }: { page: Page }) => {
        const response = await page.goto('/landing');
        const body = await response?.body();
        const sizeInKB = body ? body.length / 1024 : 0;

        // Page should be less than 5MB
        expect(sizeInKB).toBeLessThan(5120);
    });

    test('should load critical resources', async ({ page }: { page: Page }) => {
        const responses: string[] = [];

        page.on('response', (response: Response) => {
            responses.push(response.url());
        });

        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        // Check that some resources were loaded
        expect(responses.length).toBeGreaterThan(0);
    });

    test('should not have JavaScript errors', async ({ page }: { page: Page }) => {
        const errors: string[] = [];

        page.on('pageerror', (error: Error) => {
            errors.push(error.message);
        });

        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        // Should have no JavaScript errors
        expect(errors).toEqual([]);
    });

    test('should not have failed network requests', async ({ page }: { page: Page }) => {
        const failedRequests: string[] = [];

        page.on('requestfailed', (request: Request) => {
            // Ignore auth session checks - these may fail in test environments
            // where the auth service is not running
            if (!request.url().includes('/api/v1/auth/session')) {
                failedRequests.push(request.url());
            }
        });

        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        // Should have no failed requests (excluding auth session checks)
        expect(failedRequests).toEqual([]);
    });
});
