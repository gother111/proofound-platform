# Performance Testing Guide

## Overview

This guide provides comprehensive instructions for testing the performance of the Proofound application before production deployment. It covers Core Web Vitals, bundle size analysis, API benchmarking, and load testing.

---

## Table of Contents

1. [Core Web Vitals](#core-web-vitals)
2. [Bundle Size Analysis](#bundle-size-analysis)
3. [API Performance Testing](#api-performance-testing)
4. [Database Performance](#database-performance)
5. [Load Testing](#load-testing)
6. [Caching Effectiveness](#caching-effectiveness)
7. [Performance Budgets](#performance-budgets)
8. [Continuous Monitoring](#continuous-monitoring)

---

## Core Web Vitals

Core Web Vitals are Google's metrics for measuring user experience. Target values:

- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Using Lighthouse

**Chrome DevTools:**

1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select:
   - Device: Desktop or Mobile
   - Categories: Performance, Accessibility, Best Practices, SEO
   - Mode: Navigation
4. Click "Analyze page load"
5. Review results and recommendations

**Target Scores:**

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**CLI Usage:**

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse against staging
lighthouse https://your-staging-url.vercel.app \
  --output html \
  --output-path ./lighthouse-report.html \
  --view

# Run against specific pages
lighthouse https://your-staging-url.vercel.app/app/i/home \
  --output json \
  --output-path ./lighthouse-home.json

# Run with mobile emulation
lighthouse https://your-staging-url.vercel.app \
  --preset=mobile \
  --output html \
  --view
```

### PageSpeed Insights

Test your production site with Google's PageSpeed Insights:

1. Go to https://pagespeed.web.dev/
2. Enter your URL
3. Review both mobile and desktop scores
4. Check field data (real user metrics) vs lab data

### Web Vitals Chrome Extension

Install the Web Vitals extension for real-time monitoring:

```bash
# Chrome Web Store
https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma
```

**Usage:**

1. Install extension
2. Navigate to your site
3. Click extension icon to see current page vitals
4. Review LCP, FID, CLS in real-time

---

## Bundle Size Analysis

Monitor JavaScript bundle size to ensure fast page loads.

### Next.js Bundle Analyzer

**Setup:**

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer
```

**Configure in `next.config.js`:**

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Your existing Next.js config
});
```

**Run Analysis:**

```bash
# Build with analysis
ANALYZE=true npm run build

# Opens visualization in browser
# Shows all chunks, their sizes, and contents
```

**What to Look For:**

- Large dependencies (> 100KB)
- Duplicated modules
- Unnecessary imports
- Opportunities for code splitting

### Bundle Size Checks

**Check current bundle sizes:**

```bash
# Build for production
npm run build

# Review output
# Next.js automatically shows:
# - Route sizes
# - First Load JS (critical for LCP)
# - Shared chunks

# Example output:
# Route (app)                              Size     First Load JS
# ┌ ○ /                                    1.2 kB         89.3 kB
# ├ ○ /app/i/home                          2.5 kB         95.6 kB
# └ ○ /app/o/[slug]/home                   3.1 kB         98.2 kB
```

**Bundle Size Budget:**

- First Load JS per route: < 150 KB (gzipped)
- Individual route JS: < 50 KB (gzipped)
- Shared chunks: < 100 KB (gzipped)

### Tree Shaking Verification

Ensure unused code is eliminated:

```typescript
// Check if specific modules are tree-shaken
// Look for warnings during build:
// "Module not found" or "Export not found"

// Example: Check lodash usage
// Bad (imports entire library):
import _ from 'lodash';

// Good (imports only needed function):
import debounce from 'lodash/debounce';
```

---

## API Performance Testing

Test API endpoints for response time and throughput.

### Manual API Testing

**Using curl:**

```bash
# Test with timing
curl -w "\nTime Total: %{time_total}s\n" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-staging-url.vercel.app/api/core/matching/profile

# Expected: < 500ms for most endpoints
```

**Using httpie:**

```bash
# Install httpie
brew install httpie

# Test API endpoint
http POST https://your-staging-url.vercel.app/api/core/matching/profile \
  Authorization:"Bearer YOUR_TOKEN" \
  mode=balanced \
  k=20

# Check response time in output
```

### Apache Bench (ab)

Simple load testing tool:

```bash
# Install (usually pre-installed on macOS/Linux)
which ab

# Run 100 requests with 10 concurrent
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-staging-url.vercel.app/api/health

# Expected results:
# - Mean response time: < 500ms
# - 95th percentile: < 1000ms
# - 99th percentile: < 2000ms
# - Requests per second: > 20
```

**Interpret Results:**

```
Concurrency Level:      10
Time taken for tests:   5.234 seconds
Complete requests:      100
Failed requests:        0
Requests per second:    19.11 [#/sec] (mean)
Time per request:       523.4 [ms] (mean)
Time per request:       52.3 [ms] (mean, across all concurrent requests)

Percentage of requests served within a certain time (ms)
  50%    450
  66%    520
  75%    580
  80%    620
  90%    750
  95%    890
  98%   1100
  99%   1250
 100%   1500 (longest request)
```

**What to Look For:**

- No failed requests
- P50 < 500ms
- P95 < 1000ms
- P99 < 2000ms

### K6 Load Testing

Professional load testing tool:

```bash
# Install k6
brew install k6

# Create test script
cat > load-test.js <<'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s', // Run for 30 seconds
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests < 1s
    http_req_failed: ['rate<0.01'], // Less than 1% errors
  },
};

export default function () {
  const res = http.get('https://your-staging-url.vercel.app/api/health');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
EOF

# Run test
k6 run load-test.js
```

**Advanced K6 Test (API Matching):**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'https://your-staging-url.vercel.app';
const TOKEN = __ENV.AUTH_TOKEN; // Pass via -e AUTH_TOKEN=xxx

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  };

  // Test matching endpoint
  const matchPayload = JSON.stringify({
    mode: 'balanced',
    k: 20,
  });

  const res = http.post(`${BASE_URL}/api/core/matching/profile`, matchPayload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has results': (r) => JSON.parse(r.body).items.length > 0,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

**Run with environment variable:**

```bash
k6 run -e AUTH_TOKEN=your_token_here load-test.js
```

---

## Database Performance

### Query Performance Analysis

**Using Supabase Dashboard:**

1. Go to Supabase dashboard
2. Navigate to "Database" → "Query Performance"
3. Review slow queries (> 100ms)
4. Check for:
   - Missing indexes
   - Sequential scans (should be index scans)
   - High execution counts

**Using `EXPLAIN ANALYZE`:**

```sql
-- Test matching profile query
EXPLAIN ANALYZE
SELECT * FROM matching_profiles
WHERE profile_id = 'some-uuid';

-- Expected: Index Scan, execution time < 10ms

-- Test paginated conversations query
EXPLAIN ANALYZE
SELECT * FROM conversations
WHERE participant_one_id = 'some-uuid'
ORDER BY last_message_at DESC
LIMIT 20;

-- Expected: Index Scan on idx_conversations_last_message_p1
```

**What to Look For:**

- **Seq Scan** → Add index
- **Execution time > 100ms** → Optimize query or add index
- **Rows >> actual rows** → Update table statistics

### Index Effectiveness

**Check missing indexes:**

```sql
-- Find tables without primary key indexes
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
AND tablename NOT IN (
  SELECT tablename FROM pg_indexes
  WHERE indexname LIKE '%_pkey'
);

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Indexes with idx_scan = 0 are unused (consider removing)
```

**Add recommended indexes:**

```sql
-- Conversations pagination (if not exists)
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_p1
ON conversations(participant_one_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_p2
ON conversations(participant_two_id, last_message_at DESC);

-- Messages pagination
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent
ON messages(conversation_id, sent_at ASC);

-- Assignments by organization
CREATE INDEX IF NOT EXISTS idx_assignments_org_created
ON assignments(org_id, created_at DESC);

-- Skills by profile
CREATE INDEX IF NOT EXISTS idx_skills_profile
ON skills(profile_id);

-- Organization members by user
CREATE INDEX IF NOT EXISTS idx_org_members_user_status
ON organization_members(user_id, status);
```

### Connection Pooling

**Verify connection pool configuration:**

```typescript
// Check DATABASE_URL includes connection pooler
// Should use port 6543 (pooler) not 5432 (direct)
// Example: postgresql://user:pass@host:6543/db

// Supabase: Use "Transaction" mode pooler for Next.js
```

---

## Load Testing

### Vercel Load Testing

Test your deployed application under load:

**Using Artillery:**

```bash
# Install Artillery
npm install -g artillery

# Create test configuration
cat > artillery-test.yml <<'EOF'
config:
  target: "https://your-staging-url.vercel.app"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"
    - duration: 60
      arrivalRate: 20
      name: "Stress test"
  http:
    timeout: 10
scenarios:
  - name: "Browse and match"
    flow:
      - get:
          url: "/"
      - get:
          url: "/app/i/home"
          headers:
            Authorization: "Bearer {{ $processEnvironment.AUTH_TOKEN }}"
      - post:
          url: "/api/core/matching/profile"
          headers:
            Authorization: "Bearer {{ $processEnvironment.AUTH_TOKEN }}"
            Content-Type: "application/json"
          json:
            mode: "balanced"
            k: 20
      - think: 5
EOF

# Run test
AUTH_TOKEN=your_token artillery run artillery-test.yml
```

**Interpret Results:**

```
Summary report @ 14:23:45(+0000)
  Scenarios launched:  1800
  Scenarios completed: 1795
  Requests completed:  5385
  Mean response/sec: 29.92
  Response time (msec):
    min: 45
    max: 3421
    median: 234
    p95: 892
    p99: 1456
  Scenario duration (msec):
    min: 567
    max: 8934
    median: 3421
    p95: 6234
    p99: 7891
  Errors:
    ETIMEDOUT: 5
```

**What to Look For:**

- Scenario completion rate > 99%
- P95 response time < 1000ms
- P99 response time < 2000ms
- Minimal errors (< 1%)

### Database Load Testing

Test database under concurrent load:

```bash
# Using pgbench (PostgreSQL benchmark tool)
# Note: Usually requires direct database access

# Initialize test database
pgbench -i -s 10 your_database

# Run benchmark (10 clients, 1000 transactions each)
pgbench -c 10 -t 1000 your_database

# Expected results:
# - tps (transactions per second): > 100
# - latency average: < 100ms
```

---

## Caching Effectiveness

### Vercel KV Cache Hit Rate

**Monitor cache performance:**

```typescript
// Add to cache utility (src/lib/cache.ts)
let cacheHits = 0;
let cacheMisses = 0;

export async function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: hitRate.toFixed(2) + '%',
  };
}

// Add to getOrSet function
if (cached) {
  cacheHits++;
} else {
  cacheMisses++;
}
```

**Create monitoring endpoint:**

```typescript
// src/app/api/admin/cache-stats/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCacheStats } from '@/lib/cache';

export async function GET() {
  const user = await requireAuth();
  // Add admin check

  const stats = getCacheStats();
  return NextResponse.json(stats);
}
```

**Target Metrics:**

- Cache hit rate: > 70%
- Average cache retrieval time: < 10ms

### Testing Cache TTL

**Verify cache expiration:**

```bash
# Request 1: Cache miss (cold)
curl -w "\nTime: %{time_total}s\n" \
  https://your-staging-url.vercel.app/api/expertise/taxonomy | head -1

# Request 2: Cache hit (warm) - should be faster
curl -w "\nTime: %{time_total}s\n" \
  https://your-staging-url.vercel.app/api/expertise/taxonomy | head -1

# Wait for TTL expiration (24 hours for taxonomy)
# Request 3: Cache miss again
```

---

## Performance Budgets

Set performance budgets to prevent regressions:

### Page Load Budgets

```javascript
// performance-budget.json
{
  "budgets": [
    {
      "path": "/*",
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 150
        },
        {
          "resourceType": "style",
          "budget": 50
        },
        {
          "resourceType": "document",
          "budget": 18
        },
        {
          "resourceType": "total",
          "budget": 350
        }
      ],
      "resourceCounts": [
        {
          "resourceType": "script",
          "budget": 10
        }
      ]
    }
  ]
}
```

**Enforce in CI:**

```bash
# Add to package.json scripts
"scripts": {
  "performance:check": "lighthouse https://your-staging-url.vercel.app --budget-path=./performance-budget.json --output=json"
}
```

### API Performance Budgets

| Endpoint                           | P50     | P95      | P99      |
| ---------------------------------- | ------- | -------- | -------- |
| `/api/expertise/taxonomy` (cached) | < 50ms  | < 100ms  | < 200ms  |
| `/api/core/matching/profile`       | < 500ms | < 1000ms | < 2000ms |
| `/api/messages`                    | < 200ms | < 400ms  | < 800ms  |
| `/api/conversations`               | < 200ms | < 400ms  | < 800ms  |
| `/api/assignments`                 | < 300ms | < 600ms  | < 1200ms |

---

## Continuous Monitoring

### Vercel Analytics

**Setup:**

1. Go to Vercel dashboard → Your project → Analytics
2. Enable Web Analytics (free tier available)
3. Deploys automatically start collecting metrics

**Metrics Tracked:**

- Page views
- Core Web Vitals (LCP, FID, CLS)
- Real user monitoring
- Geographic distribution
- Device breakdown

**Review Regularly:**

- Check Web Vitals trends
- Identify slow pages
- Monitor regressions after deployments

### Sentry Performance Monitoring

**Enable Performance Monitoring:**

```typescript
// instrumentation-client.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  integrations: [Sentry.browserTracingIntegration()],
});

// sentry.server.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  integrations: [Sentry.httpIntegration()],
});
```

**Monitor in Sentry Dashboard:**

- Transaction performance
- Slow database queries
- API response times
- Frontend render times

### Custom Performance Logging

**Add performance logging to critical operations:**

```typescript
// Example: Matching engine performance
const startTime = Date.now();

