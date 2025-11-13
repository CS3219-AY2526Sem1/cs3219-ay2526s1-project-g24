import { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { URL } from 'url';
import { verifyToken } from '../middleware/auth.js';
import { SessionService } from '../services/session.service.js';
import { YjsWebSocketHandler } from './yjs-handler.js';
import { AuthenticatedWebSocket, AppError } from '../types/index.js';
import { CollaborationMetrics } from '../metrics/collaboration.metrics.js';

// Singleton instance for global access
let wsHandlerInstance: WebSocketHandler | null = null;

/**
 * Main WebSocket connection handler
 * Handles authentication, routing, and delegation to Yjs handler
 */
export class WebSocketHandler {
    private wss: WebSocketServer;
    private connections = new Map<WebSocket, YjsWebSocketHandler>();

    constructor(wss: WebSocketServer) {
        this.wss = wss;
        this.setupConnectionHandler();
        
        // Set singleton instance
        wsHandlerInstance = this;
    }

    /**
     * Set up WebSocket connection handler
     */
    private setupConnectionHandler(): void {
        this.wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
            const authWs = ws as AuthenticatedWebSocket;

            try {
                console.log('[WebSocket] New connection attempt from:', request.socket.remoteAddress);

                // Parse URL and extract sessionId and token
                const url = new URL(request.url || '', `http://${request.headers.host}`);
                const pathParts = url.pathname.split('/');

                // Expected path: /api/v1/ws/sessions/:sessionId
                const sessionId = pathParts[pathParts.length - 1];

                // Try to get token from query parameter first, then from cookies
                let token = url.searchParams.get('token');

                // If no token in query, try to extract from cookies
                if (!token && request.headers.cookie) {
                    const cookies = request.headers.cookie.split(';').reduce((acc, cookie) => {
                        const [key, value] = cookie.trim().split('=');
                        acc[key] = value;
                        return acc;
                    }, {} as Record<string, string>);
                    token = cookies['access_token'] || null;
                    console.log('[WebSocket] Token extracted from cookie:', !!token);
                }

                console.log('[WebSocket] Connection details:', {
                    path: url.pathname,
                    sessionId,
                    hasToken: !!token,
                    tokenPrefix: token?.substring(0, 20),
                    tokenSource: url.searchParams.get('token') ? 'query' : 'cookie',
                });

                if (!sessionId) {
                    console.warn('[WebSocket] ⚠️  Missing session ID');
                    throw new AppError('Session ID is required', 400);
                }

                if (!token) {
                    console.warn('[WebSocket] ⚠️  Missing authentication token');
                    throw new AppError('Authentication token is required', 401);
                }

                console.log('[WebSocket] Verifying JWT token...');

                // Verify JWT token
                const payload = await verifyToken(token);
                const userId = payload.userId;

                console.log('[WebSocket] ✓ Token verified for user:', userId);

                // Verify session exists and user is a participant
                const session = await SessionService.getSession(sessionId);
                if (!session) {
                    console.warn('[WebSocket] ⚠️  Session not found:', sessionId);
                    throw new AppError('Session not found', 404);
                }

                console.log('[WebSocket] ✓ Session found:', {
                    sessionId,
                    status: session.status,
                    user1Id: session.user1Id,
                    user2Id: session.user2Id,
                });

                const isParticipant = await SessionService.isParticipant(sessionId, userId);
                if (!isParticipant) {
                    console.warn('[WebSocket] ⚠️  User is not a participant:', {
                        userId,
                        sessionId,
                    });
                    throw new AppError('User is not a participant in this session', 403);
                }

                if (session.status !== 'ACTIVE') {
                    console.warn('[WebSocket] ⚠️  Session is not active:', {
                        sessionId,
                        status: session.status,
                    });
                    throw new AppError('Session is not active', 400);
                }

                // Store user info on socket
                authWs.userId = userId;
                authWs.sessionId = sessionId;
                authWs.isAlive = true;

                console.log(`[WebSocket] 🔗 Connection established: user=${userId}, session=${sessionId}`);

                // Track WebSocket connection in metrics
                CollaborationMetrics.connectionOpened();

                // Mark user as connected in the session
                try {
                    await SessionService.rejoinSession(sessionId, userId);
                } catch (error) {
                    console.warn('[WebSocket] Failed to mark user as connected (non-critical):', error);
                }

                // Create Yjs handler for this connection
                const yjsHandler = new YjsWebSocketHandler(sessionId, userId, authWs);
                this.connections.set(ws, yjsHandler);

                // Initialize Yjs connection
                await yjsHandler.initialize();
                console.log('[WebSocket] ✓ Yjs handler initialized');

                // Set up message handler
                ws.on('message', async (data: Buffer) => {
                    try {
                        authWs.isAlive = true; // Reset heartbeat

                        // Handle binary Yjs protocol messages
                        if (Buffer.isBuffer(data)) {
                            await yjsHandler.handleMessage(new Uint8Array(data));
                        } else {
                            console.warn('[WebSocket] ⚠️  Received non-binary message, ignoring');
                        }
                    } catch (error) {
                        console.error('[WebSocket] ❌ Error handling message:', {
                            error: error instanceof Error ? error.message : String(error),
                            sessionId,
                            userId,
                        });
                    }
                });

                // Set up pong handler (heartbeat)
                ws.on('pong', () => {
                    authWs.isAlive = true;
                });

                // Set up close handler
                ws.on('close', async () => {
                    console.log(`🔌 WebSocket disconnected: user=${userId}, session=${sessionId}`);
                    await this.handleDisconnect(ws);
                });

                // Set up error handler
                ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                });

            } catch (error) {
                console.error('WebSocket connection error:', error);

                // Send error message and close connection
                if (error instanceof AppError) {
                    this.sendError(ws, error.message, error.statusCode);
                } else {
                    this.sendError(ws, 'Internal server error', 500);
                }

                ws.close();
            }
        });
    }

    /**
     * Handle WebSocket disconnection
     */
    private async handleDisconnect(ws: WebSocket): Promise<void> {
        const yjsHandler = this.connections.get(ws);
        if (yjsHandler) {
            await yjsHandler.cleanup();
            this.connections.delete(ws);
        }
        
        // Track WebSocket disconnection in metrics
        CollaborationMetrics.connectionClosed();
    }

    /**
     * Send error message to client
     */
    private sendError(ws: WebSocket, message: string, statusCode: number): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'error',
                message,
                statusCode,
            }));
        }
    }

    /**
     * Start heartbeat interval to detect dead connections
     */
    startHeartbeat(intervalMs: number = 30000): NodeJS.Timeout {
        console.log(`💓 Starting WebSocket heartbeat (interval: ${intervalMs}ms)`);

        return setInterval(() => {
            this.wss.clients.forEach((ws) => {
                const authWs = ws as AuthenticatedWebSocket;

                if (authWs.isAlive === false) {
                    console.log(`💀 Terminating dead connection: user=${authWs.userId}, session=${authWs.sessionId}`);
                    this.handleDisconnect(ws);
                    return ws.terminate();
                }

                authWs.isAlive = false;
                ws.ping();
            });
        }, intervalMs);
    }

    /**
     * Stop heartbeat interval
     */
    stopHeartbeat(interval: NodeJS.Timeout): void {
        clearInterval(interval);
        console.log('✓ Stopped WebSocket heartbeat');
    }

    /**
     * Get statistics about active connections
     */
    getStats(): {
        totalConnections: number;
        connectionsBySessions: Map<string, number>;
    } {
        const connectionsBySessions = new Map<string, number>();

        this.wss.clients.forEach((ws) => {
            const authWs = ws as AuthenticatedWebSocket;
            if (authWs.sessionId) {
                const count = connectionsBySessions.get(authWs.sessionId) || 0;
                connectionsBySessions.set(authWs.sessionId, count + 1);
            }
        });

        return {
            totalConnections: this.wss.clients.size,
            connectionsBySessions,
        };
    }

    /**
     * Broadcast message to all clients in a session
     */
    broadcastToSession(sessionId: string, message: any): void {
        this.wss.clients.forEach((ws) => {
            const authWs = ws as AuthenticatedWebSocket;
            if (authWs.sessionId === sessionId && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }

    /**
     * Close all WebSocket connections for a specific session
     * Used when session is terminated by one participant
     */
    async closeSessionConnections(sessionId: string, reason: string): Promise<void> {
        console.log(`🔌 Closing all connections for session ${sessionId}: ${reason}`);
        
        const promises: Promise<void>[] = [];
        const connectionsToClose: WebSocket[] = [];

        // Collect all connections for this session
        this.wss.clients.forEach((ws) => {
            const authWs = ws as AuthenticatedWebSocket;
            if (authWs.sessionId === sessionId) {
                connectionsToClose.push(ws);
            }
        });

        // Close all collected connections
        for (const ws of connectionsToClose) {
            const yjsHandler = this.connections.get(ws);
            if (yjsHandler) {
                promises.push(yjsHandler.cleanup());
            }
            // Close with custom code 4000 to indicate session termination
            ws.close(4000, reason);
        }

        await Promise.all(promises);
        console.log(`✓ Closed ${connectionsToClose.length} connection(s) for session ${sessionId}`);
    }

    /**
     * Close all connections gracefully
     */
    async closeAll(): Promise<void> {
        console.log(`🔌 Closing all WebSocket connections (${this.connections.size} connections)`);

        const promises: Promise<void>[] = [];

        for (const [ws, yjsHandler] of this.connections.entries()) {
            promises.push(yjsHandler.cleanup());
            ws.close(1000, 'Server shutting down');
        }

        await Promise.all(promises);
        this.connections.clear();
        
        // Clear singleton instance
        wsHandlerInstance = null;
    }
}

/**
 * Get the singleton WebSocket handler instance
 */
export function getWebSocketHandler(): WebSocketHandler | null {
    return wsHandlerInstance;
}
