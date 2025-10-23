import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import 'dotenv/config';
import { required } from './common/config/env.config.js';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  const clientOrigin = required('CLIENT_URL');
  app.enableCors({
    origin: clientOrigin,
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
