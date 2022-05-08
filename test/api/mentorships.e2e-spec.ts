import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { AppModule } from '../../src/app.module';
import { EmailService } from '../../src/modules/email/email.service';
import { Role, User } from '../../src/modules/common/interfaces/user.interface';
import {
  Mentorship,
  Status,
} from '../../src/modules/mentorships/interfaces/mentorship.interface';
import { createUser, createMentorship } from '../utils/seeder';
import { getToken } from '../utils/jwt';

describe('Mentorships', () => {
  let app: INestApplication;
  let server: unknown;
  let mentorId: string;
  const emailService: { [k in keyof EmailService]?: jest.SpyInstance } = {
    sendLocalTemplate: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(emailService)
      .compile();

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
    mentorId = mongoose.Types.ObjectId();
    emailService.sendLocalTemplate.mockClear();
  });

  describe('PUT /mentorships/:mentorId/requests/:id', () => {
    describe('unauthenticated requests', () => {
      it('returns a status code of 401', async () => {
        return request(server)
          .put('/mentorships/1234/requests/abc')
          .send({ status: Status.APPROVED, reason: '' })
          .expect(401);
      });
    });

    it('returns a status code of 404 if the mentorship is not found', () => {
      const id = mongoose.Types.ObjectId();
      const token = getToken();

      return request(server)
        .put(`/mentorships/${mentorId}/requests/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: Status.APPROVED })
        .expect(404);
    });

    describe('bad requests - returns a status code of 400', () => {
      it('if the payload is invalid', () => {
        const id = mongoose.Types.ObjectId();
        const token = getToken();
        return request(server)
          .put(`/mentorships/${mentorId}/requests/${id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
      });

      it('if the mentorship id is invalid', () => {
        const token = getToken();
        return request(server)
          .put(`/mentorships/${mentorId}/requests/abc`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(400);
      });

      it('if the current user is a mentee in the mentorship and the status is not cancelled', async () => {
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
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(400);
      });

      it('if the current user is a mentor in the mentorship and the status is not allowed to be updated by a mentor', async () => {
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
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.CANCELLED })
          .expect(400);
      });
    });

    describe('unauthorized requests - returns a status code of 401', () => {
      it('if the current user has not verified their email', () => {
        const token = getToken({ auth0Id: '1234' }, false);
        return request(server)
          .put(`/mentorships/1234/requests/5678`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(401, {
            success: false,
            errors: ['Please verify your email address'],
          });
      });

      it('if the current user is neither a mentor nor a mentee in the mentorship', async () => {
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
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(401);
      });
    });

    describe('successful requests', () => {
      let mentor: User;
      let mentee: User;
      let mentorship: Mentorship;

      beforeEach(async () => {
        [mentee, mentor] = await Promise.all([createUser(), createUser()]);
        mentorship = await createMentorship({
          mentor: mentor._id,
          mentee: mentee._id,
        });
      });

      it('allows a mentor in the mentorship to approve/reject', async () => {
        const token = getToken(mentor);
        const { body } = await request(server)
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(200);
        expect(emailService.sendLocalTemplate).toHaveBeenCalledTimes(1);
        expect(emailService.sendLocalTemplate).toHaveBeenCalledWith({
          data: {
            contactURL: `mailto:${mentor.email}`,
            menteeName: mentee.name.split(' ')[0],
            mentorName: mentor.name,
            openRequests: 0,
          },
          name: 'mentorship-accepted',
          subject: 'Mentorship Approved 👏',
          to: mentee.email,
        });

        expect(body.mentorship.status).toBe(Status.APPROVED);

        emailService.sendLocalTemplate.mockClear();

        const {
          body: {
            mentorship: { status, reason },
          },
        } = await request(server)
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.REJECTED, reason: 'Other commitments' })
          .expect(200);
        expect(status).toBe(Status.REJECTED);
        expect(reason).toBe('Other commitments');
        expect(emailService.sendLocalTemplate).toHaveBeenCalledTimes(1);
      });

      it('should ask mentee to cancel other request when the mentor approves', async () => {
        const mentor2 = await createUser();
        await createMentorship({
          mentor: mentor2._id,
          mentee: mentee._id,
        });

        const token = getToken(mentor);
        const { body } = await request(server)
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(200);
        expect(emailService.sendLocalTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              openRequests: 1,
            }),
          }),
        );
        expect(body.mentorship.status).toBe(Status.APPROVED);
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
        const reason = `I've already found a mentor`;
        const { body } = await request(server)
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.CANCELLED, reason })
          .expect(200);

        expect(emailService.sendLocalTemplate).toHaveBeenNthCalledWith(1, {
          name: 'mentorship-cancelled',
          to: mentor.email,
          subject: 'Mentorship Cancelled',
          data: {
            menteeName: mentee.name,
            mentorName: mentor.name,
            reason,
          },
        });
        expect(body.mentorship.status).toBe(Status.CANCELLED);
      });

      it('allows an admin to update the mentorship', async () => {
        const [mentee, mentor, admin] = await Promise.all([
          createUser(),
          createUser(),
          createUser({
            roles: [Role.ADMIN],
          }),
        ]);
        const mentorship = await createMentorship({
          mentor: mentor._id,
          mentee: mentee._id,
        });

        const token = getToken(admin);
        const { body } = await request(server)
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.APPROVED })
          .expect(200);
        expect(emailService.sendLocalTemplate).toHaveBeenCalledTimes(1);
        expect(body.mentorship.status).toBe(Status.APPROVED);

        emailService.sendLocalTemplate.mockClear();

        const {
          body: {
            mentorship: { status, reason },
          },
        } = await request(server)
          .put(`/mentorships/${mentor._id}/requests/${mentorship._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: Status.REJECTED, reason: 'Lack of time' })
          .expect(200);
        expect(status).toBe(Status.REJECTED);
        expect(reason).toBe('Lack of time');
        expect(emailService.sendLocalTemplate).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('POST /mentorships/:mentorId/apply', () => {
    it('returns a status code of 400 if user has reached the maximum of allowed open requests', async () => {
      const sendMentorshipRequest = (mentor, mentee) => {
        const token = getToken(mentee);
        const field = '1'.repeat(31);

        return request(server)
          .post(`/mentorships/${mentor._id}/apply`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            expectation: field,
            message: field,
            background: field,
          });
      };

      const roles = [Role.MENTOR];
      const [mentee, ...mentors] = await Promise.all([
        createUser(),
        createUser({ roles }),
        createUser({ roles }),
        createUser({ roles }),
        createUser({ roles }),
        createUser({ roles }),
        createUser({ roles }),
      ]);

      const [lastMentor] = mentors.splice(-1);
      await Promise.all(
        mentors.map((mentor) =>
          sendMentorshipRequest(mentor, mentee).expect({ success: true }),
        ),
      );
      const {
        body: { message },
      } = await sendMentorshipRequest(lastMentor, mentee).expect(400);

      expect(message).toBe(
        'You reached the maximum of open requests. Please wait a little longer for responses or cancel some of the requests',
      );
    });
  });
});
