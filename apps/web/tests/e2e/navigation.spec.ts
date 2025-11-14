import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
    test('should navigate from landing to sign in', async ({ page }) => {
        await page.goto('/landing');

        // Click sign in button
        await page.locator('header button:has-text("Sign In")').first().click();

        // Should be on sign in page
        await expect(page).toHaveURL('/signin');
    });

    test('should redirect root to landing', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL('/landing');
    });

    test('should handle back navigation', async ({ page }) => {
        await page.goto('/landing');
        await page.locator('header button:has-text("Sign In")').first().click();
        await expect(page).toHaveURL('/signin');

        // Go back
        await page.goBack();
        await expect(page).toHaveURL('/landing');
    });

    test('should maintain state during navigation', async ({ page }) => {
        await page.goto('/landing');
        await page.waitForLoadState('networkidle');

        // Check header is visible
        await expect(page.locator('h1')).toHaveText('PeerPrep');

        // Navigate to sign in
        await page.locator('header button:has-text("Sign In")').first().click();
        await page.waitForURL('/signin');

        // Navigate back
        await page.goBack();
        await page.waitForURL('/landing');

        // Header should still be visible
        await expect(page.locator('h1')).toHaveText('PeerPrep');
    });
});
