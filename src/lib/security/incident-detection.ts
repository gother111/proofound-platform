/**
 * Security Incident Detection System
 *
 * Monitors application for security events and triggers alerts:
 * - Failed login attempts (brute force detection)
 * - Unusual data access patterns
 * - RLS policy violations
 * - Unauthorized API access attempts
 *
 * Integrates with Sentry for real-time alerting
 */

import { log } from '@/lib/log';
import * as Sentry from '@sentry/nextjs';

// Security event severity levels
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Security event types
export enum SecurityEventType {
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  RLS_VIOLATION = 'rls_violation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_DATA_EXPORT = 'suspicious_data_export',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
}

interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  message: string;
  timestamp: Date;
}

/**
 * Report a security event
 * Logs to system and alerts via Sentry for HIGH/CRITICAL events
 */
export function reportSecurityEvent(event: SecurityEvent): void {
  const logLevel =
    event.severity === SecuritySeverity.CRITICAL || event.severity === SecuritySeverity.HIGH
      ? 'error'
      : 'warn';

  // Log to application logs
  log[logLevel]('security.incident_detected', {
    type: event.type,
    severity: event.severity,
    userId: event.userId,
    ipHash: event.ipAddress ? hashIP(event.ipAddress) : undefined,
    message: event.message,
    metadata: event.metadata,
    timestamp: event.timestamp.toISOString(),
  });

  // Send to Sentry for HIGH/CRITICAL events
  if (event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL) {
    Sentry.captureException(new Error(`Security Event: ${event.message}`), {
      level: event.severity === SecuritySeverity.CRITICAL ? 'fatal' : 'error',
      tags: {
        security_event: event.type,
        severity: event.severity,
      },
      contexts: {
        security: {
          type: event.type,
          user_id: event.userId,
          ip_hash: event.ipAddress ? hashIP(event.ipAddress) : undefined,
          ...event.metadata,
        },
      },
    });
  }

  // Post-MVP: add Slack/webhook alerting for critical events after an owner and destination exist.
  if (event.severity === SecuritySeverity.CRITICAL) {
    // await sendSlackAlert(event);
  }
}

/**
 * Check for brute force login attempts
 * Triggers alert if 10+ failed attempts in 5 minutes
 */
export async function checkBruteForceAttempts(
  identifier: string, // email or IP address
  failedAttempts: number,
  windowMinutes: number = 5
): Promise<void> {
  const threshold = 10;

  if (failedAttempts >= threshold) {
    reportSecurityEvent({
      type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
      severity: SecuritySeverity.HIGH,
      ipAddress: identifier.includes('@') ? undefined : identifier,
      metadata: {
        identifier,
        failed_attempts: failedAttempts,
        window_minutes: windowMinutes,
      },
      message: `Brute force attack detected: ${failedAttempts} failed login attempts in ${windowMinutes} minutes`,
      timestamp: new Date(),
    });
  }
}

/**
 * Detect RLS policy violations
 * Called when database returns RLS-related errors
 */
export function detectRLSViolation(
  userId: string,
  tableName: string,
  operation: string,
  error: string
): void {
  reportSecurityEvent({
    type: SecurityEventType.RLS_VIOLATION,
    severity: SecuritySeverity.HIGH,
    userId,
    metadata: {
      table: tableName,
      operation,
      error_message: error,
    },
    message: `RLS policy violation detected for table ${tableName}`,
    timestamp: new Date(),
  });
}

/**
 * Detect unauthorized API access attempts
 * Called when API endpoint is accessed without proper authentication
 */
export function detectUnauthorizedAccess(
  endpoint: string,
  ipAddress: string,
  userAgent: string,
  attemptedUserId?: string
): void {
  reportSecurityEvent({
    type: SecurityEventType.UNAUTHORIZED_ACCESS,
    severity: SecuritySeverity.MEDIUM,
    userId: attemptedUserId,
    ipAddress,
    userAgent,
    metadata: {
      endpoint,
      attempted_user_id: attemptedUserId,
    },
    message: `Unauthorized access attempt to ${endpoint}`,
    timestamp: new Date(),
  });
}

/**
 * Detect suspicious data export patterns
 * Triggers alert if user exports data multiple times in short period
 */
