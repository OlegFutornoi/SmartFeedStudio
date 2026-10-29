# NestJS 11 Security & Validation Reference (/nestjs/docs.nestjs.com)

1. CORS Configuration:
   - Enable via `app.enableCors({ origin, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE'] })`.
2. ValidationPipe:
   - `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`.
   - Strips non-decorated properties and rejects unwhitelisted fields with 400 Bad Request.
3. Rate Limiting (`@nestjs/throttler`):
   - `ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60000, limit: 100 }] })` + `APP_GUARD` `ThrottlerGuard`.
4. Security Headers (`helmet`):
   - `app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))`.
5. Global Exception Filter:
   - `@Catch() GlobalHttpExceptionFilter implements ExceptionFilter`. Never leak raw Prisma error codes (`exception.code`) in production.
6. Payload Size Guard:
   - Restrict global JSON limit to `app.use(json({ limit: '2mb' }))`; use streaming S3 presigned uploads for feeds >2MB.
7. JWT Access Token Security:
   - Enforce short-lived access tokens (`expiresIn: '15m'`) with refresh token rotation.
