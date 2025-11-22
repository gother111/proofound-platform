/**
 * Performance Health Check
 *
 * PRD: Part 8 (lines 1813-1817)
 * Monitors performance metrics and alerts when SLA is breached
 */

import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { sql, and, gte } from 'drizzle-orm';
import { log } from '@/lib/log';
import { sendEmail } from '@/lib/email/sender';

export interface PerformanceHealthStatus {
  healthy: boolean;
  timestamp: Date;
  metrics: {
    pageLoadP95: number | null;
    apiLatencyP95: number | null;
    errorRate: number | null;
  };
  breaches: PerformanceBreach[];
  summary: string;
}

export interface PerformanceBreach {
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  description: string;
}

/**
 * Check performance health over the last 24 hours
 * Returns status and any SLA breaches
 */
export async function checkPerformanceHealth(): Promise<PerformanceHealthStatus> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // Get performance metrics from analytics events
    const [pageLoadMetrics, apiLatencyMetrics, errorMetrics] = await Promise.all([
      getPageLoadP95(twentyFourHoursAgo, now),
      getAPILatencyP95(twentyFourHoursAgo, now),
      getErrorRate(twentyFourHoursAgo, now),
    ]);

    // Check for SLA breaches
    const breaches: PerformanceBreach[] = [];

    // Page Load SLA: ≤2000ms (2s) for TTI
    if (pageLoadMetrics !== null && pageLoadMetrics > 2000) {
      breaches.push({
        metric: 'page_load_p95',
        value: pageLoadMetrics,
        threshold: 2000,
        severity: pageLoadMetrics > 3000 ? 'critical' : 'warning',
        description: `Page load P95 (${Math.round(pageLoadMetrics)}ms) exceeds target (2000ms)`,
      });
    }

    // API Latency SLA: ≤500ms P95
    if (apiLatencyMetrics !== null && apiLatencyMetrics > 500) {
      breaches.push({
        metric: 'api_latency_p95',
        value: apiLatencyMetrics,
        threshold: 500,
        severity: apiLatencyMetrics > 1000 ? 'critical' : 'warning',
        description: `API latency P95 (${Math.round(apiLatencyMetrics)}ms) exceeds target (500ms)`,
      });
    }

    // Error Rate threshold: <1% for warnings, <5% for critical
    if (errorMetrics !== null && errorMetrics > 1) {
      breaches.push({
        metric: 'error_rate',
        value: errorMetrics,
        threshold: 1,
        severity: errorMetrics > 5 ? 'critical' : 'warning',
        description: `Error rate (${errorMetrics.toFixed(2)}%) exceeds target (1%)`,
      });
    }

    const healthy = breaches.length === 0;
    const summary = healthy
      ? 'All performance metrics within SLA targets'
      : `${breaches.length} SLA breach(es) detected`;

    const status: PerformanceHealthStatus = {
      healthy,
      timestamp: now,
      metrics: {
        pageLoadP95: pageLoadMetrics,
        apiLatencyP95: apiLatencyMetrics,
        errorRate: errorMetrics,
      },
      breaches,
      summary,
    };

    log.info('performance.health_check.completed', {
      healthy,
      breaches: breaches.length,
      metrics: status.metrics,
    });

    return status;
  } catch (error) {
    log.error('performance.health_check.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return unhealthy status if health check itself fails
    return {
      healthy: false,
      timestamp: now,
      metrics: {
        pageLoadP95: null,
        apiLatencyP95: null,
        errorRate: null,
      },
      breaches: [
        {
          metric: 'health_check',
          value: 0,
          threshold: 0,
          severity: 'critical',
          description: 'Performance health check failed to execute',
        },
      ],
      summary: 'Health check execution failed',
    };
  }
}

/**
 * Get P95 page load time from the last 24 hours
 */
