# Production Alert Configuration

**Last Updated**: 2025-11-04
**Status**: Ready for Implementation

---

## Overview

This document outlines the alert configuration for production monitoring of the Proofound platform. Alerts are configured to notify the team of critical issues before they impact users.

---

## Alert Channels

### Primary Channels

1. **Email**: team@proofound.io
2. **Slack**: #proofound-alerts channel
3. **PagerDuty**: For critical/urgent alerts (optional)

### Alert Severity Levels

- **Critical** (P0): Immediate action required, system down
- **High** (P1): Significant impact, needs attention within 1 hour
- **Medium** (P2): Moderate impact, address within 4 hours
- **Low** (P3): Minor issue, address within 24 hours

---

## Sentry Alert Configuration

### 1. Error Rate Alerts

**Alert Name**: High Error Rate

- **Condition**: Error rate > 1% over 5 minutes
- **Severity**: High
- **Action**: Notify via Email + Slack
- **Sentry Config**:
  ```
  Project Settings > Alerts > New Alert Rule
  Condition: "Error count is more than 100 in 5 minutes"
  Filter: event.type:error AND NOT level:info
  ```

**Alert Name**: Critical Error Spike

- **Condition**: 50+ errors in 1 minute
- **Severity**: Critical
- **Action**: Notify via Email + Slack + PagerDuty
- **Sentry Config**:
  ```
  Condition: "Error count is more than 50 in 1 minute"
  Filter: level:error OR level:fatal
  ```

### 2. Performance Alerts

**Alert Name**: Slow Response Time

- **Condition**: P95 latency > 1000ms for 10 minutes
- **Severity**: Medium
- **Action**: Notify via Slack
- **Sentry Config**:
  ```
  Condition: "P95 response time is above 1000ms for 10 minutes"
  Transaction: /api/*
  ```

**Alert Name**: Very Slow API

- **Condition**: P99 latency > 3000ms
- **Severity**: High
- **Action**: Notify via Email + Slack
- **Sentry Config**:
  ```
  Condition: "P99 response time is above 3000ms for 5 minutes"
  Transaction: /api/*
  ```

### 3. New Error Type

**Alert Name**: New Unhandled Error

- **Condition**: New error fingerprint detected
- **Severity**: Medium
- **Action**: Notify via Slack
- **Sentry Config**:
  ```
  Condition: "A new issue is created"
  Filter: is:unresolved
  ```

---

## Health Check Alerts

The `/api/cron/health-check` endpoint runs every 5 minutes and checks:

- Database connectivity
- Database query performance
- Metrics calculation health (TTSC, TTFQI, PAC)

### Alert Integration

**Option A: Vercel Cron Monitoring**

```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/health-check",
    "schedule": "*/5 * * * *"
  }]
}
```

Vercel automatically monitors cron job failures and sends alerts.

**Option B: External Uptime Monitor**
Use BetterUptime, Pingdom, or UptimeRobot to call health check endpoint:

- **URL**: `https://your-domain.com/api/cron/health-check`
- **Interval**: Every 5 minutes
- **Timeout**: 30 seconds
- **Alert on**: HTTP status != 200

---

## Business Metrics Alerts

### TTSC (Time to Signed Contract)

**Alert Name**: TTSC Exceeds Target

- **Condition**: Median TTSC > 35 days for 7 consecutive days
- **Severity**: Medium
- **Trigger**: Health check detects metric degradation
- **Action**: Review matching quality and contractor pipeline

**Implementation**:

```typescript
// In /api/cron/health-check/route.ts (already implemented)
if (metrics.ttsc && metrics.ttsc.median > 35) {
  log.warn('health.check.ttsc.exceeds.target', {
    median: metrics.ttsc.median,
    target: 30,
  });
}
```

### TTFQI (Time to First Qualified Introduction)

**Alert Name**: TTFQI Exceeds Target

- **Condition**: Median TTFQI > 96 hours for 3 consecutive days
- **Severity**: Medium
- **Trigger**: Health check detects metric degradation
- **Action**: Review matching algorithm and assignment pool

### Proof Fit Lift

**Alert Name**: Low Proof Fit Lift

- **Condition**: Proof-fit acceptance lift < 15% for 7 consecutive days
- **Severity**: Medium
- **Trigger**: Health check detects metric degradation
- **Action**: Review proof-fit scoring and assignment pool quality

---

## Infrastructure Alerts

### Database Alerts

**Alert Name**: Database Connection Failure

- **Condition**: Health check fails database connectivity test
- **Severity**: Critical
- **Action**: Immediate investigation, notify DevOps

**Alert Name**: Slow Database Queries

- **Condition**: Query duration > 1000ms
- **Severity**: High
- **Action**: Investigate slow queries, consider optimization

