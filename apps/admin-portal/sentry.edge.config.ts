// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://c8df40cf636191638ce605ebe2ceceac@o4511967544934400.ingest.de.sentry.io/4511967551946832',
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'production',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  beforeSend(event) {
    if (process.env.NODE_ENV !== 'production') return null;
    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
