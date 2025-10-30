import type { JWTPayload } from "jose";

export interface AuthContext {
  userId: string;
  scopes: string[];
  roles: string[];
  token: string;
  payload: JWTPayload;
}
