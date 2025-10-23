import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JwksController } from "../jwks.controller";
import * as jose from "jose";
import { jwtConfig } from "../../config";

vi.mock("jose");
vi.mock("../../config", () => ({
  jwtConfig: {
    publicKey: "test_public_key",
  },
}));

describe("jwkscontroller", () => {
  let jwkscontroller: JwksController;

  beforeEach(() => {
    jwkscontroller = new JwksController();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getjwks", () => {
    it("should return a valid jwks response", async () => {
      const publicKey = "test_public_key";
      const jwk = {
        kty: "rsa",
        n: "test_n",
        e: "test_e",
        kid: "1",
        use: "sig",
        alg: "RS256",
      };

      vi.mocked(jose.importSPKI).mockResolvedValue(publicKey as any);
      vi.mocked(jose.exportJWK).mockResolvedValue(jwk as any);

      const result = await jwkscontroller.getJwks();

      expect(jose.importSPKI).toHaveBeenCalledWith(
        jwtConfig.publicKey,
        "RS256"
      );
      expect(jose.exportJWK).toHaveBeenCalledWith(publicKey);
      expect(result).toEqual({
        keys: [
          {
            kty: "rsa",
            n: "test_n",
            e: "test_e",
            kid: "1",
            use: "sig",
            alg: "RS256",
          },
        ],
      });
    });
  });
});
