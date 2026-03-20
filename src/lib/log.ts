/**
 * Structured logging utility for server-side events.
 *
 * Usage:
 *   log.info('match.compute', { assignmentId, poolSize, userId })
 *   log.error('match.failed', { error: err.message })
 *
 * With context:
 *   log.withContext({ requestId, userId }).info('event.name', { data })
 *
 * Never log PII (names, emails, photos, exact locations).
 */

import { AsyncLocalStorage } from 'async_hooks';

// Global context storage for request-scoped data
export const logContext = new AsyncLocalStorage<LogContext>();

export interface LogContext {
  requestId?: string;
  userId?: string;
  userEmail?: string; // Only for debugging, never in production logs
  path?: string;
  method?: string;
  userAgent?: string;
}

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug' | 'security_warning' | 'security_critical';
  event: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

const REDACTED_FILE_VALUE = '[REDACTED_FILE]';
const SENSITIVE_META_KEY_PATTERN =
  /(email|name|displayname|filename|originalfilename|filepath|storagepath|sourceurl)/i;
const FILE_VALUE_PATTERN = /\b[\w./-]+\.(pdf|doc|docx|txt|md|png|jpe?g|webp|csv|xls|xlsx)\b/i;

/**
 * Check if we should log at this level
 */
function shouldLog(
  level: 'info' | 'warn' | 'error' | 'debug' | 'security_warning' | 'security_critical'
): boolean {
  const logLevel =
    process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    security_warning: 3,
    security_critical: 4,
  };
  const currentLevel = levels[logLevel as keyof typeof levels] || levels.info;
  const messageLevel = levels[level];

  return messageLevel >= currentLevel;
}

function sanitizeMetaValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeMetaValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        if (SENSITIVE_META_KEY_PATTERN.test(key)) {
          return [key, REDACTED_FILE_VALUE];
        }

        return [key, sanitizeMetaValue(entry)];
      })
    );
  }

  if (typeof value === 'string' && FILE_VALUE_PATTERN.test(value)) {
    return REDACTED_FILE_VALUE;
  }

  return value;
}

/**
 * Format and output log entry
 */
function writeLog(
  level: 'info' | 'warn' | 'error' | 'debug' | 'security_warning' | 'security_critical',
  event: string,
  meta?: Record<string, unknown>
) {
  if (!shouldLog(level)) {
    return;
  }

  // Get context from async local storage
  const context = logContext.getStore();

  // Build log entry with context
  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(context?.requestId && { requestId: context.requestId }),
    ...(context?.userId && { userId: context.userId }),
    ...(context?.path && { path: context.path }),
    ...(context?.method && { method: context.method }),
    ...(meta ? (sanitizeMetaValue(meta) as Record<string, unknown>) : {}),
  };

  // Remove any PII that might have been accidentally included
  if (entry.email) delete entry.email;
  if (entry.userEmail && process.env.NODE_ENV === 'production') delete entry.userEmail;
  if (entry.name) delete entry.name;
  if (entry.displayName) delete entry.displayName;

  // Output based on level
  const output = JSON.stringify(entry);

  switch (level) {
    case 'debug':
      console.debug(output);
      break;
    case 'info':
      console.log(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
      console.error(output);
      break;
    case 'security_warning':
      console.warn('[SECURITY]', output);
      break;
    case 'security_critical':
      console.error('[SECURITY CRITICAL]', output);
      break;
  }
}

/**
 * Logger with context support
 */
export const log = {
  /**
   * Log info level message
   */
  info: (event: string, meta?: Record<string, unknown>) => {
    writeLog('info', event, meta);
  },

  /**
   * Log warning level message
   */
  warn: (event: string, meta?: Record<string, unknown>) => {
    writeLog('warn', event, meta);
  },

  /**
   * Log error level message
   */
  error: (event: string, meta?: Record<string, unknown>) => {
    writeLog('error', event, meta);
  },

  /**
   * Log debug level message (only in development)
   */
  debug: (event: string, meta?: Record<string, unknown>) => {
    writeLog('debug', event, meta);
  },

  /**
   * Log security warning (HIGH severity security event)
   */
  securityWarning: (event: string, meta?: Record<string, unknown>) => {
    writeLog('security_warning', event, meta);
  },

  /**
   * Log security critical (CRITICAL severity security event)
   */
  securityCritical: (event: string, meta?: Record<string, unknown>) => {
    writeLog('security_critical', event, meta);
  },

  /**
   * Create logger with additional context
   */
  withContext: (context: Partial<LogContext>) => {
    const existingContext = logContext.getStore() || {};
    const mergedContext = { ...existingContext, ...context };

    return {
      info: (event: string, meta?: Record<string, unknown>) =>
        logContext.run(mergedContext, () => writeLog('info', event, meta)),
      warn: (event: string, meta?: Record<string, unknown>) =>
        logContext.run(mergedContext, () => writeLog('warn', event, meta)),
      error: (event: string, meta?: Record<string, unknown>) =>
        logContext.run(mergedContext, () => writeLog('error', event, meta)),
      debug: (event: string, meta?: Record<string, unknown>) =>
        logContext.run(mergedContext, () => writeLog('debug', event, meta)),
      securityWarning: (event: string, meta?: Record<string, unknown>) =>
        logContext.run(mergedContext, () => writeLog('security_warning', event, meta)),
      securityCritical: (event: string, meta?: Record<string, unknown>) =>
        logContext.run(mergedContext, () => writeLog('security_critical', event, meta)),
    };
  },
};
