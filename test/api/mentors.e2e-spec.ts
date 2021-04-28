import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { AppModule } from '../../src/app.module';
import {
  Role,
  ChannelName,
} from '../../src/modules/common/interfaces/user.interface';
import {
  createUser,
  createMentorship,
  approveMentorship,
} from '../utils/seeder';
import { getToken } from '../utils/jwt';

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
    it('contains no channels if there is not an authenticated user', async () => {
      await Promise.all([
        createUser({
          name: 'Mentor One',
          roles: [Role.MENTOR],
          channels: [{ type: ChannelName.EMAIL, id: 'mentor1@codingcoach.io' }],
          available: true,
        }),
        createUser({
          name: 'Mentor Two',
          roles: [Role.MENTOR],
          channels: [{ type: ChannelName.TWITTER, id: '@cc_mentor1' }],
          available: true,
        }),
      ]);

      const response = await request(server)
        .get('/mentors')
        .expect(200);

      const { body } = response;

      body.data.forEach(mentor => {
        expect(mentor.channels).toEqual([]);
      });
    });
    it('contains no channels if none of the mentors are mentoring the requesting user', async () => {
      const [mentee, mentor1, mentor2] = await Promise.all([
        createUser(),
        createUser({
          name: 'Mentor One',
          roles: [Role.MENTOR],
          channels: [{ type: ChannelName.EMAIL, id: 'mentor1@codingcoach.io' }],
          available: true,
        }),
        createUser({
          name: 'Mentor Two',
          roles: [Role.MENTOR],
          channels: [{ type: ChannelName.TWITTER, id: '@cc_mentor1' }],
          available: true,
        }),
      ]);
      const token = getToken(mentee);

      const response = await request(server)
        .get('/mentors')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const { body } = response;

      body.data.forEach(mentor => {
        expect(mentor.channels).toEqual([]);
      });
    });

    it('contains channels only for the mentors of the requesting user', async () => {
      const [mentee, mentor1, mentor2] = await Promise.all([
        createUser(),
        createUser({
          name: 'Mentor One',
          roles: [Role.MENTOR],
          channels: [{ type: ChannelName.EMAIL, id: 'mentor1@codingcoach.io' }],
          available: true,
        }),
        createUser({
          name: 'Mentor Two',
          roles: [Role.MENTOR],
          channels: [{ type: ChannelName.TWITTER, id: '@cc_mentor1' }],
          available: true,
        }),
      ]);

      const mentorship = await createMentorship({
        mentor: mentor1._id,
        mentee: mentee._id,
      });

      await approveMentorship({ mentorship });

      const token = getToken(mentee);

      const response = await request(server)
        .get('/mentors')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const { body } = response;
      const responseMentor1 = body.data.find(
        mentor => mentor.name === mentor1.name,
      );
      const responseMentor2 = body.data.find(
        mentor => mentor.name === mentor2.name,
      );
      expect(responseMentor1.channels[0].id).toEqual(mentor1.channels[0].id);
      expect(responseMentor1.channels[0].type).toEqual(
        mentor1.channels[0].type,
      );
      expect(responseMentor2.channels).toEqual([]);
    });
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
