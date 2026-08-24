// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://c8df40cf636191638ce605ebe2ceceac@o4511967544934400.ingest.de.sentry.io/4511967551946832',

  // Add Session Replay integration
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // Session Replay: 100% sample rate during testing/development to capture all sessions
  replaysSessionSampleRate: 1.0,

  // Sample 100% of sessions where errors occur
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
