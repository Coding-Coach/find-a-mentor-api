import { Request as ExpressReqeust } from 'express';

export interface AccessTokenUser {
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

export interface Request extends ExpressReqeust {
  user?: AccessTokenUser;
}
