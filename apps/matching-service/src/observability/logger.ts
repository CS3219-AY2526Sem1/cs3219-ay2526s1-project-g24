// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: October 1-10, 2025
// Scope: Generated Pino logger configuration:
//   - Structured JSON logging for production
//   - Pretty printing for development
//   - Configurable log levels via environment variable
//   - Custom formatters for consistent log structure
// Author review: Code reviewed, tested, and validated by team. No modifications needed.

/**
 * Structured logging with Pino
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }),
});

/**
 * Create a child logger with additional context
 */
export function createContextLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log request context
 */
export function logRequest(reqId: string, context: Record<string, any>) {
  return logger.child({ reqId, ...context });
}
