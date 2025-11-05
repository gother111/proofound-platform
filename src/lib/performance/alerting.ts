/**
 * Performance Alerting System
 *
 * Checks P95 metrics against thresholds and sends alerts
 * when SLAs are violated.
 *
 * PRD Reference: Part 8 (lines 1813-1817)
 */

import { db } from '@/db';
import { performanceMetrics, performanceAlerts } from '@/db/schema';
import type { InsertPerformanceAlert } from '@/db/schema';
import { and, gte, desc, isNotNull, sql } from 'drizzle-orm';

// SLA thresholds in milliseconds
export const SLA_THRESHOLDS = {
  desktop_page_tti_p95: 2500, // 2.5s
  mobile_page_tti_p95: 3500, // 3.5s
  api_p95: 1500, // 1.5s
  dashboard_p75: 2000, // 2.0s
};

export interface AlertResult {
  alertsCreated: number;
  violations: Array<{
    metric: string;
    route: string;
    threshold: number;
    actual: number;
    severity: string;
  }>;
}

/**
 * Check all performance metrics against SLAs
 * Should be run hourly via cron job
 */
export async function checkPerformanceSLAs(): Promise<AlertResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const violations: AlertResult['violations'] = [];
  let alertsCreated = 0;

  try {
    // Get recent aggregated metrics
    const recentMetrics = await db
      .select()
      .from(performanceMetrics)
      .where(and(gte(performanceMetrics.timestamp, oneHourAgo), isNotNull(performanceMetrics.p95)))
      .orderBy(desc(performanceMetrics.timestamp));

    // Group by route and metric type, take most recent
    const latestMetrics = new Map<string, any>();

    recentMetrics.forEach((metric) => {
      const route = metric.pageRoute || metric.apiEndpoint || 'unknown';
      const key = `${metric.metricType}|${route}|${metric.deviceType || 'all'}`;

      if (!latestMetrics.has(key) || metric.timestamp > latestMetrics.get(key).timestamp) {
        latestMetrics.set(key, metric);
      }
    });

    // Check each metric against appropriate SLA
    for (const [key, metric] of latestMetrics.entries()) {
      const violation = checkMetricSLA(metric);

      if (violation) {
        violations.push(violation);

        // Check if alert already exists for this route in the last hour
        const existingAlert = await db
          .select()
          .from(performanceAlerts)
          .where(
            and(
              sql`${performanceAlerts.route} = ${violation.route}`,
              sql`${performanceAlerts.metricType} = ${violation.metric}`,
              sql`${performanceAlerts.status} IN ('open', 'acknowledged')`,
              gte(performanceAlerts.createdAt, oneHourAgo)
            )
          )
          .limit(1);

        // Only create new alert if none exists
        if (existingAlert.length === 0) {
          await createAlert(violation);
          alertsCreated++;
        }
      }
    }

    console.log(
      `[Performance Alerting] Checked ${latestMetrics.size} metrics, found ${violations.length} violations, created ${alertsCreated} new alerts`
    );
  } catch (error) {
    console.error('[Performance Alerting] Error checking SLAs:', error);
  }

  return { alertsCreated, violations };
}

/**
 * Check a single metric against SLA thresholds
 */
function checkMetricSLA(metric: any): AlertResult['violations'][0] | null {
  const route = metric.pageRoute || metric.apiEndpoint || 'unknown';
  const p95 = parseFloat(metric.p95 || '0');
  const p75 = parseFloat(metric.p50 || '0') * 1.5; // Approximate P75 from P50

  let threshold: number | null = null;
  let metricName = metric.metricType;

  // Determine appropriate threshold
  if (metric.metricType === 'page_load' || metric.metricType === 'tti') {
    if (metric.deviceType === 'mobile') {
      threshold = SLA_THRESHOLDS.mobile_page_tti_p95;
      metricName = 'mobile_page_tti';
    } else {
      threshold = SLA_THRESHOLDS.desktop_page_tti_p95;
      metricName = 'desktop_page_tti';
    }

    // Check if this is a dashboard route
    if (route.includes('/app/') || route.includes('/dashboard')) {
      // Use P75 threshold for dashboards
      if (p75 > SLA_THRESHOLDS.dashboard_p75) {
        return {
          metric: 'dashboard_load',
          route,
          threshold: SLA_THRESHOLDS.dashboard_p75,
          actual: p75,
          severity: determineSeverity(p75, SLA_THRESHOLDS.dashboard_p75),
        };
      }
    }
  } else if (metric.metricType === 'api_latency') {
    threshold = SLA_THRESHOLDS.api_p95;
    metricName = 'api_latency';
  }

  if (threshold && p95 > threshold) {
    return {
      metric: metricName,
      route,
      threshold,
      actual: p95,
      severity: determineSeverity(p95, threshold),
    };
  }

  return null;
}

/**
 * Create a performance alert
 */
