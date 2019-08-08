import { Connection } from 'mongoose';
import { ApplicationSchema } from './schemas/application.schema';
import { UserSchema } from './schemas/user.schema';

export const commonProviders = [
  {
    provide: 'USER_MODEL',
    useFactory: (connection: Connection) => connection.model('User', UserSchema),
    inject: ['DATABASE_CONNECTION'],
  }, {
    provide: 'APPLICATION_MODEL',
    useFactory: (connection: Connection) => connection.model('Application', ApplicationSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
