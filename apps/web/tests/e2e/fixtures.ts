import { test as base, Page, Route } from '@playwright/test';

// Extend the base test with custom fixtures for authentication
type AuthFixtures = {
    authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
    // Mock authenticated context
    authenticatedPage: async ({ page, context }, use) => {
        // Set up mock authentication cookies/tokens
        await context.addCookies([
            {
                name: 'auth_token',
                value: 'mock_token_for_testing',
                domain: 'localhost',
                path: '/',
            },
        ]);

        // You can also set localStorage items if needed
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('user', JSON.stringify({
                id: 'test-user-id',
                display_name: 'Test User',
                email: 'test@example.com',
                avatar_url: '/bro_profile.png',
            }));
        });

        await use(page);
    },
});

export { expect } from '@playwright/test';

// Helper functions
export const mockApiResponse = async (page: Page, url: string, response: any) => {
    await page.route(url, (route: Route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response),
        });
    });
};

export const waitForPageLoad = async (page: Page) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
};