async function createAlert(violation: AlertResult['violations'][0]): Promise<void> {
  const alert: InsertPerformanceAlert = {
    alertType: 'sla_violation',
    metricType: violation.metric,
    route: violation.route,
    thresholdMs: String(violation.threshold),
    actualValueMs: String(violation.actual),
    percentile: 'p95',
    deviceType: null,
    severity: violation.severity as any,
    status: 'open',
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedAt: null,
    notes: null,
  };

  await db.insert(performanceAlerts).values(alert);
}

/**
 * Determine alert severity based on how much threshold is exceeded
 */
function determineSeverity(
  actualMs: number,
  thresholdMs: number
): 'low' | 'medium' | 'high' | 'critical' {
  const ratio = actualMs / thresholdMs;

  if (ratio >= 3) return 'critical'; // 3x over threshold
  if (ratio >= 2) return 'high'; // 2x over threshold
  if (ratio >= 1.5) return 'medium'; // 1.5x over threshold
  return 'low';
}

/**
 * Send alert notifications via email and/or Slack
 */
export async function sendAlertNotifications(violations: AlertResult['violations']): Promise<void> {
  if (violations.length === 0) return;

  const criticalViolations = violations.filter((v) => v.severity === 'critical');
  const highViolations = violations.filter((v) => v.severity === 'high');

  try {
    // Send email if configured
    if (
      process.env.RESEND_API_KEY &&
      (criticalViolations.length > 0 || highViolations.length > 0)
    ) {
      await sendEmailAlert(violations);
    }

    // Send Slack notification if configured
    if (process.env.SLACK_PERFORMANCE_WEBHOOK_URL) {
      await sendSlackAlert(violations);
    }
  } catch (error) {
    console.error('[Performance Alerting] Error sending notifications:', error);
  }
}

/**
 * Send email alert for performance violations
 */
async function sendEmailAlert(violations: AlertResult['violations']): Promise<void> {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const criticalViolations = violations.filter((v) => v.severity === 'critical');
  const highViolations = violations.filter((v) => v.severity === 'high');

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #dc2626; color: white; padding: 20px; }
        .content { padding: 20px; }
        .violation { margin: 15px 0; padding: 15px; border-left: 4px solid #dc2626; background: #fef2f2; }
        .violation.high { border-left-color: #f59e0b; background: #fffbeb; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ Performance Alert: SLA Violations Detected</h1>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="content">
        ${
          criticalViolations.length > 0
            ? `
          <h2>Critical Violations (${criticalViolations.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Route</th>
                <th>Threshold</th>
                <th>Actual</th>
                <th>Ratio</th>
              </tr>
            </thead>
            <tbody>
              ${criticalViolations
                .map(
                  (v) => `
                <tr>
                  <td>${v.metric}</td>
                  <td>${v.route}</td>
                  <td>${v.threshold}ms</td>
                  <td>${v.actual.toFixed(0)}ms</td>
                  <td>${(v.actual / v.threshold).toFixed(2)}x</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }
        
        ${
          highViolations.length > 0
            ? `
          <h2>High Priority Violations (${highViolations.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Route</th>
                <th>Threshold</th>
                <th>Actual</th>
                <th>Ratio</th>
              </tr>
            </thead>
            <tbody>
              ${highViolations
                .map(
                  (v) => `
                <tr>
                  <td>${v.metric}</td>
                  <td>${v.route}</td>
                  <td>${v.threshold}ms</td>
                  <td>${v.actual.toFixed(0)}ms</td>
                  <td>${(v.actual / v.threshold).toFixed(2)}x</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }
        
        <p style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/performance" 
             style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Performance Dashboard
          </a>
        </p>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'alerts@proofound.app',
    to: process.env.PERFORMANCE_ALERT_EMAILS?.split(',') || ['admin@proofound.app'],
    subject: `⚠️ Performance Alert: ${criticalViolations.length} Critical, ${highViolations.length} High Priority`,
    html: emailContent,
  });
}

/**
 * Send Slack alert for performance violations
 */
async function sendSlackAlert(violations: AlertResult['violations']): Promise<void> {
  const criticalCount = violations.filter((v) => v.severity === 'critical').length;
  const highCount = violations.filter((v) => v.severity === 'high').length;

  const topViolations = violations
    .sort((a, b) => b.actual / b.threshold - a.actual / a.threshold)
    .slice(0, 5);

  await fetch(process.env.SLACK_PERFORMANCE_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `⚠️ *Performance Alert*: ${violations.length} SLA violations detected`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Performance Alert*\n\n• Critical: ${criticalCount}\n• High Priority: ${highCount}\n• Total Violations: ${violations.length}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Top Violations:*\n${topViolations.map((v) => `• ${v.metric} - ${v.route}: ${v.actual.toFixed(0)}ms (threshold: ${v.threshold}ms)`).join('\n')}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Dashboard',
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/performance`,
            },
          ],
        },
      ],
    }),
  });
}
