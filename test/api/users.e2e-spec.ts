import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/modules/common/interfaces/user.interface';
import { createUser } from '../utils/seeder';
import { getToken } from '../utils/jwt';

describe('Users', () => {
  let app: INestApplication;
  let server;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  describe('GET /users', () => {
    it('returns a status code of 401 if the user is unauthenticated', async () => {
      return request(server)
        .get('/users')
        .expect(401);
    });

    it('returns a status code of 401 if the user is not an admin', async () => {
      const user = await createUser();
      const token = getToken(user);

      return request(server)
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('returns an array of users if the user is an admin', async () => {
      const [admin] = await Promise.all([
        createUser({ email: 'admin@test.com', roles: [Role.ADMIN] }),
        createUser({ email: 'test@test.com' }),
      ]);
      const token = getToken(admin);

      const { body } = await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(body.data.map(user => user.email)).toEqual([
        'admin@test.com',
        'test@test.com',
      ]);
    });
  });
});
