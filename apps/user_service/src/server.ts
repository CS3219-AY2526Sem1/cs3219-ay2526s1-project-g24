import express, { type Express, Request, Response } from 'express';

export const createServer = (): Express => {
  const app = express();
  app
    .get('/health', (req: Request, res: Response) => {
      res.status(200).send('OK');
    });
  return app;
};
