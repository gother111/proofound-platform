import * as Sentry from '@sentry/nextjs';

function scrubSentryEvent(event: Sentry.Event): Sentry.Event {
  if (event.user) {
    event.user = { id: event.user.id };
  }

  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
  }

  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Ignore common errors
  ignoreErrors: [
    // Network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // Auth errors (handled by UI)
    'Invalid login credentials',
    'User not found',
    'JWT expired',
  ],

  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }

    scrubSentryEvent(event);

    // Filter out events without error info
    if (!event.exception && !event.message) {
      return null;
    }

    return event;
  },
});
