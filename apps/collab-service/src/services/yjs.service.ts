import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { config } from '../config/index.js';
import { YjsDocument } from '../types/index.js';
import { getRedisClient, getRedisPubClient, getRedisSubClient } from '../utils/redis.js';
import { randomUUID } from 'crypto';
import { ErrorHandler } from '../utils/errors.js';

// Unique server instance ID to prevent applying our own pub/sub messages
const SERVER_ID = process.env.INSTANCE_ID || randomUUID();

/**
 * YjsService manages Y.Doc instances for collaborative editing
 * 
 * Key responsibilities:
 * - Maintain in-memory cache of Y.Doc instances per session
 * - Initialize documents from snapshots
 * - Track connected clients and last activity
 * - Garbage collect inactive documents
 * - Sync state across server instances via Redis pub/sub
 */
export class YjsService {
    // Cache of active documents: sessionId -> YjsDocument
    private static documents = new Map<string, YjsDocument>();

    // Garbage collection interval
    private static gcInterval: NodeJS.Timeout | null = null;
    private static readonly GC_INTERVAL_MS = 60000; // 1 minute
    private static readonly INACTIVE_TIMEOUT_MS = 300000; // 5 minutes

    // Redis integration
    private static readonly REDIS_STATE_KEY_PREFIX = 'session:';
    private static readonly REDIS_CHANNEL_SUFFIX = ':updates';
    private static redisSubscribed = new Set<string>();
    private static updateHandlers = new Map<string, (update: Uint8Array, origin: any) => void>();

    /**
     * Get or create a Y.Doc for a session
     */
    static getDocument(sessionId: string, initialState?: Uint8Array): YjsDocument {
        try {
            let yjsDoc = this.documents.get(sessionId);

            if (!yjsDoc) {
                console.log(`📄 Creating new Y.Doc for session ${sessionId}`);

                const doc = new Y.Doc();
                const awareness = new Awareness(doc);

                // Apply initial state if provided (from snapshot)
                if (initialState && initialState.length > 0) {
                    try {
                        Y.applyUpdate(doc, initialState);
                        console.log(`✓ Applied initial state to Y.Doc (${initialState.length} bytes)`);
                    } catch (error) {
                        ErrorHandler.logError(error, 'Failed to apply initial state', { sessionId });
                        // Continue anyway - document will start empty
                    }
                }

                // Create the document structure
                // Initialize the Y.Doc for this session
                doc.getText('code');
                const metadata = doc.getMap('metadata');

                // Set default metadata if empty
                if (metadata.size === 0) {
                    metadata.set('language', 'python');
                    metadata.set('createdAt', Date.now());
                }

                yjsDoc = {
                    doc,
                    awareness,
                    lastActivity: Date.now(),
                    connectedClients: new Set<string>(),
                };

                this.documents.set(sessionId, yjsDoc);

                // Setup Redis integration asynchronously (non-blocking)
                void this.setupRedisIntegration(sessionId, doc).catch(err => {
                    ErrorHandler.logError(err, `Failed to setup Redis integration`, { sessionId });
                    // Continue without Redis - local-only mode
                });
            }

            return yjsDoc;
        } catch (error) {
            ErrorHandler.logError(error, 'Error creating Y.Doc', { sessionId });
            throw ErrorHandler.handleDocumentError(error, sessionId);
        }
    }

