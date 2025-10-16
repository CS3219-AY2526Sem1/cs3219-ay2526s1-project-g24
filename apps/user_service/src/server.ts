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
  app.use(cors());
  app.use(cookieParser());

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  RegisterRoutes(app);

  return app;
};
