import * as Sentry from '@sentry/react';
import { isTauri } from './runtime';

const DEFAULT_SENTRY_DSN =
  'https://c8df40cf636191638ce605ebe2ceceac@o4511967544934400.ingest.de.sentry.io/4511967551946832';

let isInitialized = false;

export function initSentry(): void {
  if (isInitialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN || DEFAULT_SENTRY_DSN;
  if (!dsn) return;

  const isTest =
    import.meta.env.MODE === 'test' ||
    (typeof window !== 'undefined' &&
      Boolean((window as unknown as { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__));

  Sentry.init({
    dsn,
    enabled: Boolean(import.meta.env.PROD && !isTest),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Tracing
    tracesSampleRate: isTest ? 0 : 1.0,
    // Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE || 'production',
    initialScope: {
      tags: {
        app: 'desktop',
        platform: isTauri() ? 'tauri' : 'browser',
      },
    },
    // Prevent unhandled errors from breaking the local-first experience
    beforeSend(event) {
      if (isTest || !import.meta.env.PROD) return null; // Do not spam Sentry during dev or e2e runs
      return event;
    },
  });

  isInitialized = true;
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): string | undefined {
  if (!import.meta.env.PROD) {
    console.warn('[Sentry Dev Suppressed]', error, context);
    return undefined;
  }
  if (!isInitialized) {
    console.error('[Sentry Desktop Fallback]', error, context);
    return undefined;
  }
  return Sentry.captureException(error, { extra: context });
}

export function setSentryUser(user: { id: string; email?: string } | null): void {
  if (!isInitialized) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}

export function setSentryTag(key: string, value: string): void {
  if (!isInitialized) return;
  Sentry.setTag(key, value);
}

export { Sentry };
