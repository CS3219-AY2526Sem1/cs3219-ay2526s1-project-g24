// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated collaboration manager for real-time code editing:
//   - Yjs document and WebSocket provider management
//   - Monaco editor binding with Yjs
//   - User presence and awareness protocol
//   - Remote cursor rendering and management
//   - Custom message broadcasting (code execution, language changes)
//   - Connection status tracking with reconnection logic
//   - Session termination handling
//   - Error recovery and reporting
//   - Initial sync promise for state hydration
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced WebSocket reconnection with exponential backoff
//   - Optimized presence updates with debouncing
//   - Added comprehensive error handling and logging
//   - Implemented cursor position synchronization
//   - Added session cleanup on disconnect

import type { editor } from 'monaco-editor';
import { resolveServiceEndpoints, stripTrailingSlash } from '@/lib/api-utils';
import { getYjsModules } from './yjs-modules';
import { RemoteCursorManager } from './RemoteCursorManager';

const { wsBase } = resolveServiceEndpoints(
    process.env.NEXT_PUBLIC_COLLAB_SERVICE_URL,
    '3003'
);

const normalizedWsBase = wsBase ? stripTrailingSlash(wsBase) : '';
const WS_SESSIONS_PATH = '/api/v1/ws/sessions';
const WS_SESSIONS_BASE_URL = normalizedWsBase
    ? `${normalizedWsBase}${WS_SESSIONS_PATH}`
    : WS_SESSIONS_PATH;

/**
 * Connection status for collaboration session
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'ended';

/**
 * Error notification callback
 */
export type ErrorCallback = (error: CollaborationErrorInfo) => void;

/**
 * Collaboration error information
 */
export interface CollaborationErrorInfo {
    code: string;
    message: string;
    recoverable: boolean;
    timestamp: Date;
}

/**
 * User presence information
 */
export interface UserPresence {
    clientId: number;
    name: string;
    color: string;
    cursor?: {
        line: number;
        column: number;
    };
}

/**
 * Custom message types for collaboration
 */
export type CollaborationMessageType = 'code-execution-start' | 'code-execution-result' | 'language-change';

/**
 * Custom message structure
 */
export interface CollaborationMessage {
    type: CollaborationMessageType;
    data: any;
    sender: number;
    timestamp: number;
}

/**
 * Generate a random user color
 */
const USER_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52C41A', // Green
];

