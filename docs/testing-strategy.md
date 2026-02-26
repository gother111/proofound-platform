# Testing Strategy

> Doc Class: `active`
> Last Verified: `2026-02-26`

**Project**: Proofound MVP
**Last Updated**: 2025-11-04

---

## Overview

This document outlines the comprehensive testing strategy for the Proofound platform, including unit tests, integration tests, E2E tests, and monitoring/alerting configuration.

---

## 1. Unit Tests

### ✅ Implemented

**Location**: `src/**/__tests__/*.test.ts`

**Coverage**:

- ✅ CSRF protection (`src/lib/__tests__/csrf.test.ts`) - 16 tests
- ✅ Rate limiting (`src/lib/__tests__/rate-limit.test.ts`) - 13 tests
- ✅ Analytics metrics (`src/lib/analytics/__tests__/metrics.test.ts`) - 27 tests
- ✅ Matching scorers (`src/lib/core/matching/__tests__/scorers.test.ts`)
- ✅ Matching firewall (`src/lib/core/matching/__tests__/firewall.test.ts`)

**Test Framework**: Vitest

**Running Tests**:

```bash
npm run test                    # Run all unit tests
npm run test -- --watch        # Watch mode
npm run test -- --coverage     # With coverage report
```

---

## 2. Integration Tests

### 📋 Test Plan

Integration tests verify that different modules work together correctly, particularly API endpoints with database operations.

**Priority Endpoints to Test**:

#### P0 - Critical Path

1. **Authentication Flow** (`/api/auth/*`)
   - User signup
   - User login
   - Session management
   - Password reset

2. **Matching Engine** (`/api/core/matching/*`)
   - Profile matching calculation
   - Match result ordering
   - PAC score integration
   - Blind-first anonymization

3. **Contract Lifecycle** (`/api/contracts/*`)
   - Contract creation
   - Contract signing (both parties)
   - Contract state transitions
   - Email notifications triggered

#### P1 - Core Features

4. **Data Export/Import** (`/api/data-export`, `/api/data-import`)
   - Full data export
   - Data import validation
   - Data integrity checks

5. **Metrics API** (`/api/metrics`)
   - TTSC calculation with real data
   - TTFQI calculation with real data
   - PAC lift calculation

6. **Assignment Management** (`/api/assignments/*`)
   - Assignment creation
   - Assignment visibility rules
   - Organization access control

### Integration Test Structure

```typescript
// Example: tests/integration/matching.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { POST as matchProfile } from '@/app/api/core/matching/profile/route';

describe('Matching API Integration', () => {
  beforeEach(async () => {
    // Set up test database state
    await seedTestData();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanTestData();
  });

  it('should return top matches for qualified user', async () => {
    const request = new NextRequest('http://localhost/api/core/matching/profile', {
      method: 'POST',
      body: JSON.stringify({ mode: 'balanced', k: 10 }),
    });

    const response = await matchProfile(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(10);
    expect(data.items[0].score).toBeGreaterThan(0);
  });

  it('should apply PAC scoring correctly', async () => {
    // Test that high PAC matches rank higher
  });

  it('should scrub organization info in results', async () => {
    // Test that org names are not exposed
  });
});
```

**Database Setup for Integration Tests**:

- Use dedicated test database (`.env.test`)
- Seed minimal realistic data
- Test database migrations
- Clean up after each test

---

## 3. End-to-End (E2E) Tests

### ✅ Existing E2E Tests

**Location**: `tests/e2e/*.spec.ts`
**Framework**: Playwright

**Running E2E Tests**:

```bash
npm run test:e2e           # Run all E2E tests headless
npm run test:e2e:ui        # Run with Playwright UI
```

### 📋 Critical E2E Test Scenarios

#### Scenario 1: Individual User Signup to First Match

**Steps**:

1. User visits homepage
2. Clicks "Sign Up" as individual
3. Completes profile setup
4. Adds skills and preferences
5. Navigates to matching page
6. Views first recommended match
7. **Assertion**: First match event emitted for TTFQI

**Test File**: `tests/e2e/individual-signup-to-match.spec.ts`

```typescript
test('Individual: signup to first match', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign Up');

  // Complete signup flow
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('[type="submit"]');

  // Complete onboarding
  await page.click("text=I'm an individual");
  // ... fill out profile

  // Navigate to matching
  await page.goto('/app/i/matching');

  // Wait for matches to load
  await page.waitForSelector('[data-testid="match-card"]');

  // Verify first match shown
  const matchCards = await page.locator('[data-testid="match-card"]').count();
  expect(matchCards).toBeGreaterThan(0);
});
```

#### Scenario 2: Organization Posts Assignment to Acceptance

**Steps**:

