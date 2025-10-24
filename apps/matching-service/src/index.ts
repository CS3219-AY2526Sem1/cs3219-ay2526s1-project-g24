/**
 * Matching Service - Main entry point
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { logger } from "./observability/logger.js";
import { initTracing, shutdownTracing } from "./observability/tracing.js";
import { initRedis, closeRedis } from "./services/redis.js";
import { router } from "./api/routes.js";
import { startMatcher } from "./workers/matcher.js";
import { startTimeoutWorker } from "./workers/timeout.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

/**
 * Initialize and start the service
 */
async function start() {
  try {
    // Initialize observability
    initTracing();
    logger.info("Starting Matching Service...");

    // Initialize Redis
    initRedis();
    logger.info("Redis initialized");

    // Create Express app
    const app = express();

    // Middleware
    // CORS configuration - allows frontend to communicate with the service
    // Parse CORS_ORIGIN as array if it contains commas, otherwise use as single value or wildcard
    const corsOrigin = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.includes(',')
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : process.env.CORS_ORIGIN
      : "*";
    
    app.use(cors({
      origin: corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }));
    
    logger.info({ corsOrigin }, "CORS configured");
    
  app.use(express.json());
  app.use(cookieParser());

    // Routes
    app.use("/", router);

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, "HTTP server listening");
    });

    // Start workers
  startMatcher();
  // Start timeout worker (uses sorted set scanning to detect timeouts)
  startTimeoutWorker();

    logger.info("Workers started");
    logger.info("Matching Service ready");

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, "Shutdown signal received");

      // Stop accepting new requests
      server.close(() => {
        logger.info("HTTP server closed");
      });

      // Close Redis connection
      await closeRedis();

      // Shutdown tracing
      await shutdownTracing();

      logger.info("Shutdown complete");
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      logger.fatal({ error }, "Uncaught exception");
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.fatal({ reason, promise }, "Unhandled rejection");
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, "Failed to start service");
    process.exit(1);
  }
}

// Start the service
start();
