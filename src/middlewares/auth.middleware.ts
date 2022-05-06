import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import * as jwt from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';
import { Request } from '🧙‍♂️/types/request';
import Config from '../config';

const secret = expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${Config.auth0.frontend.DOMAIN}/.well-known/jwks.json`,
});

const middleware = jwt({
  secret,
  issuer: `https://${Config.auth0.frontend.DOMAIN}/`,
  algorithms: ['RS256'],
});

/**
 * Public paths that doesn't require authentication
 */
const publicUrls: RegExp[] = [
  /^\/mentors$/,
  /^\/mentors\/featured$/,
  /^\/users\/[^\/]*$/,
  /^\/avatars\/[^\/]*$/,
];

const isPublicUrl = (req: Request) =>
  publicUrls.some((re) => re.test(req.baseUrl));

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    middleware(req, res, (error) => {
      if (req.user) {
        // @ts-ignore
        req.user.auth0Id = req.user.sub;
      }
      if (isPublicUrl(req)) {
        next();
        return;
      }
      if (!req.user.email_verified) {
        return res.status(401).send({
          success: false,
          errors: ['Please verify your email address'],
        });
      }
      if (error) {
        const status = error.status || 401;
        const message =
          error.message ||
          'You need to be authenticated in order to access this resource.';

        return res.status(status).send({
          success: false,
          errors: [message],
        });
      }
      next();
    });
  }
}
