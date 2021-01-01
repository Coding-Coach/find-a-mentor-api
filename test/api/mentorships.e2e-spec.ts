import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/modules/common/interfaces/user.interface';
import { Status } from '../../src/modules/mentorships/interfaces/mentorship.interface';
import { createUser, createMentorship } from '../utils/seeder';
import { getToken } from '../utils/jwt';

describe('Mentorships', () => {
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

  describe('PATCH /mentorships/:id', () => {
    describe('unauthenticated requests', () => {
      it('returns a status code of 401', async () => {
        return request(server)
          .patch('/mentorships/abc')
          .expect(401);
      });
    });

    it('returns a status code of 404 if the mentorship is not found', () => {
      const id = mongoose.Types.ObjectId();
      const token = getToken();

      return request(server)
        .patch(`/mentorships/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: Status.APPROVED })
        .expect(404);
    });

    describe('bad requests', () => {
      it('returns a status code of 400 if the payload is invalid', () => {
        const id = mongoose.Types.ObjectId();
        const token = getToken();
        return request(server)
          .patch(`/mentorships/${id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
      });

      it('returns a status code of 400 if the mentorship id is invalid', () => {
        const token = getToken();
        return request(server)
          .patch('/mentorships/abc')
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(400);
      });

      it('returns a status code of 400 if the current user is a mentee in the mentorship and the status is not cancelled', async () => {
        const [mentee, mentor] = await Promise.all([
          createUser(),
          createUser(),
        ]);
        const mentorship = await createMentorship({
          mentor: mentor._id,
          mentee: mentee._id,
        });

        const token = getToken(mentee);
        return request(server)
          .patch(`/mentorships/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(400);
      });

      it('returns a status code of 400 if the current user is a mentor in the mentorship and the status is not allowed to be updated by a mentor', async () => {
        const [mentee, mentor] = await Promise.all([
          createUser(),
          createUser(),
        ]);
        const mentorship = await createMentorship({
          mentor: mentor._id,
          mentee: mentee._id,
        });

        const token = getToken(mentor);
        return request(server)
          .patch(`/mentorships/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.CANCELLED })
          .expect(400);
      });
    });

    describe('unauthorized requests', () => {
      it('returns a status code of 401 if the current user is neither a mentor nor a mentee in the mentorship', async () => {
        const [mentee1, mentee2, mentor] = await Promise.all([
          createUser(),
          createUser(),
          createUser({
            roles: [Role.MENTOR],
          }),
        ]);
        const mentorship = await createMentorship({
          mentee: mentee1,
          mentor,
        });

        const token = getToken(mentee2);
        return request(server)
          .patch(`/mentorships/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(401);
      });
    });

    describe('successful requests', () => {
      it('allows a mentor in the mentorship to approve/reject', async () => {
        const [mentee, mentor] = await Promise.all([
          createUser(),
          createUser(),
        ]);
        const mentorship = await createMentorship({
          mentor: mentor._id,
          mentee: mentee._id,
        });

        const token = getToken(mentor);
        const { body } = await request(server)
          .patch(`/mentorships/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(200);
        expect(body.status).toBe(Status.APPROVED);

        const {
          body: { status, reason },
        } = await request(server)
          .patch(`/mentorships/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.REJECTED, reason: 'Other commitments' })
          .expect(200);
        expect(status).toBe(Status.REJECTED);
        expect(reason).toBe('Other commitments');
      });

      it('allows a mentee in the mentorship to cancel', async () => {
        const [mentee, mentor] = await Promise.all([
          createUser(),
          createUser(),
        ]);
        const mentorship = await createMentorship({
          mentor: mentor._id,
          mentee: mentee._id,
        });

        const token = getToken(mentee);
        const { body } = await request(server)
          .patch(`/mentorships/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.CANCELLED })
          .expect(200);
        expect(body.status).toBe(Status.CANCELLED);
      });
    });
  });
});
