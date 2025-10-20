import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { RegisterRoutes } from './routes/routes';
import { AuthController } from './controllers/auth.controller';
import swaggerDocument from '../dist/swagger.json';

export const createServer = (): Express => {
  const app = express();

  app.use(express.json());

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
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  RegisterRoutes(app);
  return app;
};
