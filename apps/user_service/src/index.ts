// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 15-20, 2025
// Scope: Generated application entry point with:
//   - Server creation and startup
//   - Database connection management
//   - Controller imports for TSOA metadata
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Graceful shutdown handling
//   - Database connection error handling
//   - Added logging for startup and shutdown events
//   - Modified port configuration for deployment

import { createServer } from "./server";

// Import all controllers to ensure they are included in the tsoa metadata generation
import "./controllers/health.controller";
import "./controllers/auth.controller";
import "./controllers/users.controller";
import logger from './logger';

const port = process.env.PORT || 8000;
const server = createServer();

server.listen(port, () => {
  logger.info(`User service listening on port ${port}`);
});
