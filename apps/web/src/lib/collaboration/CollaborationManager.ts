import type { editor } from 'monaco-editor';
import { COLLABORATION_CONFIG } from '@/lib/config/collaboration';
import { getYjsModules } from './yjs-modules';
import { RemoteCursorManager } from './RemoteCursorManager';

/**
 * Connection status for collaboration session
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

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
    private localClientId: number | null = null;
    private userName: string;
    private userColor: string;
    private reconnectAttempts: number = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private cursorManager: RemoteCursorManager | null = null;

    constructor(userName?: string, userColor?: string) {
        this.userName = userName || getRandomName();
        this.userColor = userColor || getRandomColor();
    }

    /**
     * Initialize collaboration for a session
     * @param sessionId - The collaboration session ID
     * @param editor - Monaco editor instance
     * @param onStatusChange - Callback for connection status changes
     * @param userId - Optional user ID for authentication (defaults to TEST_TOKEN)
     */
    async connect(
        sessionId: string,
        editor: editor.IStandaloneCodeEditor,
        onStatusChange: (status: ConnectionStatus) => void,
        userId?: string
    ): Promise<void> {
        // Preserve callbacks before disconnect
        const savedPresenceCallback = this.onPresenceChange;
        const savedErrorCallback = this.onError;

        // Clean up existing connection
        this.disconnect();

        // Restore callbacks
        this.onPresenceChange = savedPresenceCallback;
        this.onError = savedErrorCallback;

        try {
            // Get Yjs modules (singleton to prevent duplicate imports)
            const { Y, WebsocketProvider, MonacoBinding } = await getYjsModules();

            // Create Yjs document
            this.ydoc = new Y.Doc();

            // Use provided userId or fall back to TEST_TOKEN
            const token = userId || COLLABORATION_CONFIG.TEST_TOKEN;

            // Create WebSocket provider
            const wsUrl = `${COLLABORATION_CONFIG.WS_URL}/api/v1/ws/sessions/${sessionId}?token=${token}`;
            this.provider = new WebsocketProvider(wsUrl, sessionId, this.ydoc, {
                connect: true,
                awareness: undefined,
                params: {},
                WebSocketPolyfill: undefined,
                resyncInterval: 5000, // Resync every 5 seconds
                maxBackoffTime: 5000, // Max reconnect backoff
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
                if (event.code === 1006) {
                    // Abnormal closure
                    this.notifyError({
                        code: 'CONNECTION_CLOSED',
                        message: 'Connection unexpectedly closed. Attempting to reconnect...',
                        recoverable: true,
                        timestamp: new Date(),
                    });
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
}
