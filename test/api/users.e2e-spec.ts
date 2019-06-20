import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import '../config/env';
import { UsersModule } from '../../src/modules/users/users.module';
import { UsersService } from '../../src/modules/users/users.service';

describe('Users', () => {
  let app: INestApplication;
  let usersService = {findAll: () => [{ id: 1, name: 'John' }]};

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(UsersService)
      .useValue(usersService)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`GET /users`, () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect({
        success: true,
        data: usersService.findAll(),
      });
  });
});