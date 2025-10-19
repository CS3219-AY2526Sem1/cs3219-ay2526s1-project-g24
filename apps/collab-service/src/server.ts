import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { Server as HTTPServer } from 'http';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import observabilityRoutes from './routes/observability.routes';
import sessionRoutes from './routes/session.routes';

export function createServer(): { app: Express; wss: WebSocketServer } {
  const app = express();

  // Security middleware - disable CSP for development
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(cors());

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
  app.use('/v1', sessionRoutes);

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

  // Handle WebSocket upgrade - only for /v1/ws paths
  server.on('upgrade', (request, socket, head) => {
    const url = request.url || '';
    
    if (url.startsWith('/v1/ws/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  return server;
}
