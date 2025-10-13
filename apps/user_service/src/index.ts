import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 8000;

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`User service listening on port ${port}`);
});
