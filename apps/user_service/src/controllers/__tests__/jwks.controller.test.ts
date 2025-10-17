import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JwksController } from '../jwks.controller';
import * as jose from 'jose';
import { config } from '../../config';

vi.mock('jose');
vi.mock('../../config', () => ({
  config: {
    jwt: {
      privateKey: 'test_private_key',
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
      const privatekey = 'test_private_key';
      const jwk = {
        kty: 'rsa',
        n: 'test_n',
        e: 'test_e',
        kid: '1',
        use: 'sig',
        alg: 'RS256',
      };

      vi.mocked(jose.importPKCS8).mockResolvedValue(privatekey as any);
      vi.mocked(jose.exportJWK).mockResolvedValue(jwk as any);

      const result = await jwkscontroller.getJwks();

      expect(jose.importPKCS8).toHaveBeenCalledWith(config.jwt.privateKey, 'RS256');
      expect(jose.exportJWK).toHaveBeenCalledWith(privatekey);
      expect(result).toEqual({
        keys: [
          {
            kty: 'rsa',
            n: 'test_n',
            e: 'test_e',
            kid: '1',
            use: 'sig',
            alg: 'RS256',
          },
        ],
      });
    });
  });
});