function getRandomColor(): string {
    return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function getRandomName(): string {
    const adjectives = ['Clever', 'Swift', 'Bright', 'Bold', 'Wise', 'Quick', 'Sharp', 'Smart'];
    const nouns = ['Coder', 'Developer', 'Programmer', 'Engineer', 'Hacker', 'Builder', 'Creator', 'Maker'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

/**
 * Collaboration manager for handling Yjs synchronization
 * Note: This class should only be instantiated on the client side
 */
export class CollaborationManager {
    private ydoc: any = null;
    private provider: any = null;
    private binding: any = null;
    private awareness: any = null;
    private onPresenceChange: ((users: UserPresence[]) => void) | null = null;
    private onError: ErrorCallback | null = null;
    private onCustomMessage: ((message: CollaborationMessage) => void) | null = null;
    private localClientId: number | null = null;
    private userName: string;
    private userColor: string;
    private reconnectAttempts: number = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private cursorManager: RemoteCursorManager | null = null;
    private initialSyncPromise: Promise<void> | null = null;
    private syncHandler: ((isSynced: boolean) => void) | null = null;
    private isSynced = false;
    private sessionTerminated = false; // Track if session was intentionally terminated

    constructor(userName?: string, userColor?: string) {
        this.userName = userName || getRandomName();
        this.userColor = userColor || getRandomColor();
    }

    /**
     * Initialize collaboration for a session
     * @param sessionId - The collaboration session ID
     * @param editor - Monaco editor instance
     * @param onStatusChange - Callback for connection status changes
     */
    async connect(
        sessionId: string,
        editor: editor.IStandaloneCodeEditor,
        onStatusChange: (status: ConnectionStatus) => void
    ): Promise<void> {
        // Preserve callbacks before disconnect
        const savedPresenceCallback = this.onPresenceChange;
        const savedErrorCallback = this.onError;

        // Clean up existing connection
        this.disconnect();

        // Restore callbacks
        this.onPresenceChange = savedPresenceCallback;
        this.onError = savedErrorCallback;
        // Reset sync tracking
        this.initialSyncPromise = null;
        this.syncHandler = null;
        this.isSynced = false;
        this.sessionTerminated = false;

        try {
            // Get Yjs modules (singleton to prevent duplicate imports)
            const { Y, WebsocketProvider, MonacoBinding } = await getYjsModules();

            // Create Yjs document
            this.ydoc = new Y.Doc();

            // Create WebSocket provider
            const sessionsEndpoint = WS_SESSIONS_BASE_URL;
            this.provider = new WebsocketProvider(sessionsEndpoint, sessionId, this.ydoc, {
                connect: true,
                awareness: undefined,
                params: {},
                WebSocketPolyfill: undefined,
                resyncInterval: 5000, // Resync every 5 seconds
                maxBackoffTime: 5000, // Max reconnect backoff
            });

            this.initialSyncPromise = new Promise<void>((resolve) => {
                this.syncHandler = (isSynced: boolean) => {
                    if (isSynced) {
                        console.log('[Collaboration] Initial sync completed');
                        if (this.provider && this.syncHandler) {
                            try {
                                this.provider.off('sync', this.syncHandler);
                            } catch (error) {
                                console.warn('[Collaboration] Failed to detach sync handler:', error);
                            }
                        }
                        this.syncHandler = null;
                        this.isSynced = true;
                        resolve();
                    }
                };
                this.provider.on('sync', this.syncHandler);
            });

            // Get or create a shared text type - MUST match backend ('code')
            const ytext = this.ydoc.getText('code');

            // Create Monaco binding FIRST (before setting awareness state)
            // This is important so the binding can listen to awareness changes
            // MonacoBinding automatically handles cursor tracking and rendering
            this.binding = new MonacoBinding(
                ytext,
                editor.getModel()!,
                new Set([editor]),
                this.provider.awareness
            );

            console.log('[Collaboration] MonacoBinding created:', this.binding);
            console.log('[Collaboration] Awareness states after binding:', this.provider.awareness.getStates());

            // Initialize remote cursor manager
            this.cursorManager = new RemoteCursorManager(editor);

            // Get awareness instance AFTER binding is created
            this.awareness = this.provider.awareness;
            this.localClientId = this.awareness.clientID;

            // Set local user state (for avatars/presence indicator)
            // MonacoBinding uses 'user' field for cursor rendering
            // It looks for user.color and user.name for the cursor label
            this.awareness.setLocalState({
                user: {
                    name: this.userName,
                    color: this.userColor,
                },
            });

            console.log('[Collaboration] Set local user:', {
                clientId: this.localClientId,
                name: this.userName,
                color: this.userColor,
            });

            // Manually track cursor position changes
            // y-monaco v0.1.6 doesn't do this automatically
            editor.onDidChangeCursorPosition((e) => {
                if (this.awareness) {
                    const position = e.position;
                    const model = editor.getModel();
                    if (model) {
                        // Calculate absolute character position from line/column
                        const content = model.getValue();
                        let absolutePos = 0;
                        for (let line = 1; line < position.lineNumber; line++) {
                            absolutePos += model.getLineLength(line) + 1; // +1 for newline
                        }
                        absolutePos += position.column - 1;

                        this.awareness.setLocalStateField('cursor', {
                            line: position.lineNumber,
                            column: position.column,
                            absolutePosition: absolutePos,
                        });

                        console.log('[Collaboration] Cursor moved:', {
                            line: position.lineNumber,
                            column: position.column,
                            absolutePos
                        });
                    }
                }
            });

            // Log awareness changes to see what MonacoBinding is doing
            console.log('[Collaboration] Awareness states after setting user:', Array.from(this.awareness.getStates().entries()));

            // Listen for awareness changes
            this.awareness.on('change', (changes: any) => {
                console.log('[Collaboration] Awareness changed:', {
                    added: changes.added,
                    updated: changes.updated,
                    removed: changes.removed,
                    totalClients: this.awareness.getStates().size,
                });
                this.handleAwarenessChange();

                // Update remote cursors
                if (this.cursorManager && this.localClientId !== null) {
                    this.cursorManager.updateCursors(this.awareness.getStates(), this.localClientId);
                }

                // Handle custom messages
                changes.updated.forEach((clientId: number) => {
                    if (clientId !== this.localClientId) {
                        const state = this.awareness.getStates().get(clientId);
                        if (state?.message) {
                            this.handleCustomMessage(state.message);
                        }
                    }
                });
            });

            // Trigger initial presence update
            this.handleAwarenessChange();

            // Set up connection status listeners
            this.provider.on('status', (event: { status: string }) => {
                console.log('[Collaboration] WebSocket status:', event.status);
                if (event.status === 'connected') {
                    this.reconnectAttempts = 0; // Reset on successful connection
                    onStatusChange('connected');

                    // Trigger presence update when connection is established
                    this.handleAwarenessChange();
                } else if (event.status === 'disconnected') {
                    // Don't attempt to reconnect if session was terminated
                    if (this.sessionTerminated) {
                        console.log('[Collaboration] Session terminated, skipping reconnection');
                        return;
                    }
                    
                    this.reconnectAttempts++;
                    if (this.reconnectAttempts <= this.MAX_RECONNECT_ATTEMPTS) {
                        console.log(`[Collaboration] Reconnecting... (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
                        onStatusChange('connecting');
                    } else {
                        console.error('[Collaboration] Max reconnect attempts reached');
                        this.notifyError({
                            code: 'CONNECTION_LOST',
                            message: 'Connection lost. Please refresh the page to reconnect.',
                            recoverable: false,
                            timestamp: new Date(),
                        });
                        onStatusChange('error');
                    }
                }
            });

            this.provider.on('connection-error', (event: Event) => {
                console.error('[Collaboration] Connection error:', event);
                this.notifyError({
                    code: 'CONNECTION_ERROR',
                    message: 'Failed to connect to collaboration server. Please check your internet connection and try again.',
                    recoverable: true,
                    timestamp: new Date(),
                });
                onStatusChange('error');
            });

            this.provider.on('connection-close', (event: any) => {
                console.warn('[Collaboration] Connection closed:', event);
                if (event.code === 4000) {
                    // Session terminated intentionally (by partner or system)
                    // Mark as terminated to prevent reconnection attempts
                    this.sessionTerminated = true;
                    
                    // Destroy the provider to stop reconnection attempts
                    if (this.provider) {
                        try {
                            this.provider.shouldConnect = false; // Disable auto-reconnect
                            this.provider.destroy();
                        } catch (error) {
                            console.error('[Collaboration] Error destroying provider after termination:', error);
                        }
                    }
                    
                    this.notifyError({
                        code: 'SESSION_TERMINATED',
                        message: event.reason || 'Your partner has ended the session',
                        recoverable: false,
                        timestamp: new Date(),
                    });
                    onStatusChange('ended'); // Use 'ended' status - clearer for users
                } else if (event.code === 1006) {
                    // Abnormal closure - only reconnect if session wasn't terminated
                    if (!this.sessionTerminated) {
                        this.notifyError({
                            code: 'CONNECTION_CLOSED',
                            message: 'Connection unexpectedly closed. Attempting to reconnect...',
                            recoverable: true,
                            timestamp: new Date(),
                        });
                    }
                }
            });

            console.log('[Collaboration] Connected to session:', sessionId, 'as', this.userName);
        } catch (error) {
            console.error('[Collaboration] Error setting up collaboration:', error);
            this.notifyError({
                code: 'SETUP_ERROR',
                message: error instanceof Error ? error.message : 'Failed to setup collaboration. Please try again.',
                recoverable: true,
                timestamp: new Date(),
            });
            onStatusChange('error');
            throw error;
        }
    }

    /**
     * Disconnect from collaboration session and clean up resources
     */
    disconnect(): void {
        console.log('[Collaboration] Disconnecting...');

        if (this.cursorManager) {
            this.cursorManager.dispose();
            this.cursorManager = null;
        }

        if (this.binding) {
            try {
                this.binding.destroy();
            } catch (error) {
                console.error('[Collaboration] Error destroying binding:', error);
            }
            this.binding = null;
        }

        if (this.awareness) {
            try {
                // Clear local state before destroying
                this.awareness.setLocalState(null);
            } catch (error) {
                console.error('[Collaboration] Error clearing awareness:', error);
            }
        }

        if (this.provider && this.syncHandler) {
            try {
                this.provider.off('sync', this.syncHandler);
            } catch (error) {
                console.warn('[Collaboration] Error detaching sync handler:', error);
            }
        }

        if (this.provider) {
            try {
                this.provider.destroy();
            } catch (error) {
                console.error('[Collaboration] Error destroying provider:', error);
            }
            this.provider = null;
        }

        if (this.ydoc) {
            try {
                this.ydoc.destroy();
            } catch (error) {
                console.error('[Collaboration] Error destroying document:', error);
            }
            this.ydoc = null;
        }

        this.awareness = null;
        this.localClientId = null;
        this.initialSyncPromise = null;
        this.syncHandler = null;
        this.isSynced = false;
        this.sessionTerminated = false;

        console.log('[Collaboration] Disconnected successfully');
    }

    /**
     * Check if currently connected to a session
     */
    isConnected(): boolean {
        return this.provider !== null && this.ydoc !== null;
    }

    /**
     * Set callback for presence changes
     */
    onPresenceUpdate(callback: (users: UserPresence[]) => void): void {
        this.onPresenceChange = callback;
        // Immediately call with current state
        if (this.awareness) {
            this.handleAwarenessChange();
        }
    }

    /**
     * Set callback for error notifications
     */
    onErrorNotification(callback: ErrorCallback): void {
        this.onError = callback;
    }

    /**
     * Notify error via callback
     */
    private notifyError(error: CollaborationErrorInfo): void {
        if (this.onError) {
            this.onError(error);
        }
    }

    /**
     * Get list of connected users
     */
    getConnectedUsers(): UserPresence[] {
        if (!this.awareness) {
            console.log('[Collaboration] No awareness instance');
            return [];
        }

        const users: UserPresence[] = [];
        const states = this.awareness.getStates();

        console.log('[Collaboration] Getting connected users. Total states:', states.size);

        states.forEach((state: any, clientId: number) => {
            console.log('[Collaboration] Client', clientId, 'state:', JSON.stringify(state, null, 2));
            if (state.user) {
                const user: UserPresence = {
                    clientId,
                    name: state.user.name || 'Anonymous',
                    color: state.user.color || '#808080',
                };

                // Check for cursor data in different possible formats
                // y-monaco might store cursor in 'cursor' or in state directly
                if (state.cursor) {
                    user.cursor = state.cursor;
                } else if (state.selection) {
                    // MonacoBinding stores cursor as selection
                    user.cursor = {
                        line: state.selection.start?.line || 0,
                        column: state.selection.start?.column || 0,
                    };
                }

                users.push(user);
            }
        });

        console.log('[Collaboration] Total users:', users.length, users);
        return users;
    }

    /**
     * Handle awareness changes and notify callback
     */
    private handleAwarenessChange(): void {
        console.log('[Collaboration] handleAwarenessChange called. Has callback:', !!this.onPresenceChange);
        if (this.onPresenceChange) {
            const users = this.getConnectedUsers();
            console.log('[Collaboration] Presence update:', users);
            console.log('[Collaboration] Calling onPresenceChange callback with', users.length, 'users');
            this.onPresenceChange(users);
            console.log('[Collaboration] Callback completed');
        } else {
            console.warn('[Collaboration] No presence change callback set!');
        }
    }

    /**
     * Get local user info
     */
    getLocalUser(): { name: string; color: string; clientId: number | null } {
        return {
            name: this.userName,
            color: this.userColor,
            clientId: this.localClientId,
        };
    }

    /**
     * Wait for the initial sync with the collaboration server to complete.
     */
    async waitForInitialSync(): Promise<void> {
        if (this.isSynced) {
            return;
        }
        if (this.initialSyncPromise) {
            await this.initialSyncPromise;
        }
    }

    /**
     * Get the current shared document content.
     */
    getSharedContent(): string {
        if (!this.ydoc) {
            return '';
        }
        const ytext = this.ydoc.getText('code');
        return ytext.toString();
    }

    /**
     * Check if the shared document already has content.
     */
    hasSharedContent(): boolean {
        return this.getSharedContent().trim().length > 0;
    }

    /**
     * Replace the shared document content with the provided string.
     * Only seeds if the document is currently empty to avoid overwriting existing work.
     * Uses a transaction to prevent race conditions when multiple users try to seed simultaneously.
     */
    setSharedContent(content: string): void {
        if (!this.ydoc) {
            console.warn('[Collaboration] Cannot set content: no document');
            return;
        }
        const ytext = this.ydoc.getText('code');

        // Use a transaction to ensure atomic check-and-set
        // This prevents race conditions when multiple users try to seed simultaneously
        let didInsert = false;
        this.ydoc.transact(() => {
            const currentLength = ytext.length;
            if (currentLength > 0) {
                console.log('[Collaboration] Document already has content (length:', currentLength, '), skipping seed to prevent duplication');
                return;
            }

            if (content && content.trim().length > 0) {
                console.log('[Collaboration] Seeding empty document with template (length:', content.length, ')');
                ytext.insert(0, content);
                didInsert = true;
            }
        }, 'seed-initial-content'); // Transaction origin to identify it

        if (didInsert) {
            console.log('[Collaboration] ✅ Successfully seeded document');
        }
    }

    /**
     * Send a custom message to all users in the session
     */
    sendMessage(type: CollaborationMessageType, data: any): void {
        if (!this.awareness || this.localClientId === null) {
            console.warn('[Collaboration] Cannot send message: not connected');
            return;
        }

        const message: CollaborationMessage = {
            type,
            data,
            sender: this.localClientId,
            timestamp: Date.now(),
        };

        console.log('[Collaboration] Sending message:', message);

        // Broadcast message through awareness
        this.awareness.setLocalStateField('message', message);

        // Clear message after a short delay (awareness is state-based, not event-based)
        setTimeout(() => {
            if (this.awareness) {
                this.awareness.setLocalStateField('message', null);
            }
        }, 100);
    }

    /**
     * Handle custom messages from other users
     */
    private handleCustomMessage(message: CollaborationMessage): void {
        console.log('[Collaboration] Received message:', message);
        if (this.onCustomMessage) {
            this.onCustomMessage(message);
        }
    }

    /**
     * Set callback for custom messages
     */
    onMessage(callback: (message: CollaborationMessage) => void): void {
        this.onCustomMessage = callback;
    }
}
