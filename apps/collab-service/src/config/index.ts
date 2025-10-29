import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3003', 10),

    // Database
    databaseUrl: process.env.DATABASE_URL || '',

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    // External Services
    questionServiceUrl: process.env.QUESTION_SERVICE_URL || 'http://localhost:3001',
    userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:8000',

    // JWT Authentication
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production', // Deprecated - kept for backward compatibility
    jwtAlgorithm: (process.env.JWT_ALGORITHM || 'RS256') as 'RS256' | 'HS256',
    enableMockAuth: process.env.ENABLE_MOCK_AUTH === 'true', // Set to 'true' for local testing without user service

    // Session Configuration
    snapshotIntervalMs: parseInt(process.env.SNAPSHOT_INTERVAL_MS || '120000', 10), // 2 minutes
    sessionTimeoutMs: parseInt(process.env.SESSION_TIMEOUT_MS || '120000', 10), // 2 minutes
    maxDocumentSizeBytes: parseInt(process.env.MAX_DOCUMENT_SIZE_BYTES || '1048576', 10), // 1MB

    // WebSocket
    wsHeartbeatIntervalMs: parseInt(process.env.WS_HEARTBEAT_INTERVAL_MS || '30000', 10), // 30 seconds
} as const;

// Validate required config
const requiredEnvVars = ['DATABASE_URL'];

if (config.nodeEnv === 'production') {
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }

    // For production, require either mock auth to be disabled or User Service URL to be set
    if (!config.enableMockAuth && !process.env.USER_SERVICE_URL) {
        throw new Error('USER_SERVICE_URL is required when ENABLE_MOCK_AUTH is not true');
    }
}
