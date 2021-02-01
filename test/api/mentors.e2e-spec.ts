import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/modules/common/interfaces/user.interface';
import { createUser } from '../utils/seeder';

describe('Mentors', () => {
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

  describe('GET /mentors', () => {
    describe('availability filter', () => {
      it('returns all mentors if available query param does not exist', async () => {
        const [availableMentor, unavailableMentor] = await Promise.all([
          createUser({ roles: [Role.MENTOR], available: true }),
          createUser({ roles: [Role.MENTOR], available: false }),
          createUser({ roles: [Role.MEMBER] }),
        ]);
        const { body } = await request(server)
          .get('/mentors')
          .expect(200);
        expect(body.data.length).toBe(2);
        const ids = body.data.map(mentor => mentor._id);
        expect(ids).toContain(availableMentor._id.toString());
        expect(ids).toContain(unavailableMentor._id.toString());
      });

      it('returns only available mentors if available is true', async () => {
        const [availableMentor] = await Promise.all([
          createUser({ roles: [Role.MENTOR], available: true }),
          createUser({ roles: [Role.MENTOR], available: false }),
          createUser({ roles: [Role.MEMBER] }),
        ]);
        const { body } = await request(server)
          .get('/mentors?available=true')
          .expect(200);
        expect(body.data.length).toBe(1);
        expect(body.data[0]._id).toBe(availableMentor._id.toString());
      });

      it('returns only unavailable mentors if available is false', async () => {
        const [_, unavailableMentor] = await Promise.all([
          createUser({ roles: [Role.MENTOR], available: true }),
          createUser({ roles: [Role.MENTOR], available: false }),
          createUser({ roles: [Role.MEMBER] }),
        ]);
        const { body } = await request(server)
          .get('/mentors?available=false')
          .expect(200);
        expect(body.data.length).toBe(1);
        expect(body.data[0]._id).toBe(unavailableMentor._id.toString());
      });
    });
  });
});
