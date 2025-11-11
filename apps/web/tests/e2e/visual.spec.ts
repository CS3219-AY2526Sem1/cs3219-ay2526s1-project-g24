import { test, expect } from '@playwright/test';

// Skip visual tests by default - they need baseline snapshots first
// Run with: pnpm test:e2e --update-snapshots to generate baselines
test.describe.skip('Visual Regression Tests', () => {
    test('landing page should match baseline', async ({ page }) => {
        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        // Take full page screenshot
        await expect(page).toHaveScreenshot('landing-page.png', {
            fullPage: true,
            maxDiffPixels: 100,
        });
    });

    test('landing page header should match baseline', async ({ page }) => {
        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        const header = page.locator('header');
        await expect(header).toHaveScreenshot('header.png', {
            maxDiffPixels: 50,
        });
    });

    test('landing page footer should match baseline', async ({ page }) => {
        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        const footer = page.locator('footer');
        await expect(footer).toHaveScreenshot('footer.png', {
            maxDiffPixels: 50,
        });
    });

    test('sign in page should match baseline', async ({ page }) => {
        await page.goto('/signin');
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveScreenshot('signin-page.png', {
            fullPage: true,
            maxDiffPixels: 100,
        });
    });
});
