import express, { type Express, type RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { RegisterRoutes } from './routes/routes';
import { AuthController } from './controllers/auth.controller';
import swaggerDocument from '../dist/swagger.json';

export const createServer = (): Express => {
  const app = express();

  // Increase payload size limit to handle base64 images (10MB)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Scalable CORS config
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));

  app.use(cookieParser());
  
  // Simple health check endpoint for k8s probes (outside of /api/v1 prefix)
  app.get('/health', (_req, res) => {
    res.json({ status: 'OK' });
  });
  
  // Wrap swagger-ui-express handlers to satisfy Express types across versions
  const swaggerServe = swaggerUi.serve as unknown as RequestHandler;
  const swaggerSetup = swaggerUi.setup(swaggerDocument) as unknown as RequestHandler;
  app.use('/docs', swaggerServe, swaggerSetup);
  RegisterRoutes(app);
  return app;
};
