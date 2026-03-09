import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

import './telemetry';

const logger = new Logger('Process');

process.on('unhandledRejection', (reason: unknown) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`, error.stack);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.setGlobalPrefix('api', {
    exclude: ['v1/(.*)'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