async function getPageLoadP95(startDate: Date, endDate: Date): Promise<number | null> {
  try {
    const result = await db.execute(sql`
      SELECT 
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'duration')::float) as p95
      FROM ${analyticsEvents}
      WHERE event_type = 'performance_metric'
        AND properties->>'metric' = 'page_load'
        AND occurred_at >= ${startDate.toISOString()}
        AND occurred_at <= ${endDate.toISOString()}
        AND (properties->>'duration')::float IS NOT NULL
    `);

    const rows = result.rows as any[];
    return rows.length > 0 && rows[0].p95 !== null ? parseFloat(rows[0].p95) : null;
  } catch (error) {
    log.error('performance.page_load_p95.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get P95 API latency from the last 24 hours
 */
async function getAPILatencyP95(startDate: Date, endDate: Date): Promise<number | null> {
  try {
    const result = await db.execute(sql`
      SELECT 
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'duration')::float) as p95
      FROM ${analyticsEvents}
      WHERE event_type = 'performance_metric'
        AND properties->>'metric' = 'api_latency'
        AND occurred_at >= ${startDate.toISOString()}
        AND occurred_at <= ${endDate.toISOString()}
        AND (properties->>'duration')::float IS NOT NULL
    `);

    const rows = result.rows as any[];
    return rows.length > 0 && rows[0].p95 !== null ? parseFloat(rows[0].p95) : null;
  } catch (error) {
    log.error('performance.api_latency_p95.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get error rate (percentage) from the last 24 hours
 */
async function getErrorRate(startDate: Date, endDate: Date): Promise<number | null> {
  try {
    const result = await db.execute(sql`
      WITH total_requests AS (
        SELECT COUNT(*) as count
        FROM ${analyticsEvents}
        WHERE event_type IN ('api_request', 'page_view')
          AND occurred_at >= ${startDate.toISOString()}
          AND occurred_at <= ${endDate.toISOString()}
      ),
      error_requests AS (
        SELECT COUNT(*) as count
        FROM ${analyticsEvents}
        WHERE event_type = 'error'
          AND occurred_at >= ${startDate.toISOString()}
          AND occurred_at <= ${endDate.toISOString()}
      )
      SELECT 
        CASE 
          WHEN total_requests.count > 0 
          THEN (error_requests.count::float / total_requests.count::float) * 100
          ELSE 0
        END as error_rate
      FROM total_requests, error_requests
    `);

    const rows = result.rows as any[];
    return rows.length > 0 && rows[0].error_rate !== null ? parseFloat(rows[0].error_rate) : null;
  } catch (error) {
    log.error('performance.error_rate.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Send alert email when performance SLA is breached
 */
export async function sendPerformanceAlert(status: PerformanceHealthStatus): Promise<void> {
  const alertEmail = process.env.ALERT_EMAIL || process.env.ADMIN_EMAIL;

  if (!alertEmail) {
    log.warn('performance.alert.no_email_configured', {
      message: 'ALERT_EMAIL or ADMIN_EMAIL environment variable not set',
    });
    return;
  }

  try {
    const criticalBreaches = status.breaches.filter((b) => b.severity === 'critical');
    const warningBreaches = status.breaches.filter((b) => b.severity === 'warning');

    const subject =
      criticalBreaches.length > 0
        ? `🚨 CRITICAL: Performance SLA Breach Detected`
        : `⚠️ WARNING: Performance Degradation Detected`;

    const breachList = status.breaches
      .map((b) => `- [${b.severity.toUpperCase()}] ${b.description}`)
      .join('\n');

    const metricsReport = `
Current Metrics (24h):
- Page Load P95: ${status.metrics.pageLoadP95 ? `${Math.round(status.metrics.pageLoadP95)}ms` : 'N/A'} (Target: ≤2000ms)
- API Latency P95: ${status.metrics.apiLatencyP95 ? `${Math.round(status.metrics.apiLatencyP95)}ms` : 'N/A'} (Target: ≤500ms)
- Error Rate: ${status.metrics.errorRate ? `${status.metrics.errorRate.toFixed(2)}%` : 'N/A'} (Target: <1%)
`;

    const body = `
Performance Health Check Alert

${status.summary}

SLA Breaches Detected:
${breachList}

${metricsReport}

Timestamp: ${status.timestamp.toISOString()}

Action Required:
${criticalBreaches.length > 0 ? '- Immediate investigation and remediation required for critical issues' : ''}
- Review performance metrics in monitoring dashboard
- Check recent deployments for potential causes
- Monitor trends to prevent escalation

Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/app/admin/performance
`;

    await sendEmail({
      to: alertEmail,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    log.info('performance.alert.sent', {
      recipient: alertEmail,
      breaches: status.breaches.length,
      criticalCount: criticalBreaches.length,
      warningCount: warningBreaches.length,
    });
  } catch (error) {
    log.error('performance.alert.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
