import * as mongoose from 'mongoose';
import { Test } from '@nestjs/testing';
import { HttpServer, INestApplication } from '@nestjs/common';

import { AppModule } from '../../src/app.module';
import { EmailService } from '../../src/modules/email/email.service';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

type Testkit = () => {
  emailService: { [k in keyof EmailService]?: jest.SpyInstance };
  bootstrap: () => Promise<{ app: INestApplication; server: HttpServer }>;
  beforeEach: () => Promise<void>;
  teardown: () => Promise<void>;
};

export const createTestkit: Testkit = () => {
  let app: INestApplication;
  let server: HttpServer;

  const emailService = {
    sendLocalTemplate: jest.fn(),
  };

  const bootstrap = async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(emailService)
      .compile();

    app = module.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    return { app, server };
  };

  const teardown = async () => {
    await app.close();
    await mongoose.connection.close();
  };

  const beforeEach = async () => {
    await mongoose.connection.dropDatabase();
    emailService.sendLocalTemplate.mockClear();
  };

  return {
    emailService,
    beforeEach,
    bootstrap,
    teardown,
  };
};
