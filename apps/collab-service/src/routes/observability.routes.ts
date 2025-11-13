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
        // Update real-time metrics before serving
        const { YjsService } = await import('../services/yjs.service.js');
        const { yjsDocumentCache, sessionParticipantsTotal } = await import('../metrics/collaboration.metrics.js');
        
        // Update Yjs document cache size and participant count
        const yjsStats = YjsService.getStats();
        yjsDocumentCache.set(yjsStats.totalDocuments);
        sessionParticipantsTotal.set(yjsStats.totalClients);
        
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (error) {
        console.error('Failed to generate metrics:', error);
        res.status(500).end();
    }
});

export default router;
