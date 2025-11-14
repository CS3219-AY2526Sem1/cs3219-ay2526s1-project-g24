// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated API utility functions:
//   - Service URL resolution for different environments (dev, prod, SSR)
//   - HTTP and WebSocket URL builders
//   - Localhost detection and same-origin handling
//   - URL scheme normalization (http/https, ws/wss)
//   - API configuration with service endpoints
//   - Service URL builder factory
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced security with HTTPS enforcement in production
//   - Added robust URL validation
//   - Optimized for Next.js SSR and client-side rendering

/**
 * Shared helpers for constructing service base URLs that work in both
 * local development (localhost), browser production (same-origin),
 * and server-side rendering/build environments where only environment
 * variables are available.
 */

const isBrowser = typeof window !== "undefined";

const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const isLocalhost = isBrowser && LOCAL_HOSTNAMES.has(window.location.hostname);

/**
 * Ensure we never emit an insecure http scheme when we expect https in
 * production builds. Also allows accepting ws/wss inputs by upgrading them.
 */
const normalizeToHttps = (rawUrl: string): string => {
  if (!rawUrl) {
    return "";
  }

  const trimmed = rawUrl.trim();

  if (trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("http://")) {
    return trimmed.replace("http://", "https://");
  }

  if (trimmed.startsWith("wss://")) {
    return trimmed.replace("wss://", "https://");
  }

  if (trimmed.startsWith("ws://")) {
    return trimmed.replace("ws://", "https://");
  }

  // Default: treat as host without scheme and prepend https
  return `https://${trimmed}`;
};

/**
 * Build the HTTP(S) base URL for a service.
 * - Local browser: explicit localhost port
 * - Browser production: same-origin (empty string)
 * - SSR/build: rely on env var, upgraded to https
 */
export const resolveHttpServiceUrl = (
  envVar: string | undefined,
  localPort: string,
): string => {
  if (isLocalhost) {
    return `http://localhost:${localPort}`;
  }

  if (isBrowser) {
    return "";
  }

  if (envVar && envVar.trim() !== "") {
    return normalizeToHttps(envVar);
  }

  return "";
};

/**
 * Build the WS(S) base URL for a service.
 * Mirrors resolveHttpServiceUrl but provides the correct ws/wss scheme.
 */
export const resolveWsServiceUrl = (
  envVar: string | undefined,
  localPort: string,
): string => {
  if (isLocalhost) {
    return `ws://localhost:${localPort}`;
  }

  if (isBrowser) {
    const secure = window.location.protocol === "https:";
    const scheme = secure ? "wss" : "ws";
    return `${scheme}://${window.location.host}`;
  }

  if (envVar && envVar.trim() !== "") {
    const httpsUrl = normalizeToHttps(envVar);
    if (!httpsUrl) {
      return "";
    }
    return httpsUrl.replace(
      /^http(s?):\/\//,
      (_match, secure) => (secure ? "wss://" : "ws://"),
    );
  }

  return "";
};

/**
 * Resolve both HTTP and WS service endpoints for a given service.
 */
export const resolveServiceEndpoints = (
  serviceUrl: string | undefined,
  localPort: string,
) => {
  const httpBase = resolveHttpServiceUrl(serviceUrl, localPort);
  const wsBase = resolveWsServiceUrl(serviceUrl, localPort);

  return {
    httpBase,
    wsBase,
  };
};

export const stripTrailingSlash = (url: string): string =>
  url.endsWith("/") ? url.replace(/\/+$/, "") : url;

const ensureLeadingSlash = (path: string): string =>
  path.startsWith("/") ? path : `/${path}`;

/**
 * Join a service base URL with a path, handling empty (same-origin) bases and
 * avoiding duplicate slashes.
 */
export const buildServiceUrl = (baseUrl: string | undefined, path: string) => {
  const normalizedPath = ensureLeadingSlash(path);
  const trimmedBase = (baseUrl ?? "").trim();

  if (!trimmedBase) {
    return normalizedPath;
  }

  return `${stripTrailingSlash(trimmedBase)}${normalizedPath}`;
};

/**
 * Create a service URL builder for a specific service.
 * @param baseUrl The base URL for the service.
 * @param prefix An optional prefix to include in all generated URLs.
 * @returns A function that builds service URLs.
 */
export const createServiceUrlBuilder = (
  baseUrl: string | undefined,
  prefix = "",
) => {
  const normalizedBase = (baseUrl ?? "").trim();
  const normalizedPrefix = prefix
    ? stripTrailingSlash(ensureLeadingSlash(prefix))
    : "";

  return (path: string) => {
    const normalizedPath = ensureLeadingSlash(path);
    const combinedPath = normalizedPrefix
      ? `${normalizedPrefix}${normalizedPath}`
      : normalizedPath;
    return buildServiceUrl(normalizedBase, combinedPath);
  };
};

export const API_CONFIG = {
  MATCHING_SERVICE: resolveHttpServiceUrl(
    process.env.NEXT_PUBLIC_MATCHING_SERVICE_URL,
    "3002",
  ),
  CODE_EXECUTION_SERVICE: resolveHttpServiceUrl(
    process.env.NEXT_PUBLIC_CODE_EXECUTION_SERVICE_URL,
    "3010",
  ),
  QUESTION_SERVICE: resolveHttpServiceUrl(
    process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL,
    "8000",
  ),
  USER_SERVICE: resolveHttpServiceUrl(
    process.env.NEXT_PUBLIC_USER_SERVICE_URL,
    "8001",
  ),
  COLLAB_SERVICE: resolveHttpServiceUrl(
    process.env.NEXT_PUBLIC_COLLAB_SERVICE_URL,
    "3003",
  ),
} as const;
