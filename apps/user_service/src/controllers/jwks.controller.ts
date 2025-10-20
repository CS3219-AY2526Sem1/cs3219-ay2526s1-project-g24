import { Controller, Get, Route, Tags } from 'tsoa';
import * as jose from 'jose';
import { config } from '../config';

interface JwksResponse {
  keys: (jose.JWK & { kid: string; use: string; alg: string })[];
}

@Route('.well-known')
@Tags('JWKS')
export class JwksController extends Controller {
  @Get('jwks.json')
  public async getJwks() {
    // Import the public key
    const publicKey = await jose.importSPKI(config.jwt.publicKey, 'RS256');
    // Export the public JWK from the public key
    const jwk = await jose.exportJWK(publicKey);
    return {
      keys: [
        {
          ...jwk,
          kid: '1',
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };
  }
}
