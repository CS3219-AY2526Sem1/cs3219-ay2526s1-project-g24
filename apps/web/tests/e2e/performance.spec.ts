import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
    test('should load landing page within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/landing');
        const loadTime = Date.now() - startTime;

        // Should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
    });

    test('should have reasonable page size', async ({ page }) => {
        const response = await page.goto('/landing');
        const body = await response?.body();
        const sizeInKB = body ? body.length / 1024 : 0;

        // Page should be less than 5MB
        expect(sizeInKB).toBeLessThan(5120);
    });

    test('should load critical resources', async ({ page }) => {
        const responses: string[] = [];

        page.on('response', response => {
            responses.push(response.url());
        });

        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        // Check that some resources were loaded
        expect(responses.length).toBeGreaterThan(0);
    });

    test('should not have JavaScript errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('pageerror', error => {
            errors.push(error.message);
        });

        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        // Should have no JavaScript errors
        expect(errors).toEqual([]);
    });

    test('should not have failed network requests', async ({ page }) => {
        const failedRequests: string[] = [];

        page.on('requestfailed', request => {
            failedRequests.push(request.url());
        });

        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        // Should have no failed requests
        expect(failedRequests).toEqual([]);
    });
});
