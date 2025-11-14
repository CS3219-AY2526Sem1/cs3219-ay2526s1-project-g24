// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: October 1-10, 2025
// Scope: Generated Prometheus metrics for matching service:
//   - matchRequestsTotal: Counter for match requests
//   - matchSuccessTotal: Counter for successful matches
//   - matchTimeoutTotal: Counter for timeouts
//   - queueSize: Gauge for active requests by difficulty
//   - matchDuration: Histogram for matching latency
//   - sseConnections: Gauge for active SSE connections
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added custom business metrics for matching performance
//   - Enhanced labels for better metric granularity
//   - Integrated with /metrics endpoint for Prometheus scraping

/**
 * Prometheus metrics for the matching service
 */

import { Registry, Gauge, Histogram, Counter } from "prom-client";
import type { Difficulty } from "../types.js";

// Create a new registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from "prom-client";
collectDefaultMetrics({ register });

/**
 * Queue length gauge - current number of requests in each queue
 */
export const queueLengthGauge = new Gauge({
  name: "match_queue_length",
  help: "Number of requests in queue by difficulty",
  labelNames: ["difficulty"],
  registers: [register],
});

/**
 * Match latency histogram - time from queue entry to match
 */
export const matchLatencyHistogram = new Histogram({
  name: "match_latency_seconds",
  help: "Time from queue to match in seconds",
  labelNames: ["difficulty"],
  buckets: [1, 5, 10, 15, 20, 25, 30],
  registers: [register],
});

/**
 * Successful matches counter
 */
export const matchesCounter = new Counter({
  name: "matches_total",
  help: "Total successful matches",
  labelNames: ["difficulty"],
  registers: [register],
});

/**
 * Timeout counter
 */
export const timeoutsCounter = new Counter({
  name: "match_timeouts_total",
  help: "Total timeout events",
  labelNames: ["difficulty"],
  registers: [register],
});

/**
 * Cancellation counter
 */
export const cancellationsCounter = new Counter({
  name: "match_cancellations_total",
  help: "Total cancellations",
  labelNames: ["difficulty"],
  registers: [register],
});

/**
 * Redis operation latency histogram
 */
export const redisLatencyHistogram = new Histogram({
  name: "redis_operation_duration_seconds",
  help: "Redis operation latency in seconds",
  labelNames: ["operation"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

/**
 * Collaboration service latency histogram
 */
export const collaborationServiceLatencyHistogram = new Histogram({
  name: "collaboration_service_duration_seconds",
  help: "Collaboration service call latency in seconds",
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Error counter
 */
export const errorsCounter = new Counter({
  name: "match_errors_total",
  help: "Total errors by type",
  labelNames: ["type", "operation"],
  registers: [register],
});

/**
 * HTTP request duration histogram
 */
export const httpRequestDurationHistogram = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

/**
 * HTTP requests counter
 */
export const httpRequestsCounter = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

/**
 * Active SSE connections gauge
 */
export const sseConnectionsGauge = new Gauge({
  name: "sse_connections_active",
  help: "Number of active SSE connections",
  registers: [register],
});

/**
 * Incompatible match attempts counter
 */
export const incompatibleMatchesCounter = new Counter({
  name: "match_incompatible_total",
  help: "Total incompatible match attempts",
  labelNames: ["difficulty"],
  registers: [register],
});

/**
 * Helper functions to record metrics
 */
export const metrics = {
  /**
   * Record queue length for a difficulty
   */
  setQueueLength(difficulty: Difficulty, length: number) {
    queueLengthGauge.set({ difficulty }, length);
  },

  /**
   * Record a successful match
   */
  recordMatch(difficulty: Difficulty, latencySeconds: number) {
    matchesCounter.inc({ difficulty });
    matchLatencyHistogram.observe({ difficulty }, latencySeconds);
  },

  /**
   * Record a timeout
   */
  recordTimeout(difficulty: Difficulty) {
    timeoutsCounter.inc({ difficulty });
  },

  /**
   * Record a cancellation
   */
  recordCancellation(difficulty: Difficulty) {
    cancellationsCounter.inc({ difficulty });
  },

  /**
   * Record an incompatible match attempt
   */
  recordIncompatibleMatch(difficulty: Difficulty) {
    incompatibleMatchesCounter.inc({ difficulty });
  },

  /**
   * Record Redis operation latency
   */
  recordRedisOperation(operation: string, durationSeconds: number) {
    redisLatencyHistogram.observe({ operation }, durationSeconds);
  },

  /**
   * Record collaboration service call latency
   */
  recordCollaborationServiceCall(durationSeconds: number) {
    collaborationServiceLatencyHistogram.observe(durationSeconds);
  },

  /**
   * Record an error
   */
  recordError(type: string, operation: string) {
    errorsCounter.inc({ type, operation });
  },

  /**
   * Record HTTP request
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ) {
    httpRequestsCounter.inc({ method, route, status_code: statusCode });
    httpRequestDurationHistogram.observe(
      { method, route, status_code: statusCode },
      durationSeconds,
    );
  },

  /**
   * Increment SSE connections
   */
  incrementSseConnections() {
    sseConnectionsGauge.inc();
  },

  /**
   * Decrement SSE connections
   */
  decrementSseConnections() {
    sseConnectionsGauge.dec();
  },
};
