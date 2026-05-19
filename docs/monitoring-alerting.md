> Doc Class: `active`
> Last Verified: `2026-05-19`

# Monitoring and Alerting Guide

## Overview

This guide covers setting up comprehensive monitoring and alerting for the Proofound application in production. It includes error monitoring, performance tracking, log aggregation, and incident response procedures.

Launch note: `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md` Section 7 is the canonical launch contract for monitoring, logging boundaries, recovery targets, and operational readiness. This guide should be read as implementation support, not a competing launch spec. Historical PASS/FAIL run logs below are not current production-candidate signoff evidence.

---

## Table of Contents

1. [Monitoring Stack Overview](#monitoring-stack-overview)
2. [Sentry Error Monitoring](#sentry-error-monitoring)
3. [Vercel Analytics](#vercel-analytics)
4. [Log Monitoring](#log-monitoring)
5. [Database Monitoring](#database-monitoring)
6. [Uptime Monitoring](#uptime-monitoring)
7. [Alert Configuration](#alert-configuration)
8. [Dashboards](#dashboards)
9. [Incident Response](#incident-response)
10. [Metrics to Track](#metrics-to-track)

---

## Monitoring Stack Overview

**Proofound Monitoring Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Application                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Next.js  │  │ API      │  │Database  │  │ Cache    │   │
│  │ Frontend │  │ Routes   │  │ Supabase │  │ Vercel KV│   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Monitoring Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Sentry   │  │ Vercel   │  │ Supabase │  │ Uptime   │   │
│  │ Errors   │  │ Analytics│  │ Metrics  │  │ Monitor  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  Alert System │
                  │  (Email/Slack)│
                  └───────────────┘
```

**Services Used at Launch:**

- **Sentry:** Error tracking, performance monitoring
- **Vercel:** Analytics, logs, deployment monitoring
- **Supabase:** Database metrics, connection pooling
- **Better Uptime or UptimeRobot:** One external uptime monitor for `/` and `/api/health`

---

## Sentry Error Monitoring

### Setup

Sentry is already configured in the application. See `docs/sentry-setup.md` for installation details.

### Alert Configuration

**Create Alert Rules:**

1. Go to Sentry dashboard → Alerts → Create Alert Rule
2. Configure critical alerts:

**Alert 1: High Error Rate**

- **Name:** Production Error Rate Spike
- **Environment:** production
- **Condition:** Errors > 10 in 1 minute
- **Action:** Notify the monitored launch operator channel
- **Priority:** High

**Alert 2: New Issue**

- **Name:** New Production Error
- **Environment:** production
- **Condition:** First seen event
- **Filter:** level:error
- **Action:** Notify the launch incident owner
- **Priority:** High

**Alert 3: Regression**

- **Name:** Error Regression Detected
- **Condition:** Issue is marked resolved and occurs again
- **Action:** Assign to the responsible protected owner group
- **Priority:** Medium

**Alert 4: Performance Degradation**

- **Name:** Slow API Response
- **Condition:** p95 response time > 2000ms for 5 minutes
- **Transaction:** active MVP API route, such as `/api/assignments`
- **Action:** Notify the monitored launch operator channel
- **Priority:** Medium

### Issue Assignment

**Configure automatic assignment:**

1. Go to Settings → Issue Owners
2. Add ownership rules:

Use private Sentry owner groups or protected team handles. Do not put personal
email addresses, private proof content, raw payloads, signed URLs, or internal
queue identifiers in issue-owner examples or alert messages.

### Sentry Performance Monitoring

**Review Performance:**

1. Go to Sentry → Performance
2. Key metrics to monitor:
   - **Transaction throughput:** Requests per minute
   - **Apdex score:** User satisfaction (target > 0.9)
   - **p50, p75, p95, p99:** Response time percentiles
   - **Failure rate:** Failed transactions

**Slow Transaction Alerts:**

```javascript
// sentry.server.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  integrations: [Sentry.httpIntegration()],
  beforeSend(event, hint) {
    // Add custom context
    if (event.request) {
      event.tags = {
        ...event.tags,
        endpoint: event.request.url,
      };
    }
    return event;
  },
});
```

### Release Tracking

**Enable Release Tracking:**

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Configure in package.json
{
  "scripts": {
    "build": "next build && sentry-cli releases new $VERCEL_GIT_COMMIT_SHA",
    "deploy": "vercel deploy --prod && sentry-cli releases finalize $VERCEL_GIT_COMMIT_SHA"
  }
}
```

**Benefits:**

- Track errors by release version
- Compare error rates between releases
- Automatic source map uploads

---

## Vercel Analytics

### Enable Web Analytics

1. Go to Vercel dashboard → Project → Analytics
2. Click "Enable Web Analytics"
3. Select plan (free or pro)
4. Deploy to start collecting data

**No code changes required** - automatically tracks:

- Page views
- Core Web Vitals (LCP, FID, CLS)
- Real user monitoring
- Geographic distribution
- Device/browser breakdown

### Pre-commit Vercel Gate (Run Log)

Use this section to record local parity checks run before committing changes that could affect deploy (build, env, or Vercel settings). Do not paste secrets.
The dated rows below are historical local/deploy-parity notes for their named commit and must not be treated as current production-candidate launch evidence.

- 2026-02-06 22:50 CET (base commit at time of run: `ed6c95e3e27086fc9a028364b52e0fc6517fd3fb`, Node `v20.20.0`):
  - `npm ci`: PASS
  - `npm run lint`: PASS
  - `npm run typecheck`: PASS
  - `npm run test`: PASS
  - `npm run build`: PASS
  - `npx vercel@latest pull --yes --environment=production` (via `VERCEL_TOKEN`): PASS
  - `npx vercel@latest build --prod` (via `VERCEL_TOKEN`): PASS

### Core Web Vitals Monitoring

**Dashboard Location:**
Vercel → Project → Analytics → Web Vitals

**Key Metrics:**

- **LCP (Largest Contentful Paint):** Target < 2.5s
- **FID (First Input Delay):** Target < 100ms
- **CLS (Cumulative Layout Shift):** Target < 0.1
- **TTFB (Time to First Byte):** Target < 600ms

**Set Up Alerts:**

Currently, Vercel doesn't have built-in Web Vitals alerts. Monitor manually or use the Analytics API:

```typescript
// Custom monitoring script
import { fetch } from 'undici';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

async function checkWebVitals() {
  const response = await fetch(
    `https://api.vercel.com/v1/analytics/web-vitals?projectId=${VERCEL_PROJECT_ID}`,
    {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    }
  );

  const data = await response.json();

  // Check if LCP > 2.5s
  if (data.lcp.p75 > 2500) {
    // Send alert
    console.error('LCP degradation detected:', data.lcp);
  }

  return data;
}

// Run periodically
setInterval(checkWebVitals, 60 * 60 * 1000); // Every hour
```

### Speed Insights

**Enable Speed Insights:**

```typescript
// src/app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Benefits:**

- Real user performance monitoring
- Route-specific performance data
- Device and connection type breakdown

---

## Log Monitoring

### Accessing Vercel Logs

**Via Dashboard:**

1. Go to Vercel → Project → Logs
2. Filter by:
   - Level (info, warn, error)
   - Time range
   - Request ID
   - User ID

**Via CLI:**

```bash
# Install Vercel CLI
npm install -g vercel

# View live logs
vercel logs --follow

# Filter by level
vercel logs | grep '"level":"error"'

# Filter by event
vercel logs | grep '"event":"match.profile.computed"'

# Filter by user
vercel logs | grep '"userId":"abc-123"'

# Download logs for analysis
vercel logs > logs.json
```

### Log Aggregation with jq

**Install jq:**

```bash
brew install jq
```

**Query logs:**

```bash
# Get all error logs
vercel logs | jq 'select(.level == "error")'

# Count errors by event
vercel logs | jq -r 'select(.level == "error") | .event' | sort | uniq -c

# Find slow requests (> 1000ms)
vercel logs | jq 'select(.durationMs > 1000)'

# Get logs for specific user
vercel logs | jq 'select(.userId == "user-123")'

# Trace request by requestId
vercel logs | jq 'select(.requestId == "abc-xyz-789")'
```

### Log Alerts

**Set up log-based alerts using the launch stack first.**

**Option 1: Vercel + Sentry + script-based checks (canonical launch path)**

Use Vercel logs, Sentry alerts, and a small script or scheduled review for launch. Do not add a new log platform unless the existing stack proves insufficient.

**Option 2: Datadog (post-launch only)**

```bash
# Install Datadog agent
# Configure to ingest Vercel logs
# Set up log-based monitors
```

**Option 3: LogDNA/Mezmo (post-launch only)**

```bash
# Install LogDNA
npm install @logdna/logger

# Configure in logger
import LogDNA from '@logdna/logger';
const logger = LogDNA.createLogger(process.env.LOGDNA_KEY, {
  app: 'proofound',
  env: process.env.NODE_ENV,
});

// Log to LogDNA
logger.log('Custom log message', { level: 'info', meta: { userId: 'xxx' } });
```

**Option 4: Manual Monitoring Script**

```typescript
// scripts/monitor-logs.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function monitorErrors() {
  const { stdout } = await execAsync('vercel logs --since 5m');

  const lines = stdout.split('\n');
  const errors = lines.filter((line) => {
    try {
      const log = JSON.parse(line);
      return log.level === 'error';
    } catch {
      return false;
    }
  });

  if (errors.length > 10) {
    console.error(`High error rate: ${errors.length} errors in 5 minutes`);
    // Notify the configured launch operator channel without including raw logs.
  }
}

// Run every 5 minutes
setInterval(monitorErrors, 5 * 60 * 1000);
```

---

## Database Monitoring

### Supabase Database Metrics

**Dashboard Location:**
Supabase → Project → Reports

**Key Metrics:**

1. **Database Size:**
   - Monitor database growth
   - Alert if approaching plan limits

2. **Connection Pool:**
   - Active connections
   - Idle connections
   - Target: < 50 connections (transaction pooler)

3. **Query Performance:**
   - Slow queries (> 100ms)
   - Most executed queries
   - Missing indexes

4. **Replication Lag:**
   - Monitor read replica lag
   - Target: < 1 second

### Query Performance Monitoring

**Enable pg_stat_statements:**

```sql
-- Already enabled on Supabase by default
-- View slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY total_exec_time DESC
LIMIT 20;
```

**Monitor in Application:**

```typescript
// Add to database query wrapper
import { log } from '@/lib/log';

async function queryDatabase(sql: string, params: any[]) {
  const startTime = Date.now();

  try {
    const result = await db.query(sql, params);
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > 100) {
      log.warn('db.query.slow', {
        duration,
        rowCount: result.rows.length,
        // Don't log full SQL (may contain sensitive data)
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

### Connection Pool Monitoring

**Monitor connection usage:**

```sql
-- Check current connections
SELECT
  datname,
  count(*) as connections,
  max(backend_start) as oldest_connection
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY datname;

-- Check connection pool stats
SELECT
  sum(numbackends) as total_connections,
  max(xact_commit + xact_rollback) as total_transactions
FROM pg_stat_database
WHERE datname = 'postgres';
```

**Alert on high connection count:**

Target: < 50 connections (90% of Supabase pooler limit).

### Database Backup Monitoring

**Verify backups:**

1. Go to Supabase → Database → Backups
2. Verify daily backups are created
3. Test restore process (on staging)

**Set reminder to test restore monthly.**

---

## Uptime Monitoring

### Option 1: UptimeRobot (Free)

**Setup:**

1. Go to https://uptimerobot.com
2. Sign up for free account
3. Add monitors:

**Monitor 1: Homepage**

- **Type:** HTTP(s)
- **URL:** https://proofound.io
- **Interval:** 5 minutes
- **Alert:** Email when down for 5 minutes

**Monitor 2: API Health Check**

- **Type:** HTTP(s)
- **URL:** https://proofound.io/api/health
- **Interval:** 5 minutes
- **Expected Status:** 200

**Monitor 3: Authenticated Launch Status**

- **Type:** HTTP(s)
- **URL:** production-candidate `/api/monitoring/launch-status`
- **Interval:** 10 minutes
- **Custom Headers:** Use the protected internal launch-ops secret

4. Configure alerts:
   - Notify the monitored launch operator channel
   - Keep escalation owner details in the protected operations roster

### Option 2: Better Uptime (Recommended)

**Setup:**

1. Go to https://betteruptime.com
2. Sign up (free tier available)
3. Add monitors (similar to UptimeRobot)
4. Benefits over UptimeRobot:
   - Incident timeline
   - Status page
   - On-call scheduling
   - Launch operator channel integration

### Health Check Endpoint

Use the existing public liveness endpoint at `/api/health`. It intentionally
returns only `status` and `timestamp`; internal diagnostics belong behind
authenticated launch-ops routes such as `/api/monitoring/launch-status` and
`/api/monitoring/health-diagnostics`.

---

## Alert Configuration

### Alert Priority Levels

**P0 - Critical (Immediate Action Required):**

- Site down (uptime monitor)
- Database connection failures
- Error rate > 50 per minute
- Privacy, reveal, export, delete, or public portfolio safety failure

**P1 - High (Action Required Within 1 Hour):**

- Error rate > 10 per minute
- API response time p95 > 2s
- Database connection pool > 80%
- Cache unavailable

**P2 - Medium (Action Required Within 4 Hours):**

- Error rate > 5 per minute
- API response time p95 > 1s
- Slow database queries
- New error type introduced

**P3 - Low (Action Required Within 24 Hours):**

- Warning logs spike
- Cache backend or key-count drift where provider evidence is available
- Scheduled job failures
- Non-critical feature degradation

### Alert Channels

**Email:**

- P0, P1: monitored launch operator channel and incident owner
- P2, P3: protected operations channel

**Slack:**

Use a protected launch operator channel if Slack is the chosen incident channel.
Do not paste webhook URLs or secrets into repository docs.

**Escalation (for P0):**
Keep escalation details in the protected operations roster, not in tracked docs.

### Alert Fatigue Prevention

**Best Practices:**

1. Set appropriate thresholds (don't alert on every error)
2. Use alert aggregation (1 alert for 10 errors, not 10 alerts)
3. Implement alert snoozing for known issues
4. Route alerts by severity (P0 → SMS, P3 → Email)
5. Review and adjust alert thresholds weekly

---

## Dashboards

### Sentry Dashboard

**Custom Dashboard:**

1. Go to Sentry → Dashboards → Create Dashboard
2. Add widgets:
   - Error count (last 24 hours)
   - Top 5 error types
   - Error rate by environment
   - p95 response time
   - Apdex score

### Vercel Dashboard

**Key Metrics to Monitor:**

- Deployment status
- Build times
- Core Web Vitals trends
- Function execution time
- Bandwidth usage

### Custom Monitoring Dashboard

**Create admin dashboard:**

```typescript
// src/app/admin/monitoring/page.tsx
import { Suspense } from 'react';
import { getCacheStats } from '@/lib/cache';
import { db } from '@/db';

async function MonitoringStats() {
  // Get cache stats
  const cacheStats = await getCacheStats();

  // Get database stats
  const dbStats = await db.execute(`
    SELECT
      count(*) as total_users,
      count(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h
    FROM profiles
  `);

  // Get error count from logs (if stored)
  // ...

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="card">
        <h3>Cache Backend</h3>
        <p className="text-3xl">{cacheStats.type === 'redis' ? 'KV' : 'Memory'}</p>
        <p className="text-sm text-muted-foreground">
          {cacheStats.keys == null ? 'Key counts managed by provider' : `${cacheStats.keys} keys`}
        </p>
      </div>
      <div className="card">
        <h3>Total Users</h3>
        <p className="text-3xl">{dbStats.rows[0].total_users}</p>
      </div>
      <div className="card">
        <h3>New Users (24h)</h3>
        <p className="text-3xl">{dbStats.rows[0].new_users_24h}</p>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">System Monitoring</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <MonitoringStats />
      </Suspense>
    </div>
  );
}
```

---

## Incident Response

### Incident Response Process

**1. Detection (Automated):**

- Alert received via email/Slack/SMS
- Severity level determined (P0-P3)

**2. Acknowledgement:**

- On-call engineer acknowledges alert within 5 minutes (P0/P1)
- Update status page (if applicable)

**3. Investigation:**

- Check Sentry for errors
- Review Vercel logs
- Check database metrics
- Review recent deployments

**4. Mitigation:**

- Rollback deployment (if recent deploy)
- Apply hotfix
- Scale resources (if capacity issue)
- Disable feature flag (if feature-specific)

**5. Resolution:**

- Verify issue resolved
- Update status page
- Document incident

**6. Post-Mortem (P0/P1 only):**

- Write incident report
- Identify root cause
- Create action items
- Schedule follow-up review

### Incident Response Checklist

**For P0 Incidents (Site Down):**

- [ ] Acknowledge alert within 5 minutes
- [ ] Check health endpoint
- [ ] Check Vercel deployment status
- [ ] Check Supabase status
- [ ] Review recent deployments
- [ ] Rollback if recent deploy (if needed)
- [ ] Check error logs in Sentry
- [ ] Verify database connections
- [ ] Update status page
- [ ] Communicate to team
- [ ] Document timeline
- [ ] Schedule post-mortem

**For P1 Incidents (High Error Rate):**

- [ ] Acknowledge alert within 15 minutes
- [ ] Check Sentry for error details
- [ ] Check affected endpoints
- [ ] Check database performance
- [ ] Review recent code changes
- [ ] Apply fix or rollback
- [ ] Verify error rate decreased
- [ ] Document incident

### Communication Templates

**Initial Incident Update:**

```
[INCIDENT] Production Issue Detected
Severity: P0
Status: Investigating
Impact: Site unavailable for some users
Time: 2026-05-19 10:30 UTC
Next update: 10:45 UTC
```

**Resolution Update:**

```
[RESOLVED] Production Issue Resolved
Severity: P0
Status: Resolved
Impact: Site fully restored
Root cause: Database connection pool exhausted
Fix: Increased connection pool limit
Duration: 15 minutes
Post-mortem: Scheduled if this is a P1 privacy/trust incident
```

---

## Metrics to Track

### Application Metrics

**Error Metrics:**

- Total errors per hour/day
- Error rate (errors per request)
- Error types (by category)
- Errors by endpoint
- Errors by user

**Performance Metrics:**

- API response time (p50, p95, p99)
- Database query time
- Cache backend and key-count evidence where the provider exposes it
- Core Web Vitals (LCP, FID, CLS)
- Time to First Byte (TTFB)

**MVP Corridor Metrics:**

- signup/login health
- proof upload/import/linking health
- assignment create/edit/review/publish health
- shortlist/review, intro, reveal, interview, decision, and engagement-verification health

### Infrastructure Metrics

**Vercel:**

- Function execution time
- Function invocations
- Build duration
- Deployment frequency
- Bandwidth usage

**Supabase:**

- Database size
- Connection count
- Query performance
- Replication lag
- Backup success rate

**Vercel KV:**

- backend configured as expected
- key count where runtime evidence can expose it
- provider health from Vercel dashboard

---

## Monitoring Checklist

### Daily Monitoring

- [ ] Check Sentry for new errors
- [ ] Review error rate trends
- [ ] Check Vercel Analytics for anomalies
- [ ] Review slow queries in Supabase
- [ ] Verify backups completed

### Weekly Monitoring

- [ ] Review alert thresholds
- [ ] Check cache effectiveness
- [ ] Review Core Web Vitals trends
- [ ] Analyze performance trends
- [ ] Review incident reports
- [ ] Update documentation

### Monthly Monitoring

- [ ] Test database restore
- [ ] Review monitoring costs
- [ ] Audit alert configurations
- [ ] Review and archive old logs
- [ ] Security audit (access logs)
- [ ] Capacity planning review

---

## Tools Reference

### Essential Monitoring Tools

| Tool             | Purpose              | Cost                     |
| ---------------- | -------------------- | ------------------------ |
| Sentry           | Error tracking       | Free tier (5k errors/mo) |
| Vercel Analytics | Web vitals, usage    | Included with Vercel     |
| Supabase         | Database metrics     | Included with Supabase   |
| UptimeRobot      | Uptime monitoring    | Free (50 monitors)       |
| Better Uptime    | Uptime + status page | Free tier available      |

### Optional Advanced Tools (post-launch only, non-canonical for MVP)

| Tool      | Purpose            | Cost               |
| --------- | ------------------ | ------------------ |
| Datadog   | Full observability | Paid ($15/host/mo) |
| New Relic | APM monitoring     | Paid ($49/mo)      |
| LogDNA    | Log aggregation    | Paid ($15/GB/mo)   |

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
- [UptimeRobot](https://uptimerobot.com/)
- [Better Uptime](https://betteruptime.com/)
- [Web Vitals](https://web.dev/vitals/)

---

**Last Updated:** 2026-05-19
