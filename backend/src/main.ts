import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';

import { AppModule } from './app.module.js';
import { required } from './common/config/env.config.js';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));

  const clientOrigin = required('CLIENT_URL');
  app.enableCors({
    origin: [clientOrigin],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  const port = required('PORT');
  const baseUrl = required('BASE_URL');

  await app.listen(port);
  logger.log(`🚀 Application is running on ${baseUrl}`);
}

bootstrap().catch(err => {
  logger.error('❌ Error during app bootstrap', err);
  process.exit(1);
});
