// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 15-20, 2025
// Scope: Generated Pino logger configuration:
//   - Development mode with pretty printing
//   - Production mode with JSON output
//   - Configurable log levels via environment variable
// Author review: Code reviewed, tested, and validated by team. No modifications needed.

import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

export default logger;