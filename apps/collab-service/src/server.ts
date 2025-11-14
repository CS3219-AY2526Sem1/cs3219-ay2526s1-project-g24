// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: October 20 - November 5, 2025
// Scope: Generated Express server setup with WebSocket integration:
//   - createServer(): Express app configuration with middleware
//   - CORS configuration for cross-origin requests
//   - Helmet security headers (CSP disabled for dev)
//   - WebSocket server setup alongside HTTP server
//   - Route registration (session, observability)
//   - Static file serving for Yjs client
//   - Error handling middleware
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Production CORS configuration with environment-based origins
//   - Enhanced security headers for production
//   - Added comprehensive error handling
//   - Integrated health check endpoints

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { Server as HTTPServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import observabilityRoutes from './routes/observability.routes.js';
import sessionRoutes from './routes/session.routes.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(): { app: Express; wss: WebSocketServer } {
    const app = express();

    // Security middleware - disable CSP for development
    app.use(
        helmet({
            contentSecurityPolicy: false,
        })
    );

    // CORS configuration
    const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`[CORS] Blocked request from origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Allow cookies and auth headers
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parser
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req: Request, _res: Response, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });

    // Serve static test client
    app.use('/public', express.static(path.join(__dirname, '../public')));

    // Routes
    app.use('/', observabilityRoutes);
    app.use('/api/v1', sessionRoutes);

    // Root endpoint
    app.get('/', (_req: Request, res: Response) => {
        res.json({
            service: 'collab-service',
            version: '1.0.0',
            status: 'running',
        });
    });

    // 404 handler
    app.use((_req: Request, res: Response) => {
        res.status(404).json({ error: 'Not Found' });
    });

    // Error handler (must be last)
    app.use(errorHandler);

    // Create WebSocket server (will be attached to HTTP server)
    const wss = new WebSocketServer({ noServer: true });

    return { app, wss };
}

export function startServer(app: Express, wss: WebSocketServer): HTTPServer {
    const port = config.port;

    const server = app.listen(port, () => {
        console.log(`
╔═══════════════════════════════════════╗
║   Collaboration Service               ║
║   Port: ${port}                        ║
║   Environment: ${config.nodeEnv}      ║
║   Database: PostgreSQL                ║
║   Redis: ${config.redis.host}:${config.redis.port}     ║
╚═══════════════════════════════════════╝
    `);
    });

    // Handle WebSocket upgrade - only for /api/v1/ws paths
    server.on('upgrade', (request, socket, head) => {
        const url = request.url || '';

        if (url.startsWith('/api/v1/ws/')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    return server;
}