1. Org user logs in
2. Creates new assignment
3. Assignment becomes active
4. Candidate views and accepts match
5. Org member reviews interest
6. **Assertion**: Assignment invitation sent

**Test File**: `tests/e2e/org-assignment-to-acceptance.spec.ts`

#### Scenario 3: Complete Contract Signing Flow

**Steps**:

1. Candidate and org agree on match
2. Contract created
3. Candidate signs (attestation)
4. Org member signs (attestation)
5. **Assertion**:
   - Contract signed event emitted for TTSC
   - Email notification sent to both parties

**Test File**: `tests/e2e/contract-signing-flow.spec.ts`

#### Scenario 4: Data Export and Import

**Steps**:

1. User with complete profile
2. Requests data export
3. Downloads JSON file
4. Verifies all data present
5. Imports data to new account
6. **Assertion**: Data integrity maintained

**Test File**: `tests/e2e/data-portability.spec.ts`

### E2E Test Best Practices

1. **Use Page Object Pattern**:

```typescript
// tests/e2e/pages/MatchingPage.ts
export class MatchingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/app/i/matching');
  }

  async getMatchCards() {
    return this.page.locator('[data-testid="match-card"]');
  }

  async selectMatch(index: number) {
    await this.getMatchCards().nth(index).click();
  }
}
```

2. **Add data-testid attributes** to critical UI elements:

```tsx
<div data-testid="match-card" data-assignment-id={assignment.id}>
  {/* Match content */}
</div>
```

3. **Mock external services** (Zoom, Google Meet, Resend):

```typescript
await page.route('**/api/auth/zoom/**', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ meetingUrl: 'https://mock-zoom-url.com' }),
  });
});
```

---

## 4. Privacy & RLS Tests

### ✅ Existing RLS Tests

**Location**: `tests/privacy/*.test.ts`

**Running RLS Tests**:

```bash
npm run test:privacy          # Basic RLS policies
npm run test:privacy:all      # All privacy tests
npm run test:privacy:extended # Extended RLS coverage
npm run test:privacy:watch    # Watch mode
```

**What's Tested**:

- Row-level security policies on all tables
- User isolation (users can only see their own data)
- Organization access control
- Admin privilege escalation prevention

---

## 5. Performance Testing

### Load Testing Strategy

