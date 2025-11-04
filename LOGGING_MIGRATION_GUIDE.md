# 📝 Logging Migration Guide

## Overview

The Proofound platform now uses **structured logging** instead of `console.log` statements. This provides:

- ✅ **Log levels** (debug, info, warn, error)
- ✅ **Structured metadata** (context objects)
- ✅ **Production safety** (auto-redacts sensitive data)
- ✅ **Integration ready** (Sentry, Datadog, etc.)
- ✅ **Environment-aware** (verbose in dev, concise in prod)

---

## Quick Start

### 1. Import the Logger

```typescript
import { createLogger } from '@/lib/logger';

// Create a namespaced logger for your module
const logger = createLogger('MyComponent');
```

### 2. Replace console statements

**Before:**

```typescript
console.log('User logged in:', userId);
console.error('Failed to save:', error);
console.warn('Deprecated API used');
```

**After:**

```typescript
logger.info('User logged in', { userId });
logger.error('Failed to save data', error);
logger.warn('Deprecated API used');
```

---

## Migration Examples

### Example 1: Debug Logging

**Before:**

```typescript
console.log('🔍 [Expertise Page] User ID:', user.id);
console.log('🔍 [Expertise Page] Skills query result:', {
  count: userSkills?.length || 0,
  error: skillsError?.message,
});
```

**After:**

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('ExpertisePage');

logger.debug('Fetching expertise data for user', { userId: user.id });
logger.debug('Skills query completed', {
  count: userSkills?.length || 0,
  hasError: !!skillsError,
  errorMessage: skillsError?.message,
});
```

### Example 2: Error Logging

**Before:**

```typescript
try {
  await saveData(data);
} catch (error) {
  console.error('Error saving data:', error);
}
```

**After:**

```typescript
try {
  await saveData(data);
} catch (error) {
  logger.error('Failed to save data', error, { dataId: data.id });
}
```

### Example 3: Warning Logging

**Before:**

```typescript
if (config.deprecated) {
  console.warn('Using deprecated config option:', config.option);
}
```

**After:**

```typescript
if (config.deprecated) {
  logger.warn('Deprecated config option in use', { option: config.option });
}
```

### Example 4: Info Logging

**Before:**

```typescript
console.log('✅ Assignment created successfully', assignment.id);
```

**After:**

```typescript
logger.info('Assignment created successfully', {
  assignmentId: assignment.id,
  orgId: assignment.orgId,
});
```

---

## Log Levels

### `debug` - Development/Troubleshooting

- **Use for:** Detailed debugging information
- **Visible in:** Development only
- **Hidden in:** Production

```typescript
logger.debug('Processing user input', { inputLength: input.length });
```

### `info` - Important Events

- **Use for:** Successful operations, milestones
- **Visible in:** Development and production
- **Examples:** User login, data saved, email sent

```typescript
logger.info('User logged in successfully', { userId, loginMethod: 'email' });
```

### `warn` - Potential Issues

- **Use for:** Deprecated features, non-critical errors
- **Visible in:** Development and production
- **Examples:** Slow queries, deprecation warnings

```typescript
logger.warn('Query took longer than expected', {
  query: 'fetchUsers',
  duration: 3500,
  threshold: 1000,
});
```

### `error` - Critical Problems

- **Use for:** Errors, exceptions, failures
- **Visible in:** Development and production
- **Auto-sends to:** Sentry (in production)

```typescript
logger.error('Failed to process payment', error, {
  userId,
  amount,
  paymentMethod,
});
```

---

## Best Practices

### 1. ✅ Use Structured Data

**Good:**

```typescript
logger.info('Order processed', {
  orderId: order.id,
  totalAmount: order.total,
  itemCount: order.items.length,
});
```

**Bad:**

```typescript
logger.info(`Order ${order.id} processed with ${order.items.length} items`);
```

### 2. ✅ Don't Log Sensitive Data

The logger auto-redacts common sensitive fields, but be careful:

**Auto-redacted fields:**

- `password`
- `token`
- `secret`
- `apiKey`
- `accessToken`
- `refreshToken`

**Good:**

```typescript
logger.info('User updated', { userId, email: user.email });
```

**Bad:**

```typescript
logger.info('User updated', { password: user.password }); // ← Will be redacted to [REDACTED]
```

### 3. ✅ Use Namespaces

Create a logger per module/component:

```typescript
// In UserProfile.tsx
const logger = createLogger('UserProfile');

// In PaymentProcessor.ts
const logger = createLogger('PaymentProcessor');

// In MatchingEngine.ts
const logger = createLogger('MatchingEngine');
```

This makes logs easy to filter:

```
[UserProfile] User data loaded
[PaymentProcessor] Payment initiated
[MatchingEngine] Calculating PAC score
```

### 4. ✅ Include Context

**Good:**

```typescript
logger.error('Database query failed', error, {
  table: 'users',
  operation: 'SELECT',
  userId,
});
```

**Bad:**

```typescript
logger.error('Query failed', error);
```

---

## Configuration

### Environment Variables

```bash
# Disable all logging
NEXT_PUBLIC_ENABLE_LOGGING=false

