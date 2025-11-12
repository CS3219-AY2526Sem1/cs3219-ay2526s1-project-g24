/**
 * API Error Testing Utility
 * 
 * This utility helps test all error scenarios with the axios client.
 * Use this in development to verify error handling works correctly.
 */

import { apiClient } from './axiosClient';

export interface ErrorTestResult {
    code: number;
    description: string;
    expectedBehavior: string;
    actualBehavior: string;
    success: boolean;
}

/**
 * Test error responses by making requests to mock endpoints
 * Note: These should be used with a mock server or in tests
 */
export class ErrorTester {
    private results: ErrorTestResult[] = [];

    /**
     * Test 400 Bad Request
     */
    async test400(): Promise<ErrorTestResult> {
        const result: ErrorTestResult = {
            code: 400,
            description: 'Bad Request',
            expectedBehavior: 'Log error to console, no redirect',
            actualBehavior: '',
            success: false,
        };

        try {
            await apiClient.get('/api/test-error/400');
        } catch (error: any) {
            result.actualBehavior = `Caught error: ${error.response?.status}`;
            result.success = error.response?.status === 400;
        }

        this.results.push(result);
        return result;
    }

    /**
     * Test 401 Unauthorized
     */
    async test401(): Promise<ErrorTestResult> {
        const result: ErrorTestResult = {
            code: 401,
            description: 'Unauthorized',
            expectedBehavior: 'Clear localStorage, redirect to /signin',
            actualBehavior: '',
            success: false,
        };

        const originalToken = localStorage.getItem('accessToken');
        localStorage.setItem('accessToken', 'test-token');

        try {
            await apiClient.get('/api/test-error/401');
        } catch (error: any) {
            const tokenCleared = !localStorage.getItem('accessToken');
            result.actualBehavior = tokenCleared
                ? 'Token cleared, would redirect to /signin'
                : 'Token NOT cleared';
            result.success = tokenCleared && error.response?.status === 401;
        }

        // Restore original token
        if (originalToken) {
            localStorage.setItem('accessToken', originalToken);
        }

        this.results.push(result);
        return result;
    }

    /**
     * Test 403 Forbidden
     */
    async test403(): Promise<ErrorTestResult> {
        const result: ErrorTestResult = {
            code: 403,
            description: 'Forbidden',
            expectedBehavior: 'Navigate back to previous page',
            actualBehavior: '',
            success: false,
        };

        try {
            await apiClient.get('/api/test-error/403');
        } catch (error: any) {
            result.actualBehavior = `Caught error: ${error.response?.status}, would navigate back`;
            result.success = error.response?.status === 403;
        }

        this.results.push(result);
        return result;
    }

    /**
     * Test 404 Not Found
     */
    async test404(): Promise<ErrorTestResult> {
        const result: ErrorTestResult = {
            code: 404,
            description: 'Not Found',
            expectedBehavior: 'Log error to console, no redirect',
            actualBehavior: '',
            success: false,
        };

        try {
            await apiClient.get('/api/test-error/404');
        } catch (error: any) {
            result.actualBehavior = `Caught error: ${error.response?.status}`;
            result.success = error.response?.status === 404;
        }

        this.results.push(result);
        return result;
    }

    /**
     * Test 500 Internal Server Error
     */
    async test500(): Promise<ErrorTestResult> {
        const result: ErrorTestResult = {
            code: 500,
            description: 'Internal Server Error',
            expectedBehavior: 'Show error modal with server down message',
            actualBehavior: '',
            success: false,
        };

        // Listen for the server-error event
        const eventPromise = new Promise<boolean>((resolve) => {
            const handler = (e: Event) => {
                const customEvent = e as CustomEvent;
                resolve(customEvent.detail.status === 500);
                window.removeEventListener('server-error', handler);
            };
            window.addEventListener('server-error', handler);

            // Timeout after 2 seconds
            setTimeout(() => {
                window.removeEventListener('server-error', handler);
                resolve(false);
            }, 2000);
        });

        try {
            await apiClient.get('/api/test-error/500');
        } catch (error: any) {
            const eventFired = await eventPromise;
            result.actualBehavior = eventFired
                ? 'Server error event fired, modal would appear'
                : 'Error caught but event not fired';
            result.success = error.response?.status === 500 && eventFired;
        }

        this.results.push(result);
        return result;
    }

    /**
     * Test 502 Bad Gateway
     */
    async test502(): Promise<ErrorTestResult> {
        const result: ErrorTestResult = {
            code: 502,
            description: 'Bad Gateway',
            expectedBehavior: 'Show error modal',
            actualBehavior: '',
            success: false,
        };

        try {
            await apiClient.get('/api/test-error/502');
        } catch (error: any) {
            result.actualBehavior = `Caught error: ${error.response?.status}, modal would appear`;
            result.success = error.response?.status === 502;
        }

        this.results.push(result);
        return result;
    }

    /**
     * Test 503 Service Unavailable
     */
    async test503(): Promise<ErrorTestResult> {
        const result: ErrorTestResult = {
            code: 503,
            description: 'Service Unavailable',
            expectedBehavior: 'Show error modal',
            actualBehavior: '',
            success: false,
        };

        try {
            await apiClient.get('/api/test-error/503');
        } catch (error: any) {
            result.actualBehavior = `Caught error: ${error.response?.status}, modal would appear`;
            result.success = error.response?.status === 503;
        }

        this.results.push(result);
        return result;
    }

    /**
     * Test 504 Gateway Timeout
     */
    async test504(): Promise<ErrorTestResult> {
        const result: ErrorTestResult = {
            code: 504,
            description: 'Gateway Timeout',
            expectedBehavior: 'Show error modal',
            actualBehavior: '',
            success: false,
        };

        try {
            await apiClient.get('/api/test-error/504');
        } catch (error: any) {
            result.actualBehavior = `Caught error: ${error.response?.status}, modal would appear`;
            result.success = error.response?.status === 504;
        }

        this.results.push(result);
        return result;
    }

    /**
     * Run all tests
     */
    async runAllTests(): Promise<ErrorTestResult[]> {
        this.results = [];

        await this.test400();
        await this.test401();
        await this.test403();
        await this.test404();
        await this.test500();
        await this.test502();
        await this.test503();
        await this.test504();

        return this.results;
    }

    /**
     * Get test results
     */
    getResults(): ErrorTestResult[] {
        return this.results;
    }

    /**
     * Print results to console
     */
    printResults(): void {
        console.group('🧪 Error Handling Test Results');
        this.results.forEach(result => {
            const icon = result.success ? '✅' : '❌';
            console.group(`${icon} ${result.code} - ${result.description}`);
            console.log('Expected:', result.expectedBehavior);
            console.log('Actual:', result.actualBehavior);
            console.log('Success:', result.success);
            console.groupEnd();
        });

        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        console.log(`\n📊 Summary: ${successCount}/${totalCount} tests passed`);
        console.groupEnd();
    }
}

// Export singleton instance
export const errorTester = new ErrorTester();

// Usage in browser console:
// import { errorTester } from '@/lib/api/errorTester';
// await errorTester.runAllTests();
// errorTester.printResults();
