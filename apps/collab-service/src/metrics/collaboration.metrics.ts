// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated Prometheus metrics for Collaboration Service:
//   - WebSocket connection metrics (wsConnectionsActive)
//   - Active collaboration session tracking (collaborationSessionsActive)
//   - Session operations counter with operation/status labels
//   - Document sync operations for Yjs (update, snapshot, restore)
//   - Yjs document cache size gauge
//   - Redis pub/sub message tracking with direction/channel labels
//   - Document state size histogram with buckets from 1KB to 10MB
//   - Snapshot operation duration histogram (save/restore)
//   - Redis operation duration metrics
//   - Client awareness updates counter (cursors, selections)
//   - Session participant count across all sessions
//   - Code execution request tracking with language/status labels
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added high cardinality prevention strategies
//   - Enhanced bucket configurations for better observability

import { register, Counter, Gauge, Histogram } from 'prom-client';

/**
 * Collaboration-specific metrics for real-time features
 */

// WebSocket connection tracking (aggregate across all sessions to avoid high cardinality)
export const wsConnectionsActive = new Gauge({
    name: 'collab_websocket_connections_active',
    help: 'Number of active WebSocket connections',
    registers: [register],
});

// Active collaboration sessions
export const collaborationSessionsActive = new Gauge({
    name: 'collab_sessions_active',
    help: 'Number of active collaboration sessions',
    registers: [register],
});

// Session operations
export const sessionOperations = new Counter({
    name: 'collab_session_operations_total',
    help: 'Total number of session operations',
    labelNames: ['operation', 'status'],
    registers: [register],
});

// Document sync operations (Y.js)
export const documentSyncOperations = new Counter({
    name: 'collab_document_sync_operations_total',
    help: 'Total number of document synchronization operations',
    labelNames: ['type'], // 'update', 'snapshot', 'restore'
    registers: [register],
});

// Y.js document cache size
export const yjsDocumentCache = new Gauge({
    name: 'collab_yjs_documents_cached',
    help: 'Number of Y.js documents currently in memory cache',
    registers: [register],
});

// Redis pub/sub messages
export const redisPubSubMessages = new Counter({
    name: 'collab_redis_pubsub_messages_total',
    help: 'Total number of Redis pub/sub messages sent/received',
    labelNames: ['direction', 'channel'], // direction: 'sent' or 'received'
    registers: [register],
});

// Document state size in bytes (aggregate to avoid high cardinality)
export const documentStateSize = new Histogram({
    name: 'collab_document_state_bytes',
    help: 'Size of Y.js document state in bytes',
    buckets: [1024, 10240, 102400, 1048576, 10485760], // 1KB to 10MB
    registers: [register],
});

// Snapshot operations duration
export const snapshotOperationDuration = new Histogram({
    name: 'collab_snapshot_operation_duration_seconds',
    help: 'Duration of snapshot save/restore operations',
    labelNames: ['operation', 'status'], // operation: 'save' or 'restore'
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [register],
});

// Redis operation duration
export const redisOperationDuration = new Histogram({
    name: 'collab_redis_operation_duration_seconds',
    help: 'Duration of Redis operations',
    labelNames: ['operation'], // 'get', 'set', 'publish', 'subscribe'
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    registers: [register],
});

// Client awareness updates (cursors, selections, etc.) - aggregate to avoid high cardinality
export const awarenessUpdates = new Counter({
    name: 'collab_awareness_updates_total',
    help: 'Total number of client awareness updates',
    registers: [register],
});

// Session participant count - total across all sessions to avoid high cardinality
export const sessionParticipantsTotal = new Gauge({
    name: 'collab_session_participants_total',
    help: 'Total number of participants across all active sessions',
    registers: [register],
});

// Code execution requests (if tracked by collab service)
export const codeExecutionRequests = new Counter({
    name: 'collab_code_execution_requests_total',
    help: 'Total number of code execution requests initiated from collaboration sessions',
    labelNames: ['language', 'status'],
    registers: [register],
});

/**
 * Helper functions to update metrics
 */
export class CollaborationMetrics {
    // WebSocket connection lifecycle
    static connectionOpened(): void {
        wsConnectionsActive.inc();
    }

    static connectionClosed(): void {
        wsConnectionsActive.dec();
    }

    // Session lifecycle
    static sessionCreated(): void {
        collaborationSessionsActive.inc();
        sessionOperations.inc({ operation: 'create', status: 'success' });
    }

    static sessionTerminated(): void {
        collaborationSessionsActive.dec();
        sessionOperations.inc({ operation: 'terminate', status: 'success' });
    }

    static sessionOperationFailed(operation: string): void {
        sessionOperations.inc({ operation, status: 'failure' });
    }

    // Document sync tracking
    static documentUpdated(): void {
        documentSyncOperations.inc({ type: 'update' });
    }

    static snapshotSaved(): void {
        documentSyncOperations.inc({ type: 'snapshot' });
    }

    static snapshotRestored(): void {
        documentSyncOperations.inc({ type: 'restore' });
    }

    // Y.js cache management
    static updateDocumentCacheSize(size: number): void {
        yjsDocumentCache.set(size);
    }

    // Redis pub/sub tracking
    static redisPubSubSent(channel: string): void {
        redisPubSubMessages.inc({ direction: 'sent', channel });
    }

    static redisPubSubReceived(channel: string): void {
        redisPubSubMessages.inc({ direction: 'received', channel });
    }

    // Document state size tracking
    static recordDocumentStateSize(sizeInBytes: number): void {
        documentStateSize.observe(sizeInBytes);
    }

    // Snapshot operation timing
    static recordSnapshotSave(durationSeconds: number, success: boolean): void {
        snapshotOperationDuration.observe(
            { operation: 'save', status: success ? 'success' : 'failure' },
            durationSeconds
        );
    }

    static recordSnapshotRestore(durationSeconds: number, success: boolean): void {
        snapshotOperationDuration.observe(
            { operation: 'restore', status: success ? 'success' : 'failure' },
            durationSeconds
        );
    }

    // Redis operation timing
    static recordRedisOperation(operation: string, durationSeconds: number): void {
        redisOperationDuration.observe({ operation }, durationSeconds);
    }

    // Awareness updates
    static awarenessUpdated(): void {
        awarenessUpdates.inc();
    }

    // Session participants tracking - set total count across all sessions
    static updateTotalParticipantCount(totalCount: number): void {
        sessionParticipantsTotal.set(totalCount);
    }

    // Code execution tracking
    static codeExecutionRequested(language: string, success: boolean): void {
        codeExecutionRequests.inc({
            language,
            status: success ? 'success' : 'failure'
        });
    }
}
