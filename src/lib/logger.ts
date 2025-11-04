/**
 * Structured Logging Utility for Proofound Platform
 *
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured metadata
 * - Production-safe (no sensitive data)
 * - Integration-ready (can pipe to Sentry, Datadog, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error | unknown, context?: LogContext) => void;
}

/**
 * Configuration
 */
const config = {
  // In production, only log warnings and errors
  minLevel: (process.env.NODE_ENV === 'production' ? 'warn' : 'debug') as LogLevel,
  // Enable/disable logging completely
  enabled: process.env.NEXT_PUBLIC_ENABLE_LOGGING !== 'false',
  // Pretty print in development
  pretty: process.env.NODE_ENV === 'development',
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Color codes for console output (development only)
 */
const colors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

/**
 * Icons for each log level
 */
const icons = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return levelPriority[level] >= levelPriority[config.minLevel];
}

/**
 * Format timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Sanitize context to remove sensitive data
 */
function sanitizeContext(context?: LogContext): LogContext {
  if (!context) return {};

  const sanitized = { ...context };
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Format log output
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = getTimestamp();
  const sanitized = sanitizeContext(context);

  if (config.pretty) {
    // Pretty format for development
    const color = colors[level];
    const icon = icons[level];
    const contextStr =
      Object.keys(sanitized).length > 0
        ? `\n  ${JSON.stringify(sanitized, null, 2).split('\n').join('\n  ')}`
        : '';

    return `${color}${icon} [${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}${contextStr}`;
  } else {
    // JSON format for production (can be parsed by log aggregators)
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitized,
    });
  }
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const formatted = formatLog(level, message, context);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

/**
 * Create a logger instance
 */
export function createLogger(namespace?: string): Logger {
  const addNamespace = (message: string) => (namespace ? `[${namespace}] ${message}` : message);

  return {
    debug: (message: string, context?: LogContext) => {
      log('debug', addNamespace(message), context);
    },

    info: (message: string, context?: LogContext) => {
      log('info', addNamespace(message), context);
    },

    warn: (message: string, context?: LogContext) => {
      log('warn', addNamespace(message), context);
    },

    error: (message: string, error?: Error | unknown, context?: LogContext) => {
      const errorContext: LogContext = {
        ...context,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      };

      log('error', addNamespace(message), errorContext);

      // In production, also send to Sentry if available
      if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        try {
          const Sentry = require('@sentry/nextjs');
          if (error instanceof Error) {
            Sentry.captureException(error);
          }
        } catch (e) {
          // Sentry not available, ignore
        }
      }
    },
  };
}

/**
 * Default logger instance (no namespace)
 */
export const logger = createLogger();

/**
 * Export for convenience
 */
export default logger;
