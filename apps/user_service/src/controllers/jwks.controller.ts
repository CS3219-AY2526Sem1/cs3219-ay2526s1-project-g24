// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 20-25, 2025
// Scope: Generated JWKS (JSON Web Key Set) controller:
//   - getJwks(): Expose public keys for JWT verification
//   Uses jose library to export RSA public key in JWK format for external services
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Proper JWK format with required fields (kid, use, alg)
//   - Integration with JWT configuration

import { Controller, Get, Route, Tags } from 'tsoa';
import * as jose from 'jose';
import { jwtConfig } from '../config';

interface JwksResponse {
  keys: (jose.JWK & { kid: string; use: string; alg: string })[];
}

@Route('.well-known')
@Tags('JWKS')
export class JwksController extends Controller {
  @Get('jwks.json')
  public async getJwks() {
    // Import the public key
    const publicKey = await jose.importSPKI(jwtConfig.publicKey, 'RS256');
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
