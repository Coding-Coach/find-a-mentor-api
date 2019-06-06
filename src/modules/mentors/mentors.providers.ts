import { Connection } from 'mongoose';
import { ApplicationSchema } from './schemas/application.schema';

export const applicationProviders = [
  {
    provide: 'APPLICATION_MODEL',
    useFactory: (connection: Connection) => connection.model('Application', ApplicationSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
