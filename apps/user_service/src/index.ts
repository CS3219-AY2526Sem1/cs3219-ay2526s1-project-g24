import { createServer } from "./server";

// Import all controllers to ensure they are included in the tsoa metadata generation
import "./controllers/health.controller";
import "./controllers/auth.controller";
import "./controllers/users.controller";

const port = process.env.PORT || 8000;
const server = createServer();

server.listen(port, () => {
  console.log(`User service listening on port ${port}`);
});