    /**
     * Setup Redis pub/sub and state caching for a session
     * Enables cross-server collaboration and state persistence
     */
    private static async setupRedisIntegration(sessionId: string, doc: Y.Doc): Promise<void> {
        try {
            const stateKey = `${this.REDIS_STATE_KEY_PREFIX}${sessionId}:state`;
            const channel = `${this.REDIS_STATE_KEY_PREFIX}${sessionId}${this.REDIS_CHANNEL_SUFFIX}`;

            // Step 1: Try to load latest state from Redis cache
            let stateLoaded = false;
            try {
                const redis = getRedisClient();
                const cachedState = await redis.get(stateKey);
                if (cachedState) {
                    const stateBuffer = Buffer.from(cachedState, 'base64');
                    Y.applyUpdate(doc, new Uint8Array(stateBuffer), 'redis-init');
                    console.log(`[Redis] ✓ Restored state for ${sessionId} (${stateBuffer.length} bytes)`);
                    stateLoaded = true;
                }
            } catch (err) {
                ErrorHandler.logError(err, 'Redis cache load failed', { sessionId, operation: 'load state' });
                // Non-fatal - continue to PostgreSQL fallback
            }

            // Step 1b: If Redis cache miss, try PostgreSQL snapshot
            if (!stateLoaded) {
                try {
                    const { SnapshotService } = await import('./snapshot.service.js');
                    const snapshot = await SnapshotService.loadLatestSnapshot(sessionId);
                    if (snapshot && snapshot.length > 0) {
                        Y.applyUpdate(doc, snapshot, 'postgres-init');
                        console.log(`[PostgreSQL] ✓ Restored state from snapshot for ${sessionId} (${snapshot.length} bytes)`);

                        // Warm up Redis cache with the PostgreSQL snapshot
                        try {
                            const redis = getRedisClient();
                            await redis.set(stateKey, Buffer.from(snapshot).toString('base64'), {
                                EX: 7200, // 2 hour TTL
                            });
                            console.log(`[Redis] ✓ Warmed cache from PostgreSQL snapshot`);
                        } catch (cacheErr) {
                            ErrorHandler.logError(cacheErr, 'Failed to warm Redis cache', { sessionId });
                            // Non-fatal
                        }
                    }
                } catch (err) {
                    ErrorHandler.logError(err, 'PostgreSQL snapshot load failed', { sessionId });
                    // Non-fatal - document will start empty
                }
            }

            // Step 2: Subscribe to Redis pub/sub channel for cross-server updates
            if (!this.redisSubscribed.has(sessionId)) {
                try {
                    const sub = await getRedisSubClient();

                    await sub.subscribe(channel, (message: string) => {
                        try {
                            const payload = JSON.parse(message);

                            // Ignore our own messages to prevent echo
                            if (payload.serverId === SERVER_ID) return;

                            if (payload.update) {
                                const updateBuffer = Buffer.from(payload.update, 'base64');
                                Y.applyUpdate(doc, new Uint8Array(updateBuffer), 'redis-pubsub');
                                this.updateActivity(sessionId);
                                console.log(`[Redis] ↔ Received update for ${sessionId} from server ${payload.serverId} (${updateBuffer.length} bytes)`);
                            }
                        } catch (err) {
                            ErrorHandler.logError(err, 'Failed to process pub/sub message', { sessionId, channel });
                        }
                    });

                    this.redisSubscribed.add(sessionId);
                    console.log(`[Redis] ✓ Subscribed to ${channel}`);
                } catch (err) {
                    ErrorHandler.logError(err, 'Failed to subscribe to Redis channel', { sessionId, channel });
                    throw ErrorHandler.handleRedisError(err, `Subscribe to ${channel}`);
                }
            }

            // Step 3: Register Y.Doc update handler to publish changes to Redis
            const updateHandler = (update: Uint8Array, origin: any) => {
                // Don't publish updates that came from Redis to avoid infinite loop
                if (origin === 'redis-init' || origin === 'redis-pubsub') return;

                // Publish update asynchronously (fire and forget)
                (async () => {
                    try {
                        const pub = await getRedisPubClient();
                        const redis = getRedisClient();

                        // Publish incremental update to channel
                        const message = JSON.stringify({
                            serverId: SERVER_ID,
                            update: Buffer.from(update).toString('base64'),
                            timestamp: Date.now(),
                        });
                        await pub.publish(channel, message);

                        // Update full state cache in Redis
                        const fullState = Y.encodeStateAsUpdate(doc);
                        await redis.set(stateKey, Buffer.from(fullState).toString('base64'), {
                            EX: 7200, // 2 hour TTL
                        });

                        console.log(`[Redis] → Published update for ${sessionId} (${update.length} bytes)`);
                    } catch (err) {
                        ErrorHandler.logError(err, 'Failed to publish update to Redis', { sessionId });
                        // Non-fatal - local edits still work
                    }
                })();
            };

            this.updateHandlers.set(sessionId, updateHandler);
            doc.on('update', updateHandler);
            console.log(`[Redis] ✓ Setup complete for ${sessionId}`);

        } catch (error) {
            ErrorHandler.logError(error, 'Redis integration setup failed', { sessionId });
            // Non-fatal - document works in local-only mode
        }
    }

