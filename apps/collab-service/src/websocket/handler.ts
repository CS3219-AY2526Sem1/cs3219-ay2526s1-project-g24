import { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { URL } from 'url';
import { verifyToken } from '../middleware/auth';
import { SessionService } from '../services/session.service';
import { YjsWebSocketHandler } from './yjs-handler';
import { AuthenticatedWebSocket, AppError } from '../types';

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
    }

    /**
     * Set up WebSocket connection handler
     */
    private setupConnectionHandler(): void {
        this.wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
            const authWs = ws as AuthenticatedWebSocket;

            try {
                // Parse URL and extract sessionId and token
                const url = new URL(request.url || '', `http://${request.headers.host}`);
                const pathParts = url.pathname.split('/');

                // Expected path: /api/v1/ws/sessions/:sessionId
                const sessionId = pathParts[pathParts.length - 1];
                const token = url.searchParams.get('token');

                if (!sessionId) {
                    throw new AppError('Session ID is required', 400);
                }

                if (!token) {
                    throw new AppError('Authentication token is required', 401);
                }

                // Verify JWT token
                const payload = verifyToken(token);
                const userId = payload.userId;

                // Verify session exists and user is a participant
                const session = await SessionService.getSession(sessionId);
                if (!session) {
                    throw new AppError('Session not found', 404);
                }

                const isParticipant = await SessionService.isParticipant(sessionId, userId);
                if (!isParticipant) {
                    throw new AppError('User is not a participant in this session', 403);
                }

                if (session.status !== 'ACTIVE') {
                    throw new AppError('Session is not active', 400);
                }

                // Store user info on socket
                authWs.userId = userId;
                authWs.sessionId = sessionId;
                authWs.isAlive = true;

                console.log(`🔗 WebSocket connected: user=${userId}, session=${sessionId}`);

                // Create Yjs handler for this connection
                const yjsHandler = new YjsWebSocketHandler(sessionId, userId, authWs);
                this.connections.set(ws, yjsHandler);

                // Initialize Yjs connection
                await yjsHandler.initialize();

                // Set up message handler
                ws.on('message', async (data: Buffer) => {
                    try {
                        authWs.isAlive = true; // Reset heartbeat

                        // Handle binary Yjs protocol messages
                        if (Buffer.isBuffer(data)) {
                            await yjsHandler.handleMessage(new Uint8Array(data));
                        } else {
                            console.warn('Received non-binary message, ignoring');
                        }
                    } catch (error) {
                        console.error('Error handling WebSocket message:', error);
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
    }
}
