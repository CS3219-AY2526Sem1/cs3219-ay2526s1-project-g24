import { createServer, startServer } from './server.js';
import { connectDatabase, disconnectDatabase } from './utils/prisma.js';
import { connectRedis, disconnectRedis, getRedisPubClient, getRedisSubClient } from './utils/redis.js';
import { WebSocketHandler } from './websocket/handler.js';
import { YjsService } from './services/yjs.service.js';
import { SnapshotService } from './services/snapshot.service.js';
import { config } from './config/index.js';

async function main() {
    try {
        // Connect to database
        await connectDatabase();

        // Connect to Redis
        await connectRedis();

        // Warm up Redis pub/sub clients for YjsService
        try {
            await Promise.all([getRedisPubClient(), getRedisSubClient()]);
            console.log('Redis pub/sub clients ready');
        } catch (err) {
            console.warn('Redis pub/sub initialization failed:', err);
        }

        // Create and start server
        const { app, wss } = createServer();
        const server = startServer(app, wss);

        // Initialize WebSocket handler
        const wsHandler = new WebSocketHandler(wss);
        const heartbeatInterval = wsHandler.startHeartbeat(config.wsHeartbeatIntervalMs);

        // Start Yjs garbage collection
        YjsService.startGarbageCollection();

        // Start periodic snapshot saves to PostgreSQL
        SnapshotService.startPeriodicSnapshots();

        // Graceful shutdown
        let isShuttingDown = false;
        const gracefulShutdown = async (signal: string) => {
            if (isShuttingDown) {
                console.log(`${signal} received, but shutdown already in progress...`);
                return;
            }
            isShuttingDown = true;

            console.log(`\n${signal} received. Starting graceful shutdown...`);

            // Stop heartbeat
            wsHandler.stopHeartbeat(heartbeatInterval);

            // Stop garbage collection
            YjsService.stopGarbageCollection();

            // Stop periodic snapshots
            SnapshotService.stopPeriodicSnapshots();

            // Close all WebSocket connections
            await wsHandler.closeAll();

            // Close WebSocket server
            wss.close(() => {
                console.log('✓ WebSocket server closed');
            });

            // Close HTTP server
            server.close(async () => {
                console.log('HTTP server closed');

                // Clean up all Y.Docs
                YjsService.clearAll();

                // Disconnect from services
                await disconnectRedis();
                await disconnectDatabase();

                console.log('Graceful shutdown complete');
                process.exit(0);
            });

            // Force exit after 10 seconds
            setTimeout(() => {
                console.error('❌ Forceful shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();