    /**
     * Teardown Redis subscriptions and handlers for a session
     */
    private static async teardownRedisIntegration(sessionId: string): Promise<void> {
        try {
            const channel = `${this.REDIS_STATE_KEY_PREFIX}${sessionId}${this.REDIS_CHANNEL_SUFFIX}`;

            // Unsubscribe from Redis channel
            if (this.redisSubscribed.has(sessionId)) {
                try {
                    const sub = await getRedisSubClient();
                    await sub.unsubscribe(channel);
                    this.redisSubscribed.delete(sessionId);
                    console.log(`[Redis] ✓ Unsubscribed from ${channel}`);
                } catch (err) {
                    ErrorHandler.logError(err, 'Failed to unsubscribe from Redis', { sessionId, channel });
                }
            }

            // Remove Y.Doc update handler
            const handler = this.updateHandlers.get(sessionId);
            const yjsDoc = this.documents.get(sessionId);
            if (handler && yjsDoc) {
                yjsDoc.doc.off('update', handler);
                this.updateHandlers.delete(sessionId);
            }

            // Clear Redis cache
            await this.clearRedisCache(sessionId);

        } catch (error) {
            ErrorHandler.logError(error, 'Redis teardown failed', { sessionId });
        }
    }

    /**
     * Check if a document exists in cache
     */
    static hasDocument(sessionId: string): boolean {
        return this.documents.has(sessionId);
    }

    /**
     * Get the Y.Doc instance (without creating)
     */
    static getDocumentIfExists(sessionId: string): YjsDocument | undefined {
        return this.documents.get(sessionId);
    }

    /**
     * Update last activity timestamp for a document
     */
    static updateActivity(sessionId: string): void {
        const yjsDoc = this.documents.get(sessionId);
        if (yjsDoc) {
            yjsDoc.lastActivity = Date.now();
        }
    }

    /**
     * Add a client to the document's connected clients set
     */
    static addClient(sessionId: string, userId: string): void {
        const yjsDoc = this.documents.get(sessionId);
        if (yjsDoc) {
            yjsDoc.connectedClients.add(userId);
            console.log(`👤 Client ${userId} joined session ${sessionId} (${yjsDoc.connectedClients.size} total)`);
        }
    }

    /**
     * Remove a client from the document's connected clients set
     */
    static removeClient(sessionId: string, userId: string): void {
        const yjsDoc = this.documents.get(sessionId);
        if (yjsDoc) {
            yjsDoc.connectedClients.delete(userId);
            console.log(`👤 Client ${userId} left session ${sessionId} (${yjsDoc.connectedClients.size} remaining)`);

            // If no clients connected, update last activity for potential cleanup
            if (yjsDoc.connectedClients.size === 0) {
                this.updateActivity(sessionId);
            }
        }
    }

    /**
     * Get the number of connected clients for a session
     */
    static getClientCount(sessionId: string): number {
        const yjsDoc = this.documents.get(sessionId);
        return yjsDoc ? yjsDoc.connectedClients.size : 0;
    }

    /**
     * Get the current state of a document as Uint8Array
     */
    static getState(sessionId: string): Uint8Array | null {
        const yjsDoc = this.documents.get(sessionId);
        if (!yjsDoc) return null;

        return Y.encodeStateAsUpdate(yjsDoc.doc);
    }

    /**
     * Get the code content from a document
     */
    static getCode(sessionId: string): string {
        const yjsDoc = this.documents.get(sessionId);
        if (!yjsDoc) return '';

        const text = yjsDoc.doc.getText('code');
        return text.toString();
    }

    /**
     * Get metadata from a document
     */
    static getMetadata(sessionId: string): Record<string, any> {
        const yjsDoc = this.documents.get(sessionId);
        if (!yjsDoc) return {};

        const metadata = yjsDoc.doc.getMap('metadata');
        return metadata.toJSON();
    }

    /**
     * Delete a document from cache and Redis
     */
    static async deleteDocument(sessionId: string): Promise<void> {
        const yjsDoc = this.documents.get(sessionId);
        if (yjsDoc) {
            // Clean up awareness
            yjsDoc.awareness.destroy();

            // Destroy the document
            yjsDoc.doc.destroy();

            // Teardown Redis integration asynchronously
            await this.teardownRedisIntegration(sessionId);

            this.documents.delete(sessionId);
            console.log(`🗑️  Deleted Y.Doc for session ${sessionId}`);
        } else {
            // Even if not in memory, still clear Redis cache
            await this.clearRedisCache(sessionId);
        }
    }

