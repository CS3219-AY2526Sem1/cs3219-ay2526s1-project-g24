export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
  jwt: {
    privateKey: process.env.RSA_PRIVATE_KEY || '',
    jwksUri: process.env.JWKS_URI || 'http://localhost:8001/.well-known/jwks.json',
  },
};
