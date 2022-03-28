import { Connection } from 'mongoose';
import { ApplicationSchema } from './schemas/application.schema';
import { UserSchema } from './schemas/user.schema';
import { UserRecordSchema } from './schemas/user-record.schema';
import { MentorshipSchema } from '../mentorships/schemas/mentorship.schema';

export const commonProviders = [
  {
    provide: 'USER_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('User', UserSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'USER_RECORD_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('UserRecord', UserRecordSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'APPLICATION_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Application', ApplicationSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'MENTORSHIP_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Mentorship', MentorshipSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
