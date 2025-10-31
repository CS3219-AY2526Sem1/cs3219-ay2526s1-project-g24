/**
 * Collaboration service configuration
 * Dynamically selects the correct WebSocket base URL.
 * - In localhost: use ws://localhost:3003
 * - In browser production: use same host with wss:// to avoid mixed content
 * - In SSR/build: use env if provided, upgrading ws:// to wss://
 */
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname === '::1'
);

function getWsBaseUrl(envVar?: string): string {
    if (isLocalhost) {
        return 'ws://localhost:3003';
    }

    if (isBrowser) {
        const secure = window.location.protocol === 'https:';
        const scheme = secure ? 'wss' : 'ws';
        return `${scheme}://${window.location.host}`;
    }

    if (envVar && envVar.trim() !== '') {
        return envVar.startsWith('ws://') ? envVar.replace('ws://', 'wss://') : envVar;
    }

    return '';
}

export const COLLABORATION_CONFIG = {
    WS_URL: getWsBaseUrl(process.env.NEXT_PUBLIC_COLLAB_SERVICE_URL),
} as const;
