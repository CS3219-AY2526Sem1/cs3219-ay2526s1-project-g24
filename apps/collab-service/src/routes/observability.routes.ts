// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated observability routes for Collaboration Service:
//   - Health check endpoint (GET /health) for liveness probe
//   - Readiness check endpoint (GET /ready) with database and Redis status
//   - Prometheus metrics endpoint (GET /metrics) exposing all metrics
//   - Express router configuration
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added comprehensive status responses
//   - Enhanced error handling for metrics endpoint

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { isDatabaseHealthy } from '../utils/prisma.js';
import { isRedisHealthy } from '../utils/redis.js';
import { register } from 'prom-client';

const router: ExpressRouter = Router();

/**
 * Health check endpoint (liveness probe)
 * Returns 200 if the service is running
 */
router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        service: 'collab-service',
        timestamp: new Date().toISOString()
    });
});

/**
 * Readiness check endpoint
 * Returns 200 if the service is ready to accept requests
 */
router.get('/ready', async (_req: Request, res: Response) => {
    const dbHealthy = await isDatabaseHealthy();
    const redisHealthy = await isRedisHealthy();

    if (dbHealthy && redisHealthy) {
        res.status(200).json({
            status: 'ready',
            database: 'connected',
            redis: 'connected',
        });
    } else {
        res.status(503).json({
            status: 'not ready',
            database: dbHealthy ? 'connected' : 'disconnected',
            redis: redisHealthy ? 'connected' : 'disconnected',
        });
    }
});

/**
 * Prometheus metrics endpoint
 */
router.get('/metrics', async (_req: Request, res: Response) => {
    try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (error) {
        res.status(500).end();
    }
});

export default router;
