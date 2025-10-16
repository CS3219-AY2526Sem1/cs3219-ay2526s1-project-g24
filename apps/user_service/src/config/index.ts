export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
  jwt: {
    privateKey: process.env.RSA_PRIVATE_KEY || '',
    publicKey: process.env.RSA_PUBLIC_KEY || '',
  },
};
