// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated Redis client management for Collaboration Service:
//   - Redis client creation and connection with error/connect/ready event handling
//   - Main Redis client getter and connector functions
//   - Separate Redis Pub/Sub clients for publishing and subscribing
//   - Connection pooling with singleton pattern
//   - Graceful disconnect for all clients (main, pub, sub)
//   - Health check utility (isRedisHealthy with PING)
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added comprehensive logging for connection lifecycle
//   - Enhanced error handling for Redis operations

import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

let redisClient: RedisClientType | null = null;
let redisPubClient: RedisClientType | null = null;
let redisSubClient: RedisClientType | null = null;

/**
 * Create and connect a Redis client
 */
async function createRedisClient(name: string): Promise<RedisClientType> {
    const client = createClient({
        socket: {
            host: config.redis.host,
            port: config.redis.port,
        },
        password: config.redis.password,
    }) as RedisClientType;

    client.on('error', (err) => console.error(`Redis ${name} Client Error:`, err));
    client.on('connect', () => console.log(`✓ Redis ${name} client connecting`));
    client.on('ready', () => console.log(`✓ Redis ${name} client ready`));

    await client.connect();
    return client;
}

/**
 * Get or create the main Redis client
 */
export async function connectRedis(): Promise<RedisClientType> {
    if (!redisClient) {
        redisClient = await createRedisClient('main');
    }
    return redisClient;
}

/**
 * Get the Redis client (must be connected first)
 */
export function getRedisClient(): RedisClientType {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call connectRedis() first.');
    }
    return redisClient;
}

/**
 * Get or create the Redis Pub client for publishing
 */
export async function getRedisPubClient(): Promise<RedisClientType> {
    if (!redisPubClient) {
        redisPubClient = await createRedisClient('publisher');
    }
    return redisPubClient;
}

/**
 * Get or create the Redis Sub client for subscribing
 */
export async function getRedisSubClient(): Promise<RedisClientType> {
    if (!redisSubClient) {
        redisSubClient = await createRedisClient('subscriber');
    }
    return redisSubClient;
}

/**
 * Disconnect all Redis clients
 */
export async function disconnectRedis(): Promise<void> {
    const clients = [
        { name: 'main', client: redisClient },
        { name: 'pub', client: redisPubClient },
        { name: 'sub', client: redisSubClient },
    ];

    for (const { name, client } of clients) {
        if (client && client.isOpen) {
            try {
                await client.quit();
                console.log(`Redis ${name} client disconnected`);
            } catch (error) {
                console.warn(`Error disconnecting Redis ${name} client:`, error);
            }
        }
    }

    redisClient = null;
    redisPubClient = null;
    redisSubClient = null;
}

/**
 * Check if Redis is healthy
 */
export async function isRedisHealthy(): Promise<boolean> {
    try {
        if (!redisClient) return false;
        const pong = await redisClient.ping();
        return pong === 'PONG';
    } catch {
        return false;
    }
}
