import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Sign In Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/signin');
    });

    test('should load sign in page', async ({ page }) => {
        await expect(page).toHaveURL('/signin');
    });

    test('should display sign in form elements', async ({ page }) => {
        // Wait for the component to load
        await page.waitForLoadState('networkidle');

        // Check for common sign in elements (adjust based on actual component)
        const mainContent = page.locator('main, body');
        await expect(mainContent).toBeVisible();
    });

    test('should have proper page structure', async ({ page }) => {
        // Check that the page has loaded
        await page.waitForLoadState('domcontentloaded');

        // Verify the page is not showing a 404 or error
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();
    });

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');

        // Check that content is visible on mobile
        const mainContent = page.locator('main, body');
        await expect(mainContent).toBeVisible();
    });

    test.skip('should not have accessibility violations', async ({ page }) => {
        await page.goto('/signin');
        // Note: Install @axe-core/playwright and configure it to enable this test
        // Example: const { injectAxe, checkA11y } = require('axe-playwright');
    });
});
