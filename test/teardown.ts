export default async () => {
  // @ts-ignore
  await global.__MONGOD__.stop();
};
