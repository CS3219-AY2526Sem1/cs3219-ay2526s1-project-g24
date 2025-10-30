/**
 * Singleton module for Yjs imports to prevent duplicate imports
 * See: https://github.com/yjs/yjs/issues/438
 */

let yjsModules: {
    Y: typeof import('yjs');
    WebsocketProvider: typeof import('y-websocket').WebsocketProvider;
    MonacoBinding: typeof import('y-monaco').MonacoBinding;
} | null = null;

/**
 * Get Yjs modules with lazy loading
 * Ensures all Yjs libraries are imported only once
 */
export async function getYjsModules() {
    if (yjsModules) {
        return yjsModules;
    }

    const [Y, { WebsocketProvider }, { MonacoBinding }] = await Promise.all([
        import('yjs'),
        import('y-websocket'),
        import('y-monaco'),
    ]);

    yjsModules = {
        Y,
        WebsocketProvider,
        MonacoBinding,
    };

    return yjsModules;
}
