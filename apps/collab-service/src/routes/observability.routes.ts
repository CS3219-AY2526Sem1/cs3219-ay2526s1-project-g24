import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { isDatabaseHealthy } from '../utils/prisma';
import { isRedisHealthy } from '../utils/redis';
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
