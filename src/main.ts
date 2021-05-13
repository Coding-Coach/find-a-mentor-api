import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { MyLogger } from './logger';
dotenv.config();

import Config from './config';
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: Config.sentry.DSN });

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { version } from 'package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger(),
  });
  app.enableCors({ origin: process.env.CORS_ORIGIN || /codingcoach\.io$/ });
  const options = new DocumentBuilder()
    .setTitle('Coding Coach')
    .setDescription('A REST API for the coding coach platform')
    .setVersion(version)
    .addBearerAuth()
    .build();

  if (process.env.NODE_ENV !== 'production') {
    // We want to get the swagger docs only on development
    const document = SwaggerModule.createDocument(app, options);

    document.schemes = ['https', 'http'];
    fs.writeFileSync('./docs/cc-api-spec.json', JSON.stringify(document));

    SwaggerModule.setup('/docs', app, document);
  }
  console.log(`Server is up on port: ${process.env.PORT || 3000}`);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
