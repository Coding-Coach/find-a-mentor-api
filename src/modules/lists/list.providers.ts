import { Connection } from 'mongoose';
import { ListSchema } from './schemas/list.schema';

export const listsProviders = [
  {
    provide: 'LIST_MODEL',
    useFactory: (connection: Connection) => connection.model('List', ListSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
