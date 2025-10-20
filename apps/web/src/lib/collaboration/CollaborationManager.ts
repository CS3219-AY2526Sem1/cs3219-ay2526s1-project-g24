import type { editor } from 'monaco-editor';
import { COLLABORATION_CONFIG } from '@/lib/config/collaboration';
import { getYjsModules } from './yjs-modules';

/**
 * Connection status for collaboration session
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Collaboration manager for handling Yjs synchronization
 * Note: This class should only be instantiated on the client side
 */
export class CollaborationManager {
    private ydoc: any = null;
    private provider: any = null;
    private binding: any = null;

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
        // Clean up existing connection
        this.disconnect();

        try {
            // Get Yjs modules (singleton to prevent duplicate imports)
            const { Y, WebsocketProvider, MonacoBinding } = await getYjsModules();

            // Create Yjs document
            this.ydoc = new Y.Doc();

            // Create WebSocket provider
            const wsUrl = `${COLLABORATION_CONFIG.WS_URL}/v1/ws/sessions/${sessionId}?token=${COLLABORATION_CONFIG.TEST_TOKEN}`;
            this.provider = new WebsocketProvider(wsUrl, sessionId, this.ydoc);

            // Set up connection status listeners
            this.provider.on('status', (event: { status: string }) => {
                console.log('[Collaboration] WebSocket status:', event.status);
                if (event.status === 'connected') {
                    onStatusChange('connected');
                } else if (event.status === 'disconnected') {
                    onStatusChange('disconnected');
                }
            });

            this.provider.on('connection-error', (event: Event) => {
                console.error('[Collaboration] Connection error:', event);
                onStatusChange('error');
            });

            // Get or create a shared text type
            const ytext = this.ydoc.getText('monaco');

            // Create Monaco binding
            this.binding = new MonacoBinding(
                ytext,
                editor.getModel()!,
                new Set([editor]),
                this.provider.awareness
            );

            console.log('[Collaboration] Connected to session:', sessionId);
        } catch (error) {
            console.error('[Collaboration] Error setting up collaboration:', error);
            onStatusChange('error');
            throw error;
        }
    }

    /**
     * Disconnect from collaboration session and clean up resources
     */
    disconnect(): void {
        if (this.binding) {
            this.binding.destroy();
            this.binding = null;
        }
        if (this.provider) {
            this.provider.destroy();
            this.provider = null;
        }
        if (this.ydoc) {
            this.ydoc.destroy();
            this.ydoc = null;
        }
    }

    /**
     * Check if currently connected to a session
     */
    isConnected(): boolean {
        return this.provider !== null && this.ydoc !== null;
    }
}
