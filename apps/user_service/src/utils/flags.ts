// Utility for environment-based flags (e.g., cookie attributes)

/**
 * Checks if the application is running in a production environment.
 * @returns {boolean} True if in production, false otherwise.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
