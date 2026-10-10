import * as Sentry from '@sentry/nestjs';
import { config as loadEnv } from 'dotenv';

/**
 * Sentry bootstrap for the NestJS API.
 *
 * MUST be imported before any other module in `main.ts` so Sentry can
 * auto-instrument HTTP, Express, Prisma (pg) and other libraries.
 *
 * Safe by default:
 * - No `SENTRY_DSN` → SDK is not initialized (zero overhead, zero network).
 * - `NODE_ENV=test` → disabled so E2E suites never emit events.
 * - `sendDefaultPii: false` → no IPs, cookies or auth headers are sent.
 */

// ConfigModule reads env files only when AppModule is evaluated (after this file),
// so load the same files here. Existing process env (Railway/Docker) always wins.
loadEnv({ path: ['.env.local', '.env'], quiet: true });

const dsn = process.env.SENTRY_DSN?.trim();
const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const isTest = process.env.NODE_ENV === 'test';

function parseSampleRate(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
}

if (dsn && !isTest) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE || process.env.RAILWAY_GIT_COMMIT_SHA || undefined,
    sendDefaultPii: false,
    tracesSampleRate: parseSampleRate(
      process.env.SENTRY_TRACES_SAMPLE_RATE,
      environment === 'production' ? 0.1 : 1.0,
    ),
  });
}
