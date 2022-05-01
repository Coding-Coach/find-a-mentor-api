interface AccessTokenUser {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  at_hash: string;
  nonce: string;
  auth0Id: string;
  email_verified: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AccessTokenUser;
  }
}
