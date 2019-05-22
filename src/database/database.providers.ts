import * as mongoose from 'mongoose';
import Config from '../config';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<typeof mongoose> =>
      await mongoose.connect(Config.mongo.url),
  },
];
