// Sentry MUST be initialized before any other import (auto-instrumentation hooks)
import '@/instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import { GlobalHttpExceptionFilter } from '@/common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limit for large XML/CSV feed uploads (up to 100MB)
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  // Security Headers via Helmet (relaxed CSP for Swagger UI)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Global Exception Filter
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS Configuration (Dynamic whitelist supporting Tauri v2 macOS/Windows/Linux & Web)
  const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  const defaultAllowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:1420',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:1420',
    'tauri://localhost',
    'http://tauri.localhost',
    'https://tauri.localhost',
    ...configuredOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile/desktop native HTTP) or null (WebKit opaque origins)
      if (!origin || origin === 'null') {
        return callback(null, true);
      }
      if (
        defaultAllowedOrigins.has(origin) ||
        origin.startsWith('tauri://') ||
        origin.endsWith('.localhost') ||
        origin.endsWith('.up.railway.app') ||
        origin.endsWith('.smartfeed.studio')
      ) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SmartFeed Studio API')
    .setDescription(
      'Central REST API with Decoupled CQRS Architecture for SmartFeed Studio Monorepo',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful Shutdown Hooks (SIGTERM/SIGINT)
  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 SmartFeed Studio API running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
