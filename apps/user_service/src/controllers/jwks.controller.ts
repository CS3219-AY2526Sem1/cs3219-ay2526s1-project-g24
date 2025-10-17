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
  public async getJwks(): Promise<JwksResponse> {
    const publicKey = await jose.importSPKI(config.jwt.publicKey, 'RS256');
    const jwk = await jose.exportJWK(publicKey);

    return {
      keys: [
        {
          ...jwk,
          kid: '1', // Key ID, useful for key rotation
          use: 'sig', // This key is for signing
          alg: 'RS256', // The algorithm is RS256
        },
      ],
    };
  }
}