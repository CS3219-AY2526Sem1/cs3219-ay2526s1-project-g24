/**
 * API Configuration for microservices
 * These URLs point to the backend services defined in docker-compose.yml
 * 
 * IMPORTANT: 
 * - For localhost development: Uses localhost URLs
 * - For production (K8s): Uses same-origin (window.location.origin) since all services 
 *   are behind the same ALB/Ingress
 */

// Check if we're in the browser and accessing from localhost
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.hostname === '::1'
);

// For production, prefer same-origin (avoids mixed content) and upgrade any http envs to https
// For localhost, use the specific service ports
const getServiceUrl = (envVar: string | undefined, localPort: string): string => {
  if (isLocalhost) {
    return `http://localhost:${localPort}`;
  }

  // When running in the browser on a deployed site, always use same-origin to avoid mixed content
  if (isBrowser) {
    return window.location.origin;
  }

  // Fallback for non-browser (SSR/build) contexts: respect env if provided, but upgrade to https
  if (envVar && envVar.trim() !== '') {
    // Ensure we never emit an http scheme in production builds
    return envVar.startsWith('http://') ? envVar.replace('http://', 'https://') : envVar;
  }

  // Default to empty so clients construct relative URLs
  return '';
};

export const API_CONFIG = {
  // Matching Service (port 3002 in dev, behind /api/v1/match in prod)
  MATCHING_SERVICE: getServiceUrl(process.env.NEXT_PUBLIC_MATCHING_SERVICE_URL, '3002'),
  
  // Code Execution Service (port 3010 in dev, behind /api/v1/execution in prod)
  CODE_EXECUTION_SERVICE: getServiceUrl(process.env.NEXT_PUBLIC_CODE_EXECUTION_SERVICE_URL, '3010'),
  
  // Question Service (port 8000 in dev, behind /api/v1/questions in prod)
  QUESTION_SERVICE: getServiceUrl(process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL, '8000'),
  
  // User Service (port 8001 in dev, behind /api/v1/users in prod)
  USER_SERVICE: getServiceUrl(process.env.NEXT_PUBLIC_USER_SERVICE_URL, '8001'),
} as const;
