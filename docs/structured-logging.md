# Structured Logging Guide

## Overview

This document describes the structured logging system implemented in the Proofound application, including log levels, context management, request correlation, and migration from console.\* calls.

Launch note: `PRD_TECHNICAL_REQUIREMENTS.md` Section 7 is the canonical launch contract for logging, PII isolation, and audit-boundary rules. This guide must defer to that appendix where older examples imply broader observability exports.

## Logger Features

### Log Levels

The logging system supports four log levels:

| Level   | Usage                 | Example                                                |
| ------- | --------------------- | ------------------------------------------------------ |
| `debug` | Development debugging | `log.debug('cache.hit', { key })`                      |
| `info`  | General information   | `log.info('match.computed', { poolSize })`             |
| `warn`  | Warning conditions    | `log.warn('rate_limit.approaching', { remaining })`    |
| `error` | Error conditions      | `log.error('db.query.failed', { error: err.message })` |

**Log Level Configuration:**

- **Production**: `LOG_LEVEL=info` (default if not set)
- **Development**: `LOG_LEVEL=debug` (default in NODE_ENV=development)
- **Testing**: Set `LOG_LEVEL=error` to reduce noise

### Basic Usage

```typescript
import { log } from '@/lib/log';

// Info log
log.info('user.signup', { userId, persona: 'individual' });

// Warning log
log.warn('api.slow_response', { duration: 2500, endpoint: '/api/match' });

// Error log
log.error('payment.failed', {
  error: err.message,
  userId,
  amount,
});

// Debug log (only in development)
log.debug('cache.debug', { operation: 'set', key, ttl });
```

## Request Correlation

Every HTTP request is assigned a unique request ID that flows through all logs during that request.

### Request ID Generation

Request IDs are generated in the middleware and stored in AsyncLocalStorage:

```typescript
// middleware.ts
const requestId = request.headers.get('x-request-id') || nanoid(12);
```

### Request ID in Logs

All logs automatically include the request ID when available:

```json
{
  "level": "info",
  "event": "match.computed",
  "timestamp": "2025-01-03T10:30:00.000Z",
  "requestId": "abc123xyz789",
  "userId": "user-uuid",
  "poolSize": 50
}
```

### Client-Side Request Tracking

Clients receive the request ID in response headers:

```typescript
// Response headers
x-request-id: abc123xyz789

// Client can send it back in subsequent requests for correlation
fetch('/api/endpoint', {
  headers: {
    'x-request-id': 'abc123xyz789'
  }
});
```

## Context Management

### Automatic Context

The middleware automatically adds context to all logs:

- **requestId**: Unique request identifier
- **userId**: Authenticated user ID (if available)
- **path**: Request path
- **method**: HTTP method (GET, POST, etc.)

### Manual Context

You can add additional context using `withContext`:

```typescript
// Add context for a specific operation
const contextLogger = log.withContext({
  assignmentId: '123',
  orgId: 'org-456',
});

contextLogger.info('assignment.published', { role: 'Engineer' });
// Output includes: requestId, userId, assignmentId, orgId
```

### Nested Context

Context can be nested and merged:

```typescript
const userLogger = log.withContext({ userId: 'user-123' });
const orgLogger = userLogger.withContext({ orgId: 'org-456' });

orgLogger.info('event.name', { data: 'value' });
// Includes both userId and orgId
```

## PII Protection

The logger automatically removes common PII fields from logs:

**Automatically Removed:**

- `email`
- `name`
- `displayName`
- `userEmail` (in production only)

**Guidelines:**

- Never log full email addresses
- Never log user names or display names
- Never log precise locations (use city/country only)
- Never log photos or avatars
- Use user IDs instead of identifiable information

**Good Example:**

```typescript
log.info('user.profile.updated', {
  userId: 'abc-123',
  fieldsUpdated: ['tagline', 'location'],
});
```

**Bad Example:**

```typescript
log.info('user.profile.updated', {
  email: 'john@example.com', // ❌ PII
  name: 'John Doe', // ❌ PII
  userId: 'abc-123',
});
```

## Log Output Format

All logs are output as JSON for easy parsing:

