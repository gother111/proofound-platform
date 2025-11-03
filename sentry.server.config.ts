import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  integrations: [Sentry.httpIntegration()],

  // Ignore common errors
  ignoreErrors: [
    // Database connection errors (transient)
    'connect ECONNREFUSED',
    'ECONNRESET',
    // Auth errors (handled by UI)
    'Invalid login credentials',
    'User not found',
    'JWT expired',
    // Supabase auth errors
    'Invalid Refresh Token',
    'refresh_token_not_found',
  ],

  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }

    // Add user context if available (avoid PII)
    if (event.user) {
      // Remove email and other PII, keep only ID
      event.user = {
        id: event.user.id,
      };
    }

    // Filter out events without error info
    if (!event.exception && !event.message) {
      return null;
    }

    return event;
  },

  // Add request data to events
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }

    return breadcrumb;
  },
});
