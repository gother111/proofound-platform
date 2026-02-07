# Sentry Error Monitoring Setup

## Overview

Sentry error monitoring has been integrated into the Proofound application to track and debug errors in production. This document covers setup, configuration, and usage.

## Configuration Files

### Core Config Files

1. **`instrumentation-client.ts`** - Client-side error tracking
   - Captures browser errors and exceptions
   - Session replay for error debugging
   - Browser tracing for performance monitoring

2. **`sentry.server.config.ts`** - Server-side error tracking
   - Captures API route errors
   - Server component errors
   - Database and external service errors

3. **`sentry.edge.config.ts`** - Edge runtime error tracking
   - Middleware errors
   - Edge function errors

4. **`instrumentation.ts`** - Next.js instrumentation
   - Loads Sentry before application code
   - Handles request errors globally

### Error Boundaries

Created multiple error boundary components for different use cases:

- **`ErrorBoundary`** - General-purpose error boundary with customizable fallback UI
- **`InlineErrorBoundary`** - Compact error boundary for inline sections
- **`FormErrorBoundary`** - Error boundary optimized for form components
- **`DataErrorBoundary`** - Error boundary for data tables and lists with retry functionality

### Where Error Boundaries Are Used

1. **Root Layout** (`src/app/layout.tsx`) - Catches all unhandled errors
2. **Profile Forms** (`src/components/profile/EditProfileModal.tsx`) - Form validation and submission errors
3. **Assignment Builder** (`src/components/matching/AssignmentBuilder.tsx`) - Multi-step wizard errors
4. **Message Thread** (`src/components/messaging/MessageThread.tsx`) - Real-time messaging errors

## Environment Variables

Add these to your `.env.local`:

```bash
# Sentry DSN (get from sentry.io project settings)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional: Enable debug logging in development
SENTRY_DEBUG=false

# Optional: Sentry organization and project for source map uploads
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## Setup Instructions

### 1. Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project and select "Next.js" as the platform
3. Copy the DSN from the project settings

### 2. Configure Environment

Add the DSN to your environment variables:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### 3. Deploy

The Sentry configuration is already integrated. Simply deploy your application and errors will automatically be reported.

## Error Sampling

To avoid overwhelming Sentry with too many events, sampling is configured:

### Production

- **Error sampling**: 100% (all errors captured)
- **Performance tracing**: 20% (1 in 5 requests)
- **Session replay**: 10% of sessions, 100% of error sessions

### Development

- **Errors**: Only captured if `SENTRY_DEBUG=true`
- **All other events**: Disabled to avoid noise

## Ignored Errors

The following errors are automatically filtered out:

### Client-side

- Browser extension errors
- Network errors (handled by UI)
- Auth errors (handled by UI)
- Abort errors

### Server-side

- Transient database connection errors
- Auth token expiration (expected)
- Invalid refresh tokens (handled)

## Privacy

To protect user privacy:

- **User emails** are NOT sent to Sentry
- **Only user IDs** are included in error context
- **PII is stripped** from all error reports
- **Request data** is sanitized before sending

## Alerting

To set up alerts:

1. Go to your Sentry project
2. Navigate to **Alerts** → **Create Alert**
3. Recommended alert rules:
   - New error first seen (immediate)
   - Error frequency > 10/minute (5 min)
   - Error affects > 100 users (15 min)
   - Performance degradation (30 min)

## Monitoring Dashboard

Key metrics to monitor:

1. **Error Rate** - Errors per minute/hour
2. **Affected Users** - Number of unique users experiencing errors
3. **Issue Frequency** - How often each issue occurs
4. **Performance** - API response times and page load speeds
5. **Session Replay** - Watch user sessions that encountered errors

## Testing

To test Sentry integration:

```typescript
// Add this to any component to test error capture
throw new Error('Test Sentry error');
```

Or use the Sentry test button (development only):

```typescript
import * as Sentry from '@sentry/nextjs';

<button onClick={() => Sentry.captureException(new Error('Test error'))}>
  Test Sentry
</button>
```

## Source Maps

Source maps are automatically uploaded to Sentry during production builds when `SENTRY_ORG` and `SENTRY_PROJECT` are configured. This allows you to see the original source code in error stack traces.

To configure:

1. Get auth token from Sentry: **Settings** → **Auth Tokens** → **Create Token**
2. Add to Vercel environment variables:
   ```
   SENTRY_AUTH_TOKEN=your-token
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-project
   ```

## Best Practices

1. **Wrap critical UI sections** with error boundaries
2. **Add user context** to errors when possible
3. **Use breadcrumbs** to add debugging context
4. **Set appropriate sampling rates** to control costs
5. **Configure alerts** for critical errors
6. **Review errors weekly** to identify patterns
7. **Fix high-frequency issues** first

## Troubleshooting

### Errors not appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify you're in production mode (development errors are filtered)
3. Check browser console for Sentry initialization errors
4. Ensure error is not in the ignore list

### Too many events

1. Increase sampling rates in config files
2. Add more errors to ignore lists
3. Set up rate limiting in Sentry project settings

### Source maps not working

1. Verify `SENTRY_AUTH_TOKEN` is set in Vercel
2. Check build logs for source map upload errors
3. Ensure `SENTRY_ORG` and `SENTRY_PROJECT` match Sentry project

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Boundaries in React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