```json
{
  "level": "info",
  "event": "match.profile.computed",
  "timestamp": "2025-01-03T10:30:00.000Z",
  "requestId": "abc123xyz789",
  "userId": "user-uuid-123",
  "path": "/api/core/matching/profile",
  "method": "POST",
  "poolSize": 50,
  "resultCount": 10,
  "durationMs": 145
}
```

## Event Naming Conventions

Use dot-separated namespaces for event names:

**Pattern:** `<domain>.<action>.<status>`

**Examples:**

```typescript
// Match domain
log.info('match.profile.computed', { ... });
log.error('match.profile.failed', { ... });
log.warn('match.pool.empty', { ... });

// User domain
log.info('user.signup.success', { ... });
log.error('user.signup.failed', { ... });
log.warn('user.verification.pending', { ... });

// Middleware domain
log.warn('middleware.admin.access_denied', { ... });
log.warn('middleware.persona.access_denied', { ... });

// Database domain
log.error('db.query.failed', { ... });
log.warn('db.connection.slow', { ... });
```

## Migration from console.\*

### Migration Pattern

**Before:**

```typescript
console.log('User signed up:', userId);
console.error('Database error:', err);
console.warn('Rate limit approaching');
```

**After:**

```typescript
log.info('user.signup', { userId });
log.error('db.query.failed', { error: err.message, stack: err.stack });
log.warn('rate_limit.approaching', { remaining: 5 });
```

### Migration Checklist

1. ✅ Import log utility: `import { log } from '@/lib/log';`
2. ✅ Replace `console.log` → `log.info`
3. ✅ Replace `console.error` → `log.error`
4. ✅ Replace `console.warn` → `log.warn`
5. ✅ Convert string messages to event names (dot-separated)
6. ✅ Move context to metadata object
7. ✅ Remove PII from metadata
8. ✅ Test that logs are output correctly

### Common Patterns

**Pattern 1: Simple log message**

```typescript
// Before
console.log('Match computed successfully');

// After
log.info('match.computed.success');
```

**Pattern 2: Log with data**

```typescript
// Before
console.log('Match computed:', poolSize, 'candidates');

// After
log.info('match.computed', { poolSize });
```

**Pattern 3: Error logging**

```typescript
// Before
console.error('Failed to compute match:', err);

// After
log.error('match.compute.failed', {
  error: err.message,
  stack: err.stack,
});
```

**Pattern 4: Conditional logging**

```typescript
// Before
if (duration > 1000) {
  console.warn('Slow query detected:', duration, 'ms');
}

// After
if (duration > 1000) {
  log.warn('db.query.slow', { duration });
}
```

## Environment Variables

```bash
# Set log level
LOG_LEVEL=info  # Options: debug, info, warn, error

# Development (default)
LOG_LEVEL=debug

# Production (default)
LOG_LEVEL=info

# Testing (recommended)
LOG_LEVEL=error
```

## Integration with Monitoring Tools

### Vercel Logs

Structured logs are automatically ingested by Vercel:

1. Go to Vercel dashboard
2. Select your project
3. Navigate to "Logs"
4. Filter by `level`, `event`, `userId`, `requestId`

### Log Aggregation

For launch, use Vercel logs plus the in-app structured logger. Additional log aggregation platforms are post-launch options only and must preserve the same PII restrictions.

**Datadog (post-launch only, non-canonical for MVP launch):**

```typescript
// Custom integration in log.ts
if (process.env.DATADOG_API_KEY) {
  // Send logs to Datadog
}
```

**LogDNA/Mezmo (post-launch only, non-canonical for MVP launch):**

```bash
# Install LogDNA agent
npm install @logdna/logger
```

**CloudWatch:**

```typescript
// AWS CloudWatch integration
import { CloudWatchLogs } from 'aws-sdk';
```

## Querying Logs

### Local Development

```bash
# View all logs
npm run dev 2>&1 | grep -v '_next'

# Filter by level
npm run dev 2>&1 | grep '"level":"error"'

# Filter by event
npm run dev 2>&1 | grep '"event":"match.computed"'

# Filter by user
npm run dev 2>&1 | grep '"userId":"abc-123"'

# Filter by request
npm run dev 2>&1 | grep '"requestId":"xyz-789"'
```

