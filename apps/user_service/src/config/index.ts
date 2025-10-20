export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
  jwt: {
    privateKey: process.env.RSA_PRIVATE_KEY || '',
    publicKey: process.env.RSA_PUBLIC_KEY || '',
    jwksUri: process.env.JWKS_URI || 'http://localhost:8001/.well-known/jwks.json',
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '900', // 15 minutes
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '604800', // 7 days
  },
};
