/**
 * Collaboration service configuration
 * TODO: Move these to environment variables for production
 */
export const COLLABORATION_CONFIG = {
    // WebSocket URL for collaboration service
    WS_URL: process.env.NEXT_PUBLIC_COLLAB_SERVICE_URL || 'ws://localhost:3003',

    // Hardcoded values for testing - REPLACE WITH ACTUAL AUTH IN PRODUCTION
    TEST_USER_ID: '123e4567-e89b-12d3-a456-426614174001',
    TEST_TOKEN: '123e4567-e89b-12d3-a456-426614174001',
} as const;
