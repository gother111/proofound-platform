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

    scrubSentryEvent(event);

    // Filter out events without error info
    if (!event.exception && !event.message) {
      return null;
    }

    // Detect security-related events
    const errorMessage = hint?.originalException?.toString() || event.message || '';
    const isSecurityEvent =
      errorMessage.includes('Security Event:') ||
      errorMessage.includes('RLS') ||
      errorMessage.includes('policy') ||
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('brute force') ||
      errorMessage.includes('SQL injection') ||
      event.tags?.security_event;

    if (isSecurityEvent) {
      // Tag as security incident
      event.tags = {
        ...event.tags,
        security_incident: true,
      };

      // Determine severity from message
      if (errorMessage.includes('CRITICAL') || errorMessage.includes('SQL injection')) {
        event.level = 'fatal';
        event.tags.security_severity = 'critical';
      } else if (
        errorMessage.includes('HIGH') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('RLS')
      ) {
        event.level = 'error';
        event.tags.security_severity = 'high';
      } else {
        event.level = 'warning';
        event.tags.security_severity = 'medium';
      }

      // Add security fingerprint for grouping
      event.fingerprint = event.fingerprint || [];
      event.fingerprint.push('security-incident');
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
