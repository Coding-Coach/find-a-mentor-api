import { User } from '../modules/common/interfaces/user.interface';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}
