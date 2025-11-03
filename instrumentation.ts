/**
 * Next.js Instrumentation
 *
 * This file is loaded before any other code in the application
 * Used to initialize Sentry and other monitoring tools
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = async (err: unknown, request: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Request error:', err);
  }
};
