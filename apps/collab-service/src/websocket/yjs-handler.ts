import { WebSocket } from 'ws';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import { YjsService } from '../services/yjs.service.js';
import { SessionService } from '../services/session.service.js';
import { AuthenticatedWebSocket } from '../types/index.js';

/**
 * Yjs Protocol Message Types
 */
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

/**
 * Handle Yjs protocol messages over WebSocket
 */
export class YjsWebSocketHandler {
    private sessionId: string;
    private userId: string;
    private ws: AuthenticatedWebSocket;

    constructor(sessionId: string, userId: string, ws: AuthenticatedWebSocket) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.ws = ws;
    }

    /**
     * Initialize WebSocket connection for Yjs
     */
    async initialize(): Promise<void> {
        try {
            // Get or create Y.Doc for this session
            const yjsDoc = YjsService.getDocument(this.sessionId);

            // Add this client to the session
            YjsService.addClient(this.sessionId, this.userId);

            // Set up Y.Doc update handler
            const updateHandler = (update: Uint8Array, origin: any) => {
                // Don't send updates that originated from this connection
                if (origin === this) return;

                // Encode and send update to client
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, MESSAGE_SYNC);
                syncProtocol.writeUpdate(encoder, update);
                this.send(encoding.toUint8Array(encoder));

                // Update activity timestamp
                YjsService.updateActivity(this.sessionId);
                SessionService.updateActivity(this.sessionId);
            };

            yjsDoc.doc.on('update', updateHandler);

            // Set up awareness update handler
            const awarenessUpdateHandler = (
                { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
                origin: any
            ) => {
                // Don't send awareness updates that originated from this connection
                if (origin === this) return;

                const changedClients = added.concat(updated).concat(removed);
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
                encoding.writeVarUint8Array(
                    encoder,
                    awarenessProtocol.encodeAwarenessUpdate(yjsDoc.awareness, changedClients)
                );
                this.send(encoding.toUint8Array(encoder));
            };

            yjsDoc.awareness.on('update', awarenessUpdateHandler);

            // Store handlers for cleanup
            (this.ws as any).__yjsUpdateHandler = updateHandler;
            (this.ws as any).__awarenessUpdateHandler = awarenessUpdateHandler;

            // Send initial sync message (state vector)
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, MESSAGE_SYNC);
            syncProtocol.writeSyncStep1(encoder, yjsDoc.doc);
            this.send(encoding.toUint8Array(encoder));

            console.log(`🔗 Yjs connection initialized for user ${this.userId} in session ${this.sessionId}`);
        } catch (error) {
            console.error('Failed to initialize Yjs connection:', error);
            throw error;
        }
    }

    /**
     * Handle incoming message from client
     */
    async handleMessage(message: Uint8Array): Promise<void> {
        try {
            const yjsDoc = YjsService.getDocumentIfExists(this.sessionId);
            if (!yjsDoc) {
                console.error(`Y.Doc not found for session ${this.sessionId}`);
                return;
            }

            // Debug: Log first few bytes
            console.log(`📨 Received message (${message.length} bytes):`,
                Array.from(message.slice(0, 20)).map(b => `${b}(0x${b.toString(16)})`).join(' '));

            const decoder = decoding.createDecoder(message);
            const messageType = decoding.readVarUint(decoder);

            switch (messageType) {
                case MESSAGE_SYNC:
                    await this.handleSyncMessage(decoder, yjsDoc);
                    break;

                case MESSAGE_AWARENESS:
                    this.handleAwarenessMessage(decoder, yjsDoc);
                    break;

                default:
                    console.warn(`Unknown message type: ${messageType} (0x${messageType.toString(16)})`);
                    console.warn(`First 20 bytes:`, Array.from(message.slice(0, 20)));
                    console.warn(`As string:`, new TextDecoder().decode(message.slice(0, Math.min(50, message.length))));
            }
        } catch (error) {
            console.error('Error handling Yjs message:', error);
        }
    }

    /**
     * Handle sync protocol messages (sync-step-1, sync-step-2, update)
     */
    private async handleSyncMessage(decoder: decoding.Decoder, yjsDoc: any): Promise<void> {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, yjsDoc.doc, this);

        // Send response if encoder has data (length > 1 means more than just message type)
        const response = encoding.toUint8Array(encoder);
        if (response.length > 1) {
            this.send(response);
        }

        // Update activity
        YjsService.updateActivity(this.sessionId);
        await SessionService.updateActivity(this.sessionId);
    }

    /**
     * Handle awareness protocol messages (cursor position, selection, etc.)
     */
    private handleAwarenessMessage(decoder: decoding.Decoder, yjsDoc: any): void {
        awarenessProtocol.applyAwarenessUpdate(
            yjsDoc.awareness,
            decoding.readVarUint8Array(decoder),
            this
        );
    }

    /**
     * Clean up on disconnect
     */
    async cleanup(): Promise<void> {
        try {
            const yjsDoc = YjsService.getDocumentIfExists(this.sessionId);
            if (!yjsDoc) return;

            // Remove event handlers
            const updateHandler = (this.ws as any).__yjsUpdateHandler;
            const awarenessUpdateHandler = (this.ws as any).__awarenessUpdateHandler;

            if (updateHandler) {
                yjsDoc.doc.off('update', updateHandler);
            }

            if (awarenessUpdateHandler) {
                yjsDoc.awareness.off('update', awarenessUpdateHandler);
            }

            // Remove client from awareness
            awarenessProtocol.removeAwarenessStates(
                yjsDoc.awareness,
                [yjsDoc.doc.clientID],
                this
            );

            // Remove client from session
            YjsService.removeClient(this.sessionId, this.userId);

            console.log(`🔌 Yjs connection cleaned up for user ${this.userId} in session ${this.sessionId}`);
        } catch (error) {
            console.error('Error during Yjs cleanup:', error);
        }
    }

    /**
     * Send message to client
     */
    private send(message: Uint8Array): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        }
    }
}