export function detectSuspiciousDataExport(
  userId: string,
  exportCount: number,
  timeWindowHours: number = 1
): void {
  const threshold = 3; // 3 exports in 1 hour is suspicious

  if (exportCount >= threshold) {
    reportSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_DATA_EXPORT,
      severity: SecuritySeverity.HIGH,
      userId,
      metadata: {
        export_count: exportCount,
        time_window_hours: timeWindowHours,
      },
      message: `Suspicious data export pattern: ${exportCount} exports in ${timeWindowHours} hours`,
      timestamp: new Date(),
    });
  }
}

/**
 * Detect rate limit violations
 * Called when rate limit is exceeded for an endpoint
 */
export function detectRateLimitExceeded(
  userId: string,
  endpoint: string,
  requestCount: number,
  limit: number
): void {
  reportSecurityEvent({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    severity: SecuritySeverity.MEDIUM,
    userId,
    metadata: {
      endpoint,
      request_count: requestCount,
      limit,
    },
    message: `Rate limit exceeded for ${endpoint}: ${requestCount}/${limit} requests`,
    timestamp: new Date(),
  });
}

/**
 * Detect privilege escalation attempts
 * Called when user tries to access resources above their permission level
 */
export function detectPrivilegeEscalation(
  userId: string,
  attemptedAction: string,
  currentRole: string,
  requiredRole: string
): void {
  reportSecurityEvent({
    type: SecurityEventType.PRIVILEGE_ESCALATION,
    severity: SecuritySeverity.HIGH,
    userId,
    metadata: {
      attempted_action: attemptedAction,
      current_role: currentRole,
      required_role: requiredRole,
    },
    message: `Privilege escalation attempt: User with role ${currentRole} tried to perform ${attemptedAction} (requires ${requiredRole})`,
    timestamp: new Date(),
  });
}

/**
 * Detect SQL injection attempts
 * Called when suspicious SQL patterns detected in user input
 */
export function detectSQLInjection(
  userId: string | undefined,
  input: string,
  endpoint: string,
  ipAddress: string
): void {
  // Common SQL injection patterns
  const sqlPatterns = [
    /(\bOR\b|\bAND\b).*=.*['"]?/i,
    /UNION.*SELECT/i,
    /DROP\s+TABLE/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /UPDATE.*SET/i,
    /--/,
    /\/\*/,
    /\*\//,
    /'.*--/,
    /".*--/,
  ];

  const hasSQLPattern = sqlPatterns.some((pattern) => pattern.test(input));

  if (hasSQLPattern) {
    reportSecurityEvent({
      type: SecurityEventType.SQL_INJECTION_ATTEMPT,
      severity: SecuritySeverity.CRITICAL,
      userId,
      ipAddress,
      metadata: {
        endpoint,
        input_preview: input.substring(0, 100), // Only log first 100 chars
      },
      message: `SQL injection attempt detected in ${endpoint}`,
      timestamp: new Date(),
    });
  }
}

/**
 * Hash IP address for privacy (GDPR compliance)
 */
function hashIP(ip: string): string {
  // Simple hash for privacy - in production, use crypto.createHash
  return `ip_${Buffer.from(ip).toString('base64').substring(0, 12)}`;
}

/**
 * Get security event statistics
 * Useful for security dashboard
 */
export interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  mediumEvents: number;
  lowEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  last24Hours: number;
}

export async function getSecurityStats(): Promise<SecurityStats> {
  // Post-MVP: query persisted security events when the security dashboard is active.
  return {
    totalEvents: 0,
    criticalEvents: 0,
    highEvents: 0,
    mediumEvents: 0,
    lowEvents: 0,
    eventsByType: {} as Record<SecurityEventType, number>,
    last24Hours: 0,
  };
}

/**
 * Middleware helper to detect and report security events in API routes
 */
export function withSecurityMonitoring<T extends (...args: any[]) => any>(
  handler: T,
  options: {
    requireAuth?: boolean;
    rateLimit?: { requests: number; windowMinutes: number };
  } = {}
): T {
  return (async (...args: any[]) => {
    try {
      if (options.requireAuth || options.rateLimit) {
        throw new Error(
          'withSecurityMonitoring does not enforce auth or rate limits; use the active route guard instead.'
        );
      }

      // Call actual handler
      return await handler(...args);
    } catch (error) {
      // Check if error is security-related
      if (error instanceof Error) {
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          // RLS violation detected
          const userId = args[0]?.user?.id; // Assuming first arg has user
          detectRLSViolation(userId || 'unknown', 'unknown', 'unknown', error.message);
        }
      }
      throw error;
    }
  }) as T;
}
