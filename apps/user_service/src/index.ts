import { createServer } from './server';

const port = process.env.PORT || 8000;
const server = createServer();

server.listen(port, () => {
  console.log(`User service listening on port ${port}`);
});