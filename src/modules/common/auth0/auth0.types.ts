type Auth0ResponseSuccess<T> = T;

export interface EmailVerificationTicket {
  ticket: string;
}

interface Auth0ResponseError {
  statusCode: number;
  error: string;
  message: string;
  errorCode: string;
}

export type Auth0Response<T = any> =
  | Auth0ResponseSuccess<T>
  | Auth0ResponseError;

interface Auth0UserIdentity {
  connection: string;
  provider: string;
  user_id: string;
  isSocial: boolean;
}

export interface Auth0User {
  created_at: string;
  email: string;
  email_verified: boolean;
  identities: Auth0UserIdentity[];
  name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  user_id: string;
  last_ip: string;
  last_login: string;
  logins_count: number;
}
