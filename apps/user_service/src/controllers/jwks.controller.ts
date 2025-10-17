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
    // Import the private key
    const privateKey = await jose.importPKCS8(config.jwt.privateKey, 'RS256');
    // Export the public JWK from the private key
    const jwk = await jose.exportJWK(privateKey);
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