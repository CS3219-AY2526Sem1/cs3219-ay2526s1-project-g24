/**
 * Collaboration service configuration
 */
export const COLLABORATION_CONFIG = {
    // WebSocket URL for collaboration service
    WS_URL: process.env.NEXT_PUBLIC_COLLAB_SERVICE_URL || 'ws://localhost:3003',
} as const;
