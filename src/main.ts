import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({origin: process.env.CORS_ORIGIN || 'https://mentors.codingcoach.io'});
  const options = new DocumentBuilder()
    .setTitle('Coding Coach')
    .setDescription('A REST API for the coding coach platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  if (process.env.NODE_ENV !== 'production') {
    // We want to get the swagger docs only on development
    const document = SwaggerModule.createDocument(app, options);

    document.schemes = ['https', 'http'];
    fs.writeFileSync('./docs/cc-api-spec.json', JSON.stringify(document));
    
    SwaggerModule.setup('/docs', app, document);
  }


  await app.listen(process.env.PORT || 3000);
}
bootstrap();
