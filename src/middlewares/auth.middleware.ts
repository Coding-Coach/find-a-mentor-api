import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';
import { UsersService } from '../modules/users/users.service';
import Config from '../config';

const middleware = jwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${Config.auth0.frontend.DOMAIN}/.well-known/jwks.json`,
  }),
  issuer: `https://${Config.auth0.frontend.DOMAIN}/`,
  algorithm: 'RS256',
});

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) { }

  use(req: Request, res: Response, next: NextFunction) {
    middleware(req, res, (error) => {
      if (error) {
        const status = error.status || 500;
        const message = error.message || 'You need to be authenticated in order to access this resource.';

        return res.status(status).send({
          success: false,
          errors: [message],
        });
      }

      // Adding the user id
      req.user.id = req.user.sub;

      // Looking up the current user from the database
      const current = this.usersService.find(req.user.sub);
      if (current) {
        req.user = current;
      }

      next();
    });
  }
}
