import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JwksController } from '../jwks.controller';
import * as jose from 'jose';
import { config } from '../../config';

vi.mock('jose');
vi.mock('../../config', () => ({
  config: {
    jwt: {
      publickey: 'test_public_key',
    },
  },
}));

describe('jwkscontroller', () => {
  let jwkscontroller: JwksController;

  beforeEach(() => {
    jwkscontroller = new JwksController();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getjwks', () => {
    it('should return a valid jwks response', async () => {
      const publickey = 'test_public_key';
      const jwk = {
        kty: 'rsa',
        n: 'test_n',
        e: 'test_e',
      };

      vi.mocked(jose.importSPKI).mockResolvedValue(publickey as any);
      vi.mocked(jose.exportJWK).mockResolvedValue(jwk as any);

      const result = await jwkscontroller.getJwks();

      expect(jose.importSPKI).toHaveBeenCalledWith(config.jwt.publicKey, 'RS256');
      expect(jose.exportJWK).toHaveBeenCalledWith(publickey);
      expect(result).toEqual({
        keys: [
          {
            ...jwk,
            kid: '1',
            use: 'sig',
            alg: 'RS256',
          },
        ],
      });
    });
  });
});