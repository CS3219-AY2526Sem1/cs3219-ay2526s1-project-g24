import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { config } from '../config';
import { YjsDocument } from '../types';

/**
 * YjsService manages Y.Doc instances for collaborative editing
 * 
 * Key responsibilities:
 * - Maintain in-memory cache of Y.Doc instances per session
 * - Initialize documents from snapshots
 * - Track connected clients and last activity
 * - Garbage collect inactive documents
 */
export class YjsService {
    // Cache of active documents: sessionId -> YjsDocument
    private static documents = new Map<string, YjsDocument>();

    // Garbage collection interval
    private static gcInterval: NodeJS.Timeout | null = null;
    private static readonly GC_INTERVAL_MS = 60000; // 1 minute
    private static readonly INACTIVE_TIMEOUT_MS = 300000; // 5 minutes

    /**
     * Get or create a Y.Doc for a session
     */
    static getDocument(sessionId: string, initialState?: Uint8Array): YjsDocument {
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
                    console.error('Failed to apply initial state:', error);
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
        }

        return yjsDoc;
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
     * Delete a document from cache
     */
    static deleteDocument(sessionId: string): void {
        const yjsDoc = this.documents.get(sessionId);
        if (yjsDoc) {
            // Clean up awareness
            yjsDoc.awareness.destroy();

            // Destroy the document
            yjsDoc.doc.destroy();

            this.documents.delete(sessionId);
            console.log(`🗑️  Deleted Y.Doc for session ${sessionId}`);
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
        const state = this.getState(sessionId);
        if (!state) return true;

        const sizeBytes = state.length;
        const maxBytes = config.maxDocumentSizeBytes;

        if (sizeBytes > maxBytes) {
            console.warn(`⚠️  Document ${sessionId} exceeds size limit: ${sizeBytes} > ${maxBytes} bytes`);
            return false;
        }

        return true;
    }
}
