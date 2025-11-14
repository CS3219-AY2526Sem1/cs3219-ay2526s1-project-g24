import { test, expect } from '@playwright/test';

test.describe('SEO and Meta Tags', () => {
    test('should have proper HTML structure', async ({ page }) => {
        await page.goto('/landing');

        // Check for html tag
        const html = page.locator('html');
        await expect(html).toHaveCount(1);

        // Check for head tag
        const head = page.locator('head');
        await expect(head).toHaveCount(1);

        // Check for body tag
        const body = page.locator('body');
        await expect(body).toHaveCount(1);
    });

    test('should have viewport meta tag', async ({ page }) => {
        await page.goto('/landing');

        const viewport = page.locator('meta[name="viewport"]');
        await expect(viewport).toHaveCount(1);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto('/landing');

        // Should have h1
        const h1 = page.locator('h1');
        await expect(h1).toHaveCount(1);

        // Should have h2s
        const h2s = page.locator('h2');
        const h2Count = await h2s.count();
        expect(h2Count).toBeGreaterThan(0);
    });

    test('should have alt text for images', async ({ page }) => {
        await page.goto('/landing');

        // Get all images
        const images = page.locator('img');
        const imageCount = await images.count();

        // Check each image has alt text
        for (let i = 0; i < imageCount; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            expect(alt).toBeTruthy();
        }
    });

    test('should have meaningful link text', async ({ page }) => {
        await page.goto('/landing');

        // Get all links
        const links = page.locator('a');
        const linkCount = await links.count();

        // Check that links are not empty
        for (let i = 0; i < linkCount; i++) {
            const link = links.nth(i);
            const text = await link.textContent();
            const ariaLabel = await link.getAttribute('aria-label');

            // Link should have either text content or aria-label
            expect(text || ariaLabel).toBeTruthy();
        }
    });
});
