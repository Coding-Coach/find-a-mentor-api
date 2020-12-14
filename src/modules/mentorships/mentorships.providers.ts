import { Connection } from 'mongoose';
import { MentorshipSchema } from './schemas/mentorship.schema';

export const mentorshipsProviders = [
  {
    provide: 'MENTORSHIP_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Mentorship', MentorshipSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
