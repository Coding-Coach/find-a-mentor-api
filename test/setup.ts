import { MongoMemoryServer } from 'mongodb-memory-server';

export default async () => {
  const mongod = new MongoMemoryServer();
  const uri = await mongod.getUri();
  process.env.MONGO_DATABASE_URL = uri;
  // @ts-ignore
  global.__MONGOD__ = mongod;
};
