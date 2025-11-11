import { test, expect } from '@playwright/test';

const viewports = [
    { name: 'Mobile Small', width: 320, height: 568 },
    { name: 'Mobile Medium', width: 375, height: 667 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop Small', width: 1024, height: 768 },
    { name: 'Desktop Medium', width: 1440, height: 900 },
    { name: 'Desktop Large', width: 1920, height: 1080 },
];

test.describe('Responsive Design Tests', () => {
    for (const viewport of viewports) {
        test(`should display correctly on ${viewport.name}`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto('/landing');

            // Check that header is visible
            await expect(page.locator('h1')).toBeVisible();

            // Check that main content is visible
            const heroHeading = page.getByRole('heading', { name: /Master coding/i });
            await expect(heroHeading).toBeVisible();

            // Take screenshot for visual comparison
            await page.screenshot({
                path: `playwright-report/screenshots/${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
                fullPage: true
            });
        });
    }

    test('should handle orientation change', async ({ page }) => {
        // Portrait
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/landing');
        await expect(page.locator('h1')).toBeVisible();

        // Landscape
        await page.setViewportSize({ width: 667, height: 375 });
        await expect(page.locator('h1')).toBeVisible();
    });

    test('should adapt navigation for mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/landing');

        // Check that header buttons are visible/accessible
        const header = page.locator('header');
        await expect(header).toBeVisible();
    });
});
