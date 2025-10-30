import type { AuthContext } from "../auth/types";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}