### Production (Vercel)

```bash
# Using Vercel CLI
vercel logs --follow

# Filter by function
vercel logs --follow --filter="api/match"

# Download logs for analysis
vercel logs > logs.json
cat logs.json | jq '.[] | select(.level == "error")'
```

## Performance Considerations

**Async Logging:**

```typescript
// Current: Synchronous (blocking)
log.info('event', { data });

// Future: Async (non-blocking)
await log.infoAsync('event', { data });
```

**Sampling:**

```typescript
// Sample debug logs (10%)
if (level === 'debug' && Math.random() > 0.1) {
  return;
}
```

**Buffering:**

```typescript
// Batch logs and flush periodically
const logBuffer = [];
setInterval(() => {
  if (logBuffer.length > 0) {
    console.log(logBuffer.join('\n'));
    logBuffer.length = 0;
  }
}, 1000);
```

## Best Practices

### DO

✅ Use dot-separated event names
✅ Include relevant context in metadata
✅ Log errors with error messages and stack traces
✅ Use appropriate log levels
✅ Log important business events
✅ Include performance metrics (duration, counts)
✅ Log authentication and authorization events

### DON'T

❌ Log PII (emails, names, locations, raw IPs, raw user-agent strings)
❌ Log sensitive data (passwords, tokens)
❌ Log excessively in hot paths
❌ Use string concatenation in event names
❌ Log success for every trivial operation
❌ Include entire objects (log specific fields)
❌ Log at debug level in production

## Examples

### API Route Logging

```typescript
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await requireAuth();
    const body = await request.json();

    log.info('api.request.started', {
      endpoint: '/api/match/profile',
      userId: user.id,
    });

    const result = await computeMatches(user.id, body);

    const duration = Date.now() - startTime;
    log.info('api.request.completed', {
      endpoint: '/api/match/profile',
      duration,
      resultCount: result.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error('api.request.failed', {
      endpoint: '/api/match/profile',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Database Operation Logging

```typescript
async function queryDatabase(sql: string, params: any[]) {
  const startTime = Date.now();

  try {
    const result = await db.query(sql, params);
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      log.warn('db.query.slow', {
        duration,
        rowCount: result.rows.length,
      });
    }

    return result;
  } catch (error) {
    log.error('db.query.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

### Background Job Logging

```typescript
async function processMatchingJob(jobId: string) {
  log.info('job.started', { jobId, type: 'matching' });

  try {
    const result = await performMatching();

    log.info('job.completed', {
      jobId,
      type: 'matching',
      processedCount: result.count,
      duration: result.duration,
    });
  } catch (error) {
    log.error('job.failed', {
      jobId,
      type: 'matching',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

## Troubleshooting

### Logs Not Appearing

1. **Check log level:**

   ```bash
   echo $LOG_LEVEL
   ```

2. **Verify logger import:**

   ```typescript
   import { log } from '@/lib/log'; // Correct
   import { log } from './log'; // May be wrong
   ```

3. **Check NODE_ENV:**
   ```bash
   echo $NODE_ENV
   ```

### Missing Context

1. **Ensure middleware is running:**
   - Check middleware matcher config
   - Verify route is not excluded

2. **Check AsyncLocalStorage:**
   ```typescript
   const context = logContext.getStore();
   console.log('Current context:', context);
   ```

### Performance Issues

1. **Reduce log volume:**
   - Increase log level in production
   - Add sampling for debug logs

2. **Optimize metadata:**
   - Only include necessary fields
   - Avoid logging large objects

## Future Enhancements

1. **Async Logging** - Non-blocking log writes
2. **Log Sampling** - Reduce volume in high-traffic scenarios
3. **Custom Transports** - Send logs to multiple destinations
4. **Log Rotation** - Manage log file size
5. **Metrics Extraction** - Extract metrics from logs automatically
6. **Distributed Tracing** - OpenTelemetry integration

## Resources

- [AsyncLocalStorage Documentation](https://nodejs.org/api/async_context.html)
- [JSON Logging Best Practices](https://github.com/pinojs/pino/blob/master/docs/best-practices.md)
- [Vercel Logs Documentation](https://vercel.com/docs/observability/runtime-logs)
