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

  // Restrict JSON and URL-encoded body payloads to 2MB to prevent OOM DoS attacks (BE-14, CWE-400)
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: true }));

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
    'http://localhost:3001',
    'http://localhost:1421',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:1421',
    'tauri://localhost',
    'http://tauri.localhost',
    'https://tauri.localhost',
    ...configuredOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (native HTTP) or null strictly in non-production environments
      if (!origin || (origin === 'null' && process.env.NODE_ENV !== 'production')) {
        return callback(null, true);
      }
      if (
        defaultAllowedOrigins.has(origin) ||
        origin.startsWith('tauri://') ||
        origin.endsWith('.localhost') ||
        origin === 'https://smartfeed-admin-prod.up.railway.app' ||
        origin === 'http://smartfeed-admin-prod.up.railway.app' ||
        origin === 'https://smartfeedstudio-prod.up.railway.app' ||
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

  logger.log(`[BOOTSTRAP] SmartFeed Studio API running on: http://localhost:${port}/api`);
  logger.log(`[SWAGGER] Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error('Fatal bootstrap error:', err);
  process.exit(1);
});
