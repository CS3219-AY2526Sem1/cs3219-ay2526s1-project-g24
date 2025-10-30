/**
 * API Configuration for microservices
 * These URLs point to the backend services defined in docker-compose.yml
 * 
 * IMPORTANT: In the browser, always use localhost URLs when running on your local machine.
 * The NEXT_PUBLIC_ env vars are available to the browser, while regular env vars are not.
 */

// Check if we're in the browser and accessing from localhost
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

export const API_CONFIG = {
  // Matching Service (port 3002)
  // Browser accessing localhost:3000 -> use localhost:3002
  // Otherwise use env var or default to Docker service name
  MATCHING_SERVICE: isLocalhost
    ? 'http://localhost:3002'
    : process.env.NEXT_PUBLIC_MATCHING_SERVICE_URL || 'http://localhost:3002',
  
  // Code Execution Service (port 3010)
  CODE_EXECUTION_SERVICE: isLocalhost
    ? 'http://localhost:3010'
    : process.env.NEXT_PUBLIC_CODE_EXECUTION_SERVICE_URL || 'http://localhost:3010',
  
  // Question Service (port 8000)
  QUESTION_SERVICE: isLocalhost
    ? 'http://localhost:8000'
    : process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL || 'http://localhost:8000',
  
  // User Service (port 8001)
  USER_SERVICE: isLocalhost
    ? 'http://localhost:8001'
    : process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8001',
} as const;
