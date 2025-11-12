import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have correct title and header', async ({ page }) => {
        // Check that we're redirected to /landing
        await expect(page).toHaveURL('/landing');

        // Check header
        await expect(page.locator('h1')).toHaveText('PeerPrep');
    });

    test('should display main hero content', async ({ page }) => {
        // Check hero headings
        await expect(page.getByRole('heading', { name: /Master coding/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /interview with/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /peer-to-peer/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /collaboration/i })).toBeVisible();
    });

    test.skip('should display navigation buttons', async ({ page }) => {
        await page.goto('/landing');

        // Header buttons - use text selector since buttons are inside links
        await expect(page.locator('header button:has-text("Sign In")')).toBeVisible();
        await expect(page.locator('header button:has-text("Get Started")')).toBeVisible();
    });

    test.skip('should have working navigation links', async ({ page }) => {
        await page.goto('/landing');

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Click Get Started button
        await page.locator('header button:has-text("Get Started")').click();
        await expect(page).toHaveURL('/signin');
    });

    test('should display hero image', async ({ page }) => {
        const heroImage = page.getByAltText(/Bro swagger with laptop/i);
        await expect(heroImage).toBeVisible();
    });

    test('should display community section', async ({ page }) => {
        await expect(page.getByText('#JoinPeerPrep')).toBeVisible();
    });

    test('should display footer', async ({ page }) => {
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
        await expect(footer).toContainText('CS3219');
        await expect(footer).toContainText('National University of Singapore');
    });

    test('should display action buttons', async ({ page }) => {
        await page.goto('/landing');

        // Main action buttons - "Start practicing" is a button inside a link
        await expect(page.getByRole('button', { name: 'Start practicing' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Learn more' })).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        // Check that content is still visible
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Master coding/i })).toBeVisible();
    });

    test.skip('should not have accessibility violations', async ({ page }) => {
        await page.goto('/landing');
        // Note: Install @axe-core/playwright and configure it to enable this test
        // Example: const { injectAxe, checkA11y } = require('axe-playwright');
    }); test('should have proper meta tags', async ({ page }) => {
        // Check for viewport meta tag
        const viewport = page.locator('meta[name="viewport"]');
        await expect(viewport).toHaveCount(1);
    });
});
