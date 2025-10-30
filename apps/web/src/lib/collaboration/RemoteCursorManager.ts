import type { editor } from 'monaco-editor';

/**
 * Simple remote cursor manager for Monaco editor with Yjs
 * Note: y-monaco v0.1.6 doesn't support cursor rendering, so we implement it manually
 */
export class RemoteCursorManager {
    private editor: editor.IStandaloneCodeEditor;
    private decorations: Map<number, string[]> = new Map();

    constructor(editor: editor.IStandaloneCodeEditor) {
        this.editor = editor;
    }

    /**
     * Update remote cursors from awareness states
     */
    updateCursors(awarenessStates: Map<number, any>, localClientId: number): void {
        const currentClients = new Set<number>();

        awarenessStates.forEach((state, clientId) => {
            if (clientId === localClientId) return; // Skip local client

            if (state.cursor && state.user) {
                currentClients.add(clientId);
                this.renderCursor(clientId, state);
            }
        });

        // Remove cursors for disconnected clients
        this.decorations.forEach((_, clientId) => {
            if (!currentClients.has(clientId)) {
                this.removeCursor(clientId);
            }
        });
    }

    /**
     * Render a remote cursor
     */
    private renderCursor(clientId: number, state: any): void {
        const { cursor, user } = state;
        if (!cursor?.line || !cursor?.column || !user) return;

        try {
            const position = { lineNumber: cursor.line, column: cursor.column };

            // Create cursor decoration (colored vertical line)
            const decorations: editor.IModelDeltaDecoration[] = [{
                range: new (window as any).monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                ),
                options: {
                    className: `remote-cursor-${clientId}`,
                    beforeContentClassName: `remote-cursor-line-${clientId}`,
                    stickiness: 1,
                }
            }];

            // Update decorations
            const oldDecorations = this.decorations.get(clientId) || [];
            const newDecorations = this.editor.deltaDecorations(oldDecorations, decorations);
            this.decorations.set(clientId, newDecorations);

            // Add CSS for cursor color
            this.addCursorStyle(clientId, user.color);
        } catch (error) {
            console.error('[RemoteCursor] Error rendering cursor:', error);
        }
    }

    /**
     * Add CSS for cursor color
     */
    private addCursorStyle(clientId: number, color: string): void {
        const styleId = `remote-cursor-style-${clientId}`;
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .remote-cursor-line-${clientId} {
                border-left: 2px solid ${color} !important;
                margin-left: -1px;
            }
            .remote-cursor-line-${clientId}::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -4px;
                width: 6px;
                height: 6px;
                background: ${color};
                border-radius: 50%;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Remove cursor for a client
     */
    private removeCursor(clientId: number): void {
        const decorations = this.decorations.get(clientId);
        if (decorations) {
            this.editor.deltaDecorations(decorations, []);
            this.decorations.delete(clientId);
        }

        const style = document.getElementById(`remote-cursor-style-${clientId}`);
        if (style) style.remove();
    }

    /**
     * Clean up all cursors
     */
    dispose(): void {
        this.decorations.forEach((decorations) => {
            this.editor.deltaDecorations(decorations, []);
        });
        this.decorations.clear();
    }
}