# Set minimum log level (debug | info | warn | error)
# In production, defaults to 'warn'
# In development, defaults to 'debug'
```

### Production Behavior

In production:

- ✅ Only `warn` and `error` logs are output
- ✅ Logs are formatted as JSON for log aggregators
- ✅ Sensitive data is auto-redacted
- ✅ Errors are sent to Sentry

### Development Behavior

In development:

- ✅ All log levels output (debug, info, warn, error)
- ✅ Pretty-printed with colors and icons
- ✅ Full stack traces
- ✅ Readable timestamps

---

## Migration Checklist

### Files with Most Console Statements

Based on analysis, these files have the most console statements to migrate:

1. ✅ **`src/app/app/i/expertise/page.tsx`** (11 statements) - COMPLETED
2. ⏳ `src/app/app/i/expertise/components/AddSkillDrawer.tsx` (7 statements)
3. ⏳ `src/app/app/i/expertise/components/EditSkillWindow.tsx` (12 statements)
4. ⏳ API routes in `src/app/api/` (~200+ statements)
5. ⏳ Other component files (~50+ statements)

### Automated Migration Script

To help migrate remaining files, you can use this find-replace pattern:

```bash
# Find all console.log statements
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" -n

# Find all console.error statements
grep -r "console\.error" src/ --include="*.ts" --include="*.tsx" -n

# Find all console.warn statements
grep -r "console\.warn" src/ --include="*.ts" --include="*.tsx" -n
```

### Manual Migration Steps

For each file:

1. **Add logger import:**

   ```typescript
   import { createLogger } from '@/lib/logger';
   const logger = createLogger('ComponentName');
   ```

2. **Replace console.log → logger.debug/info:**
   - Use `debug` for detailed debugging
   - Use `info` for important events

3. **Replace console.error → logger.error:**

   ```typescript
   // Before
   console.error('Error:', error);

   // After
   logger.error('Operation failed', error);
   ```

4. **Replace console.warn → logger.warn:**

   ```typescript
   // Before
   console.warn('Warning:', message);

   // After
   logger.warn('Deprecation warning', { feature: 'oldAPI' });
   ```

5. **Extract metadata into context object:**

   ```typescript
   // Before
   console.log('User:', user.id, 'Email:', user.email);

   // After
   logger.info('User details', { userId: user.id, email: user.email });
   ```

---

## Testing

### Verify Logging Works

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('Test');

logger.debug('This is a debug message', { foo: 'bar' });
logger.info('This is an info message');
logger.warn('This is a warning');
logger.error('This is an error', new Error('Test error'));
```

**Expected output (development):**

```
🔍 [DEBUG] 2025-11-04T15:30:00.000Z - [Test] This is a debug message
  {
    "foo": "bar"
  }
ℹ️ [INFO] 2025-11-04T15:30:00.001Z - [Test] This is an info message
⚠️ [WARN] 2025-11-04T15:30:00.002Z - [Test] This is a warning
❌ [ERROR] 2025-11-04T15:30:00.003Z - [Test] This is an error
  {
    "error": {
      "name": "Error",
      "message": "Test error",
      "stack": "..."
    }
  }
```

---

## FAQ

### Q: Should I remove all console.log statements?

**A:** Yes, replace them with the structured logger. This provides:

- Better debugging in production
- Automatic error tracking
- Searchable, structured logs
- Privacy protection (auto-redaction)

### Q: What about console.table, console.time, etc.?

**A:** These are fine for local development but should not be committed. Use the logger for permanent logging.

### Q: How do I view logs in production?

**A:** Logs are sent to:

1. **Vercel Logs** (if deployed on Vercel)
2. **Sentry** (for errors)
3. **stdout** (JSON format, can be piped to any log aggregator)

### Q: Can I disable logging for specific components?

**A:** Yes, check the `enabled` flag before logging:

```typescript
const logger = createLogger('VerboseComponent');

if (process.env.NODE_ENV === 'development') {
  logger.debug('Only in dev', { data });
}
```

---

## Summary

### Before (Old Way)

```typescript
console.log('User ID:', userId);
console.error('Error saving:', error);
```

### After (New Way)

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('MyComponent');

logger.info('User authenticated', { userId });
logger.error('Failed to save data', error, { operation: 'save' });
```

---

## Next Steps

1. ✅ Logger utility created (`src/lib/logger.ts`)
2. ✅ Expertise page migrated (example implementation)
3. ⏳ Migrate remaining files (use this guide)
4. ⏳ Update `.env` if needed (logging config)
5. ⏳ Test in development and staging

---

**Created:** November 4, 2025
**Status:** Ready to use
**Remaining:** ~270 console statements to migrate (optional, can be done incrementally)
