import { User } from '../modules/common/interfaces/user.interface';

declare namespace Express {
  export interface Request {
    user?: User
  }
}
