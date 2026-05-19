import * as Sentry from '@sentry/nextjs';

// Next.js loads this file on the client before application code.
// Keep initialization side-effectful. Sentry's Next.js SDK may require
// router transition instrumentation hooks to be exported from this module.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

function readSamplingRate(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(1, Math.max(0, parsed));
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Privacy-first launch default: session replay is opt-in per target.
  replaysOnErrorSampleRate: readSamplingRate(
    process.env.NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE,
    0
  ),
  replaysSessionSampleRate: readSamplingRate(
    process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE,
    0
  ),

  integrations: [
    Sentry.replayIntegration({
      // Mask all text content, enable when needed for debugging
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Ignore common errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // Auth errors (handled by UI)
    'Invalid login credentials',
    'User not found',
    // Abort errors
    'AbortError',
    'The user aborted a request',
  ],

  beforeSend(event) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return null;
    }

    // Filter out events without error info
    if (!event.exception && !event.message) {
      return null;
    }

    if (event.user) {
      event.user = { id: event.user.id };
    }

    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.data;
    }

    return event;
  },
});