    /**
     * Clear Redis cache for a session
     */
    private static async clearRedisCache(sessionId: string): Promise<void> {
        try {
            const redis = getRedisClient();
            const stateKey = `${this.REDIS_STATE_KEY_PREFIX}${sessionId}:state`;

            const deleted = await redis.del(stateKey);
            if (deleted > 0) {
                console.log(`[Redis] ✓ Cleared cache for session ${sessionId}`);
            }
        } catch (error) {
            ErrorHandler.logError(error, 'Failed to clear Redis cache', { sessionId });
            // Non-fatal - continue
        }
    }

    /**
     * Get statistics about cached documents
     */
    static getStats(): {
        totalDocuments: number;
        totalClients: number;
        documents: Array<{
            sessionId: string;
            clients: number;
            lastActivity: number;
            inactiveMs: number;
        }>;
    } {
        const now = Date.now();
        const documents: Array<{
            sessionId: string;
            clients: number;
            lastActivity: number;
            inactiveMs: number;
        }> = [];

        let totalClients = 0;

        for (const [sessionId, yjsDoc] of this.documents.entries()) {
            const clients = yjsDoc.connectedClients.size;
            totalClients += clients;

            documents.push({
                sessionId,
                clients,
                lastActivity: yjsDoc.lastActivity,
                inactiveMs: now - yjsDoc.lastActivity,
            });
        }

        return {
            totalDocuments: this.documents.size,
            totalClients,
            documents,
        };
    }

    /**
     * Start garbage collection
     * Removes documents that have been inactive and have no connected clients
     */
    static startGarbageCollection(): void {
        if (this.gcInterval) {
            console.log('⚠️  Garbage collection already running');
            return;
        }

        console.log(`🗑️  Starting Y.Doc garbage collection (check every ${this.GC_INTERVAL_MS / 1000}s)`);

        this.gcInterval = setInterval(() => {
            this.collectGarbage();
        }, this.GC_INTERVAL_MS);
    }

    /**
     * Stop garbage collection
     */
    static stopGarbageCollection(): void {
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
            console.log('✓ Stopped Y.Doc garbage collection');
        }
    }

    /**
     * Run garbage collection manually
     */
    static collectGarbage(): void {
        const now = Date.now();
        const toDelete: string[] = [];

        for (const [sessionId, yjsDoc] of this.documents.entries()) {
            const inactiveMs = now - yjsDoc.lastActivity;
            const hasClients = yjsDoc.connectedClients.size > 0;

            // Only delete if:
            // 1. No clients connected AND
            // 2. Inactive for longer than threshold
            if (!hasClients && inactiveMs > this.INACTIVE_TIMEOUT_MS) {
                toDelete.push(sessionId);
            }
        }

        if (toDelete.length > 0) {
            console.log(`🗑️  Garbage collecting ${toDelete.length} inactive document(s)`);
            for (const sessionId of toDelete) {
                this.deleteDocument(sessionId);
            }
        }
    }

    /**
     * Clear all documents (useful for testing or shutdown)
     */
    static clearAll(): void {
        console.log(`🗑️  Clearing all Y.Docs (${this.documents.size} documents)`);

        for (const [sessionId] of this.documents.entries()) {
            this.deleteDocument(sessionId);
        }

        this.documents.clear();
    }

    /**
     * Validate document size doesn't exceed limit
     */
    static validateSize(sessionId: string): boolean {
        try {
            const state = this.getState(sessionId);
            if (!state) return true;

            const sizeBytes = state.length;
            const maxBytes = config.maxDocumentSizeBytes;

            if (sizeBytes > maxBytes) {
                ErrorHandler.logError(
                    new Error('Document size limit exceeded'),
                    'Document size validation failed',
                    { sessionId, sizeBytes, maxBytes }
                );
                return false;
            }

            return true;
        } catch (error) {
            ErrorHandler.logError(error, 'Document size validation error', { sessionId });
            return false;
        }
    }
}