const results = await computeMatches(userId, params);

const duration = Date.now() - startTime;

log.info('match.profile.computed', {
  userId,
  poolSize: activeAssignments.length,
  resultCount: results.length,
  durationMs: duration,
});

// Alert if slow
if (duration > 2000) {
  log.warn('match.profile.slow', {
    userId,
    durationMs: duration,
  });
}
```

---

## Pre-Production Performance Checklist

Before deploying to production, verify:

### Core Web Vitals

- [ ] LCP < 2.5s on all critical pages
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Lighthouse Performance score > 90

### Bundle Size

- [ ] First Load JS < 150 KB per route
- [ ] No duplicate dependencies in bundle
- [ ] Tree shaking working correctly
- [ ] Code splitting for large components

### API Performance

- [ ] All API endpoints P95 < 1s
- [ ] Cache hit rate > 70%
- [ ] No N+1 query patterns
- [ ] Database queries < 100ms

### Load Testing

- [ ] Site handles 20 concurrent users without errors
- [ ] Response times stable under load
- [ ] No memory leaks during extended testing
- [ ] Database connections properly pooled

### Monitoring

- [ ] Vercel Analytics enabled
- [ ] Sentry performance monitoring configured
- [ ] Performance logging in place
- [ ] Alerts configured for regressions

---

## Troubleshooting Performance Issues

### Slow Page Loads

**Diagnose:**

1. Run Lighthouse to identify bottleneck
2. Check Network tab for slow resources
3. Review bundle size analysis

**Common Fixes:**

- Lazy load images: Use Next.js `<Image>` component
- Code split large components: Use `dynamic()` import
- Reduce JavaScript bundle: Remove unused dependencies
- Optimize images: Compress and use WebP format

### Slow API Responses

**Diagnose:**

1. Check Sentry for slow transactions
2. Review database query performance
3. Check cache hit rate

**Common Fixes:**

- Add database indexes
- Implement caching for expensive operations
- Optimize database queries (reduce joins)
- Use connection pooling

### High Memory Usage

**Diagnose:**

```typescript
// Add memory monitoring
const used = process.memoryUsage();
log.info('memory.usage', {
  heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
  heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
  external: Math.round(used.external / 1024 / 1024) + 'MB',
});
```

**Common Fixes:**

- Close database connections properly
- Clear caches periodically
- Avoid storing large objects in memory
- Use streaming for large responses

---

## Resources

- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [K6 Load Testing](https://k6.io/docs/)
- [Artillery Load Testing](https://artillery.io/docs/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Sentry Performance](https://docs.sentry.io/product/performance/)

---

**Last Updated:** 2025-11-03
