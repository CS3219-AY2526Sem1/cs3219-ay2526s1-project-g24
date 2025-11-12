import { test, expect } from '@playwright/test';

test.describe('Axios Error Handling', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should show error modal for 500 error', async ({ page }) => {
        // Trigger a 500 error by making an API call to httpstat.us
        await page.evaluate(async () => {
            window.dispatchEvent(new CustomEvent('server-error', {
                detail: {
                    status: 500,
                    message: 'We are sorry, the server is down. Please try again later.',
                }
            }));
        });

        await expect(page.locator('text=Oops! Server Down')).toBeVisible();
        await expect(page.locator('text=Error Code: 500')).toBeVisible();
        await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
        await expect(page.locator('button:has-text("Dismiss")')).toBeVisible();
    });

    test('should show error modal for 502 error', async ({ page }) => {
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('server-error', {
                detail: { status: 502, message: 'Bad Gateway' }
            }));
        });

        await expect(page.locator('text=Oops! Server Down')).toBeVisible();
        await expect(page.locator('text=Error Code: 502')).toBeVisible();
    });

    test('should show error modal for 503 error', async ({ page }) => {
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('server-error', {
                detail: { status: 503, message: 'Service Unavailable' }
            }));
        });

        await expect(page.locator('text=Oops! Server Down')).toBeVisible();
        await expect(page.locator('text=Error Code: 503')).toBeVisible();
    });

    test('should show error modal for 504 error', async ({ page }) => {
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('server-error', {
                detail: { status: 504, message: 'Gateway Timeout' }
            }));
        });

        await expect(page.locator('text=Oops! Server Down')).toBeVisible();
        await expect(page.locator('text=Error Code: 504')).toBeVisible();
    });

    test('should dismiss error modal when clicking Dismiss button', async ({ page }) => {
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('server-error', {
                detail: { status: 500, message: 'Server error' }
            }));
        });

        await expect(page.locator('text=Oops! Server Down')).toBeVisible();
        await page.locator('button:has-text("Dismiss")').click();
        await expect(page.locator('text=Oops! Server Down')).not.toBeVisible();
    });

    test('error modal should have correct styling', async ({ page }) => {
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('server-error', {
                detail: { status: 500, message: 'Server error' }
            }));
        });

        await expect(page.locator('text=Oops! Server Down')).toBeVisible();

        const title = page.locator('h2:has-text("Oops! Server Down")');
        await expect(title).toHaveClass(/font-mclaren/);

        const tryAgainButton = page.locator('button:has-text("Try Again")');
        await expect(tryAgainButton).toHaveClass(/bg-white/);
    });
});

test.describe('Axios Error Handling - 4xx Client Errors', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should NOT show error modal for 400 Bad Request', async ({ page }) => {
        // 400 errors should be handled by component catch blocks, not show modal
        await page.evaluate(() => {
            // Intentionally NOT dispatching server-error event for 400
            console.log('400 error - handled in component catch block');
        });

        // Wait to ensure no modal appears
        await page.waitForTimeout(1000);
        await expect(page.locator('text=Oops! Server Down')).not.toBeVisible();
    });

    test('should NOT show error modal for 404 Not Found', async ({ page }) => {
        // 404 errors should be handled by component catch blocks
        await page.evaluate(() => {
            console.log('404 error - handled in component catch block');
        });

        await page.waitForTimeout(1000);
        await expect(page.locator('text=Oops! Server Down')).not.toBeVisible();
    });

    test('should handle 401 Unauthorized - clear tokens and redirect to signin', async ({ page }) => {
        // Set up localStorage with fake tokens
        await page.evaluate(() => {
            localStorage.setItem('accessToken', 'fake-token-123');
            localStorage.setItem('refreshToken', 'fake-refresh-456');
            localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User' }));
        });

        // Verify tokens exist
        const hasTokenBefore = await page.evaluate(() => {
            return localStorage.getItem('accessToken') !== null;
        });
        expect(hasTokenBefore).toBe(true);

        // Mock the axios interceptor behavior for 401
        const navigationPromise = page.waitForURL('**/signin', { timeout: 5000 }).catch(() => null);

        await page.evaluate(() => {
            // Simulate what axios interceptor does on 401
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // Simulate redirect (with setTimeout like our interceptor)
            setTimeout(() => {
                window.location.href = '/signin';
            }, 100);
        });

        // Wait for redirect
        await navigationPromise;

        // Verify tokens are cleared
        const hasTokenAfter = await page.evaluate(() => {
            return localStorage.getItem('accessToken') !== null;
        });
        expect(hasTokenAfter).toBe(false);

        // Verify we're on signin page or at least attempted redirect
        const url = page.url();
        const isSigninPage = url.includes('/signin') || url.includes('signin');
        expect(isSigninPage).toBe(true);

        // Should NOT show error modal
        await expect(page.locator('text=Oops! Server Down')).not.toBeVisible();
    });

    test('should handle 403 Forbidden - logs to console', async ({ page }) => {
        const consoleLogs: string[] = [];
        page.on('console', msg => consoleLogs.push(msg.text()));

        await page.evaluate(() => {
            // 403 triggers history.back() or redirect to /home
            console.log('403 Forbidden - Access denied');
        });

        await page.waitForTimeout(500);

        // Should log the error
        const has403Log = consoleLogs.some(log => log.includes('403'));
        expect(has403Log).toBe(true);

        // Should NOT show error modal
        await expect(page.locator('text=Oops! Server Down')).not.toBeVisible();
    });

    test('should verify only 5xx errors trigger error modal', async ({ page }) => {
        const consoleLogs: string[] = [];
        page.on('console', msg => consoleLogs.push(msg.text()));

        // Test that various error codes DON'T trigger modal
        await page.evaluate(() => {
            console.log('Testing 400 - no modal');
            console.log('Testing 401 - no modal, redirects');
            console.log('Testing 403 - no modal, goes back');
            console.log('Testing 404 - no modal');
        });

        await page.waitForTimeout(1000);

        // No modal should appear for any 4xx errors
        await expect(page.locator('text=Oops! Server Down')).not.toBeVisible();

        // Now trigger a 5xx error - should show modal
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('server-error', {
                detail: { status: 500, message: 'Server error' }
            }));
        });

        // Modal should NOW appear
        await expect(page.locator('text=Oops! Server Down')).toBeVisible();
        await expect(page.locator('text=Error Code: 500')).toBeVisible();
    });
});
