const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: false,
      ignoreErrors: [
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        'NetworkError',
        'Network request failed',
        'Failed to fetch',
        'Invalid login credentials',
        'User not found',
        'AbortError',
        'The user aborted a request',
      ],
      beforeSend(event) {
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
          return null;
        }
        if (!event.exception && !event.message) {
          return null;
        }
        return event;
      },
    });
  });
}