**Tool**: [Artillery](https://www.artillery.io/) or [k6](https://k6.io/)

**Critical Endpoints to Load Test**:

1. `/api/core/matching/profile` - Matching engine (most expensive)
2. `/api/metrics` - Analytics calculations
3. `/api/contracts/*` - Contract operations
4. `/api/data-export` - Data export (large payload)

**Load Test Scenarios**:

#### Scenario 1: Matching Engine Under Load

```yaml
# artillery-matching.yml
config:
  target: 'https://your-production-url.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 180
      arrivalRate: 50
      name: 'Sustained load'
    - duration: 60
      arrivalRate: 100
      name: 'Peak load'

scenarios:
  - name: 'Match profile request'
    flow:
      - post:
          url: '/api/core/matching/profile'
          headers:
            x-csrf-token: '{{ csrfToken }}'
          json:
            mode: 'balanced'
            k: 20
```

**Running Load Tests**:

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run artillery-matching.yml

# Generate HTML report
artillery run --output report.json artillery-matching.yml
artillery report report.json
```

**Performance Targets**:

- Matching API: P95 < 500ms, P99 < 1000ms
- Metrics API (cached): P95 < 200ms
- Data Export: P95 < 3000ms
- Rate limit: Should handle 1000 req/min per user

---

## 6. Production Monitoring & Alerts

### ✅ Implemented Monitoring

**Sentry Error Tracking**: Already configured

- Location: `/src/instrumentation.ts`
- Automatic error capture
- Source maps uploaded to Sentry

### Monitoring Setup

**Services**:

1. **Sentry** (already configured) - Error tracking
2. **Vercel Analytics** (included) - Performance monitoring
3. **Better Uptime** or **Pingdom** - Uptime monitoring

### Critical Metrics to Monitor

#### Application Metrics

1. **Error Rate**
   - Target: < 0.1% of requests
   - Alert: > 1% error rate for 5 minutes

2. **Response Time**
   - Target: P95 < 500ms
   - Alert: P95 > 1000ms for 5 minutes

3. **Rate Limit Hits**
   - Monitor: `/api/metrics` for 429 responses
   - Alert: > 100 rate limit hits/hour

#### Business Metrics

4. **TTSC (Time to Signed Contract)**
   - Target: Median ≤ 30 days
   - Alert: Median > 35 days for 7 days

5. **TTFQI (Time to First Qualified Introduction)**
   - Target: Median ≤ 72 hours
   - Alert: Median > 96 hours for 3 days

6. **PAC Lift**
   - Target: ≥ 20% acceptance lift
   - Alert: < 15% acceptance lift for 7 days

#### Infrastructure Metrics

7. **Database Connection Pool**
   - Monitor: Connection exhaustion
   - Alert: > 80% pool utilization

8. **Redis/KV Cache Hit Rate**
   - Target: > 80% hit rate
   - Alert: < 60% hit rate for 1 hour

9. **API Rate Limit Store**
   - Monitor: Memory usage of rate limit store
   - Alert: > 100MB used

### Alert Configuration

**Sentry Alerts** (already in Sentry UI):

1. **New Error Type**: Notify immediately
2. **Error Volume**: > 100 errors/hour
3. **Performance Regression**: P95 > 1s

**Custom Alerts** (implement via Vercel Cron + alerting service):

```typescript
// app/api/cron/health-check/route.ts
export async function GET() {
  try {
    // Check critical metrics
    const metrics = await getAllMetrics();

    // Alert if TTSC exceeds target
    if (metrics.ttsc && metrics.ttsc.median > 35) {
      await sendAlert({
        severity: 'warning',
        title: 'TTSC Exceeds Target',
        message: `Current TTSC median: ${metrics.ttsc.median} days (target: ≤30 days)`,
      });
    }

    // Check database connectivity
    const dbHealthy = await checkDatabaseHealth();
    if (!dbHealthy) {
      await sendAlert({
        severity: 'critical',
        title: 'Database Connectivity Issue',
        message: 'Unable to connect to database',
      });
    }

    return NextResponse.json({ status: 'healthy' });
  } catch (error) {
    await sendAlert({
      severity: 'critical',
      title: 'Health Check Failed',
      message: error.message,
    });

    return NextResponse.json({ status: 'unhealthy' }, { status: 500 });
  }
}
```

**Cron Schedule** (in `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Logging Best Practices

**Structured Logging** (already implemented via `log()` utility):

```typescript
// Good logging example
log.info('contract.signed', {
  contractId: contract.id,
  userId: user.id,
  organizationId: org.id,
  durationMs: signDuration,
});

// Bad logging example
console.log('Contract signed!'); // No context
```

**Log Levels**:

- `log.debug()`: Development-only details
- `log.info()`: Normal operations (user actions, state changes)
- `log.warn()`: Recoverable issues (rate limit hit, cache miss)
- `log.error()`: Unrecoverable errors (DB connection failed)

---

## 7. Test Coverage Goals

### Current Coverage

- Unit tests: **56 tests** across critical modules
- Integration tests: **0 tests** (to be implemented)
- E2E tests: **Existing** (signup, matching flows)
- RLS tests: **Comprehensive** (all tables covered)

### Coverage Targets

- **Unit Tests**: > 80% coverage for business logic
- **Integration Tests**: 100% coverage of critical API routes
- **E2E Tests**: 100% coverage of critical user paths
- **Load Tests**: All critical endpoints benchmarked

---

## 8. Testing Checklist Before Production

### Pre-Launch Testing Checklist

- [x] Unit tests pass for all critical functions
- [ ] Integration tests pass for all API endpoints
- [ ] E2E tests pass for critical user journeys
- [ ] RLS policies tested and verified
- [ ] Load testing completed with acceptable results
- [ ] Sentry error tracking verified
- [ ] Production monitoring dashboard configured
- [ ] Alert rules configured and tested
- [ ] Backup and restore procedures tested
- [ ] Database migrations tested on production-like data
- [ ] CSRF protection tested on production domain
- [ ] Security headers verified via [securityheaders.com](https://securityheaders.com)
- [ ] GDPR data export tested end-to-end
- [ ] Rate limiting tested under load
- [ ] Caching behavior verified (Redis/KV)
- [ ] Email deliverability tested (Resend)

---

## 9. Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml (required)
name: CI

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]
    types: [opened, reopened, synchronize, ready_for_review]
  pull_request_target:
    branches: [master, develop]
    types: [opened, reopened, synchronize, ready_for_review]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
      - run: npm ci
      - run: npm run docs:freshness
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run db:drift-check
      - run: npm run test
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:auth:real
      - run: npm run test:e2e:landing

  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:a11y
```

---

## 10. Next Steps

1. **Implement Integration Tests**:
   - Create `tests/integration/` directory
   - Write tests for critical API endpoints
   - Set up test database seeding

2. **Expand E2E Coverage**:
   - Add missing critical path tests
   - Implement Page Object pattern
   - Add visual regression testing

3. **Set Up Load Testing**:
   - Install Artillery or k6
   - Create load test scenarios
   - Establish performance baselines

4. **Configure Production Monitoring**:
   - Set up custom metric dashboards
   - Configure alert rules
   - Test alert notification delivery

---

**Document Version**: 1.1
**Last Updated**: 2026-02-26
**Next Review**: Before production launch