### Cache Alerts

**Alert Name**: Low Cache Hit Rate

- **Condition**: Cache hit rate < 60% over 1 hour
- **Severity**: Low
- **Action**: Review caching strategy

### Rate Limit Alerts

**Alert Name**: High Rate Limit Hits

- **Condition**: >100 rate limit rejections (429 responses) per hour
- **Severity**: Medium
- **Action**: Investigate potential abuse or need to adjust limits

---

## Alert Notification Examples

### Slack Notification Format

```
🔴 CRITICAL: High Error Rate Detected

Environment: Production
Time: 2025-11-04 10:30:00 UTC
Error Rate: 2.5% (target: <1%)
Affected Users: ~50

View in Sentry: [Link]
Runbook: [Link to troubleshooting guide]

Actions:
1. Check error logs for root cause
2. Review recent deployments
3. Consider rollback if issue persists
```

### Email Alert Format

```
Subject: [CRITICAL] High Error Rate - Proofound Production

Severity: Critical
Environment: Production
Time: 2025-11-04 10:30:00 UTC

Alert Details:
- Error rate: 2.5% (threshold: 1%)
- Affected endpoints: /api/core/matching/profile
- Recent errors: 150 in last 5 minutes

Recommended Actions:
1. Investigate error logs in Sentry
2. Check deployment history
3. Review database performance
4. Consider rollback if issue persists

Sentry Link: https://sentry.io/...
Health Check: https://your-domain.com/api/cron/health-check
```

---

## Alert Runbooks

### 1. High Error Rate

**Symptoms**:

- Error rate > 1%
- Increased 5xx responses
- User reports of issues

**Investigation Steps**:

1. Check Sentry for recent errors
2. Review recent deployments (last 2 hours)
3. Check database connectivity
4. Verify external service status (Supabase, Resend, etc.)
5. Review server logs for patterns

**Resolution**:

- If deployment-related: Rollback to previous version
- If database-related: Check connection pool, optimize queries
- If external service: Wait for resolution, add fallback

### 2. Slow Response Times

**Symptoms**:

- P95 latency > 1000ms
- User complaints about slowness
- Increased server load

**Investigation Steps**:

1. Check Sentry performance metrics
2. Identify slow endpoints
3. Review database query performance
4. Check cache hit rates
5. Verify external API response times

**Resolution**:

- Add caching for frequently accessed data
- Optimize database queries
- Scale resources if needed
- Add background jobs for expensive operations

### 3. Database Connection Failure

**Symptoms**:

- Health check returns 503
- "Cannot connect to database" errors
- All API requests failing

**Investigation Steps**:

1. Check Supabase dashboard status
2. Verify database connection string
3. Check connection pool limits
4. Review database logs

**Resolution**:

- Wait for Supabase to resolve (if service issue)
- Restart application (if connection pool exhausted)
- Scale database (if resource constraints)

---

## Alert Testing

### Test Procedure

1. **Trigger Test Alert**:

   ```bash
   # Simulate error spike
   curl -X POST https://your-domain.com/api/test/trigger-error
   ```

2. **Verify Alert Delivery**:
   - Check email inbox
   - Check Slack channel
   - Verify Sentry issue created

3. **Test Resolution**:
   - Mark issue as resolved in Sentry
   - Verify resolution notification sent

### Monthly Alert Drill

Conduct monthly alert testing:

- Trigger each alert type
- Verify notification delivery
- Test on-call escalation
- Review and update runbooks

---

## Alert Maintenance

### Weekly Tasks

- Review alert noise (false positives)
- Adjust thresholds if needed
- Update contact information

### Monthly Tasks

- Review alert effectiveness
- Analyze resolution times
- Update runbooks based on learnings
- Test alert channels

### Quarterly Tasks

- Full alert system audit
- Review and update severity levels
- Optimize alert rules
- Conduct tabletop exercises

---

## Implementation Checklist

- [ ] Configure Sentry alerts (error rate, performance, new issues)
- [ ] Set up Vercel cron monitoring
- [ ] Configure external uptime monitor (BetterUptime/Pingdom)
- [ ] Add team email to all alert channels
- [ ] Create Slack #proofound-alerts channel
- [ ] Test all alert types
- [ ] Document on-call rotation (if applicable)
- [ ] Create alert runbooks for common issues
- [ ] Schedule monthly alert drill
- [ ] Review and adjust after first month of production

---

## Contact Information

**Primary On-Call**: [To be assigned]
**Backup On-Call**: [To be assigned]
**Engineering Lead**: [Contact info]
**DevOps Contact**: [Contact info]

---

**Last Review**: 2025-11-04
**Next Review**: After 1 month of production monitoring
