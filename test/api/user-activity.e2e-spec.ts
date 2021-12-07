import * as request from 'supertest';
import { createTestkit } from './testkit';
import { createMentorship, createUser } from '../utils/seeder';
import { HttpServer } from '@nestjs/common';

describe('User Activity', () => {
  let server: HttpServer;
  let testkit: ReturnType<typeof createTestkit>;

  beforeAll(async () => {
    testkit = createTestkit();
    ({ server } = await testkit.bootstrap());
  });

  afterAll(async () => {
    testkit.teardown();
  });

  beforeEach(async () => {
    await testkit.beforeEach();
  });

  describe('PUT /user-activity', () => {
    it('should send reminders to mentors when no one approved a mentorship from a certain mentee within 7 days', async () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      const [mentee, mentor1, mentor2, mentor3] = await Promise.all([
        createUser(),
        createUser(),
        createUser(),
        createUser(),
      ]);
      await createMentorship({
        mentor: mentor1._id,
        mentee: mentee._id,
        createdAt: sixDaysAgo,
      });
      await createMentorship({
        mentor: mentor2._id,
        mentee: mentee._id,
        createdAt: sixDaysAgo,
      });
      await createMentorship({
        mentor: mentor3._id,
        mentee: mentee._id,
        createdAt: sixDaysAgo,
      });

      await request(server).put(`/user-activity`).send().expect(200);
      expect(testkit.emailService.sendLocalTemplate).toHaveBeenCalledTimes(3);
    });
  });
});
