# Proofound API Documentation

**Version:** 1.0  
**Last Updated:** November 5, 2025  
**Audience:** Internal team (Pavlo, Yurii)  
**Purpose:** Document admin and metrics endpoints for internal use

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Metrics API](#2-metrics-api)
3. [Fairness API](#3-fairness-api)
4. [Admin Endpoints](#4-admin-endpoints)
5. [Rate Limiting](#5-rate-limiting)
6. [Error Handling](#6-error-handling)
7. [Examples](#7-examples)

---

## 1. Authentication

All admin and metrics endpoints require authentication.

### Authentication Header

```http
Authorization: Bearer <JWT_TOKEN>
```

### Token Structure

```typescript
{
  sub: string,        // user_id (UUID)
  email: string,      // User email
  role: "individual" | "org_member",
  org_id?: string,    // If organization context
  iat: number,        // Issued at (Unix timestamp)
  exp: number         // Expires at (Unix timestamp)
}
```

### Admin Check

For admin-only endpoints, the system checks if the user email matches the admin list:

```typescript
const adminEmails = ['pavlo@proofound.io', 'yurii@proofound.io'];
```

**Admin routes:**
- `/app/admin/*` - Requires admin email
- `/api/admin/*` - Requires admin email
- `/api/analytics/fairness` - Requires admin email

**Org member routes:**
- `/api/metrics` - Requires organization membership OR admin

---

## 2. Metrics API

### GET /api/metrics

Returns platform metrics for monitoring key performance indicators.

**Authentication:** Required (organization member or admin)

**Rate Limit:** 100 requests per 15 minutes per IP

---

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `metric` | string | No | `all` | Specific metric to fetch |
| `startDate` | string (ISO 8601) | No | 90 days ago | Start date for metric calculation |
| `endDate` | string (ISO 8601) | No | Now | End date for metric calculation |
| `cohort` | string | No | - | Cohort filter (for TTFQI, TTV) |

**Valid `metric` values:**
- `ttsc` - Time to Signed Contract
- `ttfqi` - Time to First Qualified Introduction
- `ttv` - Time to Value
- `pac` - Purpose-Alignment Contribution Lift
- `sus` - System Usability Scale score
- `all` - Return all metrics (default)

---

#### Response Schema

**Success Response (200 OK):**

```typescript
{
  metrics: {
    ttsc: TTSCResult | null,
    ttfqi: TTSCResult | null,
    ttv: TTSCResult | null,
    pac: PACResult | null,
    sus: SUSResult | null
  },
  meta: {
    startDate: string,      // ISO 8601
    endDate: string,        // ISO 8601
    cohort?: string,
    timestamp: string       // ISO 8601 (current time)
  }
}
```

---

#### Metric Result Types

**TTSCResult (also used for TTFQI, TTV):**

```typescript
{
  value: number,           // Median value in specified unit
  median: number,          // Same as value
  p25: number,             // 25th percentile
  p75: number,             // 75th percentile
  mean: number,            // Average
  unit: "hours" | "days",  // Unit of measurement
  timestamp: string,       // ISO 8601
  sampleSize: number,      // Number of data points
  metadata: {
    target: number,        // Target value from PRD
    status: "meeting_target" | "below_target",
    cohort?: string
  }
}
```

**Targets by Metric:**
- **TTSC:** ≤30 days (median)
- **TTFQI:** ≤72 hours (median)
- **TTV:** ≤7 days (median)

---

**PACResult (Purpose-Alignment Contribution):**

```typescript
{
  highPacAcceptanceRate: number,      // % (0-100)
  lowPacAcceptanceRate: number,       // % (0-100)
  acceptanceLift: number,             // % increase (can be negative)
  highPacContractRate: number,        // % (0-100)
  lowPacContractRate: number,         // % (0-100)
  contractLift: number,               // % increase (can be negative)
  meetsAcceptanceTarget: boolean,     // True if lift ≥20%
  meetsContractTarget: boolean,       // True if lift ≥15%
  timestamp: string,                  // ISO 8601
  sampleSize: {
    highPac: number,                  // Top decile matches
    lowPac: number                    // Other matches
  }
}
```

**Targets:**
- **Acceptance Lift:** ≥20% (high-PAC vs low-PAC)
- **Contract Lift:** ≥15% (high-PAC vs low-PAC)

---

**SUSResult (System Usability Scale):**

```typescript
{
  average: number,          // Average SUS score (0-100)
  median: number,           // Median SUS score (0-100)
  min: number,              // Lowest score
  max: number,              // Highest score
  meetsTarget: boolean,     // True if average ≥75
  sampleSize: number,       // Number of completed surveys
  responseRate: number      // Completion rate (0-1)
}
```

**Target:** ≥75 (Good usability)

**SUS Score Interpretation:**
- 0-50: F (Poor)
- 50-60: D (OK)
- 60-70: C (Good)
- 70-80: B (Very Good)
- 80-90: A (Excellent)
- 90-100: A+ (Best Imaginable)

---

#### Examples

**Example 1: Get all metrics**

```bash
curl -X GET \
  'https://proofound.io/api/metrics?metric=all' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response:**

```json
{
  "metrics": {
    "ttsc": {
      "value": 25,
      "median": 25,
      "p25": 18,
      "p75": 32,
      "mean": 26.5,
      "unit": "days",
      "timestamp": "2025-11-05T10:30:00Z",
      "sampleSize": 15,
      "metadata": {
        "target": 30,
        "status": "meeting_target"
      }
    },
    "ttfqi": {
      "value": 48,
      "median": 48,
      "p25": 36,
      "p75": 65,
      "mean": 52.3,
      "unit": "hours",
      "timestamp": "2025-11-05T10:30:00Z",
      "sampleSize": 42,
      "metadata": {
        "target": 72,
        "status": "meeting_target"
      }
    },
    "ttv": {
      "value": 5,
      "median": 5,
      "p25": 3,
      "p75": 7,
      "mean": 5.2,
      "unit": "days",
      "timestamp": "2025-11-05T10:30:00Z",
      "sampleSize": 38,
      "metadata": {
        "target": 7,
        "status": "meeting_target"
      }
    },
    "pac": {
      "highPacAcceptanceRate": 42.5,
      "lowPacAcceptanceRate": 28.3,
      "acceptanceLift": 50.2,
      "highPacContractRate": 18.7,
      "lowPacContractRate": 12.1,
      "contractLift": 54.5,
      "meetsAcceptanceTarget": true,
      "meetsContractTarget": true,
      "timestamp": "2025-11-05T10:30:00Z",
      "sampleSize": {
        "highPac": 125,
        "lowPac": 487
      }
    },
    "sus": {
      "average": 78.2,
      "median": 80,
      "min": 45,
      "max": 95,
      "meetsTarget": true,
      "sampleSize": 24,
      "responseRate": 0.48
    }
  },
  "meta": {
    "startDate": "2025-08-07T00:00:00Z",
    "endDate": "2025-11-05T10:30:00Z",
    "timestamp": "2025-11-05T10:30:00Z"
  }
}
```

---

**Example 2: Get specific metric with date range**

```bash
curl -X GET \
  'https://proofound.io/api/metrics?metric=ttfqi&startDate=2025-11-01&endDate=2025-11-05' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response:**

```json
{
  "metrics": {
    "ttfqi": {
      "value": 54,
      "median": 54,
      "p25": 42,
      "p75": 68,
      "mean": 56.8,
      "unit": "hours",
      "timestamp": "2025-11-05T10:30:00Z",
      "sampleSize": 12,
      "metadata": {
        "target": 72,
        "status": "meeting_target"
      }
    }
  },
  "meta": {
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-11-05T23:59:59Z",
    "timestamp": "2025-11-05T10:30:00Z"
  }
}
```

---

**Example 3: Insufficient data**

If there's not enough data to calculate a metric, it returns `null`:

```json
{
  "metrics": {
    "ttsc": null,
    "ttfqi": {
      "value": 65,
      "median": 65,
      "p25": 52,
      "p75": 78,
      "mean": 67.2,
      "unit": "hours",
      "timestamp": "2025-11-05T10:30:00Z",
      "sampleSize": 8,
      "metadata": {
        "target": 72,
        "status": "meeting_target"
      }
    }
  },
  "meta": {
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-11-05T23:59:59Z",
    "timestamp": "2025-11-05T10:30:00Z"
  }
}
```

---

#### Error Responses

**401 Unauthorized:**

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**403 Forbidden:**

```json
{
  "error": "Unauthorized",
  "message": "Metrics access requires organization membership"
}
```

**429 Too Many Requests:**

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 120
}
```

**Response Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699189200
Retry-After: 120
```

**500 Internal Server Error:**

```json
{
  "error": "Failed to fetch metrics",
  "message": "An unexpected error occurred"
}
```

---

## 3. Fairness API

### GET /api/analytics/fairness

Calculate fairness gap between two demographic cohorts.

**Authentication:** Required (admin only)

**Rate Limit:** 50 requests per 15 minutes per IP

---

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cohortA` | string | Yes | First cohort identifier (e.g., "women", "underrepresented") |
| `cohortB` | string | Yes | Second cohort identifier (e.g., "men", "general") |
| `startDate` | string (ISO 8601) | No | Start date (default: 90 days ago) |
| `endDate` | string (ISO 8601) | No | End date (default: now) |

**Cohort Matching:**

The system matches cohorts by searching opt-in demographic data fields:
- `gender`
- `ethnicity`
- `ageRange`
- `disability`
- `veteranStatus`

Examples:
- `cohortA=women` matches users with `gender` containing "women"
- `cohortA=underrepresented` matches users with `ethnicity` marked as underrepresented
- Case-insensitive matching

---

#### Response Schema

**Success Response (200 OK):**

```typescript
{
  cohortA: {
    name: string,
    introductionRate: number,      // % (0-100)
    contractRate: number,          // % (0-100)
    sampleSize: number             // Number of matches
  },
  cohortB: {
    name: string,
    introductionRate: number,      // % (0-100)
    contractRate: number,          // % (0-100)
    sampleSize: number             // Number of matches
  },
  introductionGap: number,         // Percentage point difference (A - B)
  contractGap: number,             // Percentage point difference (A - B)
  pValueIntroduction: number,      // Statistical significance (0-1)
  pValueContract: number,          // Statistical significance (0-1)
  isSignificant: boolean,          // True if either p-value < 0.05
  timestamp: string                // ISO 8601
}
```

**Interpretation:**
- **Gap > 0:** Cohort A has higher rate than Cohort B (positive outcome for A)
- **Gap < 0:** Cohort A has lower rate than Cohort B (negative outcome for A)
- **p-value < 0.05:** Difference is statistically significant
- **p-value ≥ 0.05:** Difference may be due to random chance

**PRD Target:** No statistically significant negative gap for underrepresented cohorts

---

#### Examples

**Example 1: Compare women vs men**

```bash
curl -X GET \
  'https://proofound.io/api/analytics/fairness?cohortA=women&cohortB=men' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response:**

```json
{
  "cohortA": {
    "name": "women",
    "introductionRate": 42.3,
    "contractRate": 18.5,
    "sampleSize": 156
  },
  "cohortB": {
    "name": "men",
    "introductionRate": 39.7,
    "contractRate": 17.2,
    "sampleSize": 284
  },
  "introductionGap": 2.6,
  "contractGap": 1.3,
  "pValueIntroduction": 0.34,
  "pValueContract": 0.52,
  "isSignificant": false,
  "timestamp": "2025-11-05T10:30:00Z"
}
```

**Interpretation:**
- Women have 2.6 percentage points higher introduction rate (positive)
- Women have 1.3 percentage points higher contract rate (positive)
- Differences are NOT statistically significant (p > 0.05)
- **Conclusion:** No fairness concern detected

---

**Example 2: Significant negative gap detected**

```bash
curl -X GET \
  'https://proofound.io/api/analytics/fairness?cohortA=underrepresented&cohortB=general' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response:**

```json
{
  "cohortA": {
    "name": "underrepresented",
    "introductionRate": 32.1,
    "contractRate": 12.4,
    "sampleSize": 87
  },
  "cohortB": {
    "name": "general",
    "introductionRate": 43.8,
    "contractRate": 19.2,
    "sampleSize": 453
  },
  "introductionGap": -11.7,
  "contractGap": -6.8,
  "pValueIntroduction": 0.02,
  "pValueContract": 0.04,
  "isSignificant": true,
  "timestamp": "2025-11-05T10:30:00Z"
}
```

**Interpretation:**
- Underrepresented cohort has 11.7 percentage points LOWER introduction rate (negative)
- Underrepresented cohort has 6.8 percentage points LOWER contract rate (negative)
- Differences ARE statistically significant (p < 0.05)
- **Conclusion:** ⚠️ Fairness concern detected - investigate matching algorithm

---

#### Error Responses

**400 Bad Request (Missing cohorts):**

```json
{
  "error": "Bad Request",
  "message": "Both cohortA and cohortB are required"
}
```

**403 Forbidden (Non-admin user):**

```json
{
  "error": "Forbidden",
  "message": "Fairness metrics require admin access"
}
```

**404 Not Found (Insufficient data):**

```json
{
  "error": "Insufficient Data",
  "message": "Not enough data to calculate fairness gap. Minimum 40 matches per cohort required.",
  "details": {
    "cohortA": {
      "name": "women",
      "sampleSize": 18
    },
    "cohortB": {
      "name": "men",
      "sampleSize": 35
    }
  }
}
```

---

## 4. Admin Endpoints

### GET /api/admin/users

**Status:** Not implemented yet (planned)

List all users with stats.

**Authentication:** Admin only

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `perPage` (number): Results per page (default: 50, max: 100)
- `status` (string): Filter by status (`active`, `inactive`, `deleted`)
- `role` (string): Filter by role (`individual`, `org_member`)

**Response:**
```typescript
{
  users: Array<{
    id: string,
    email: string,
    displayName: string,
    role: "individual" | "org_member",
    status: "active" | "inactive" | "deleted",
    createdAt: string,
    lastActiveAt: string,
    profileCompletion: number,
    matchCount: number,
    applicationCount: number
  }>,
  pagination: {
    total: number,
    page: number,
    perPage: number,
    totalPages: number
  }
}
```

---

### GET /api/admin/organizations

**Status:** Not implemented yet (planned)

List all organizations with stats.

**Authentication:** Admin only

**Response:**
```typescript
{
  organizations: Array<{
    id: string,
    name: string,
    type: "company" | "ngo" | "government" | "network" | "other",
    status: "active" | "trial" | "suspended",
    memberCount: number,
    assignmentCount: number,
    hireCount: number,
    createdAt: string
  }>,
  pagination: { /* ... */ }
}
```

---

### POST /api/admin/feature-flags

**Status:** Not implemented yet (planned for Phase 2)

Toggle feature flags.

**Authentication:** Admin only

**Request Body:**
```typescript
{
  flag: string,           // Feature flag name
  enabled: boolean,       // Enable or disable
  rollout?: number        // Percentage rollout (0-100)
}
```

**Response:**
```typescript
{
  flag: string,
  enabled: boolean,
  rollout: number,
  updatedAt: string
}
```

---

## 5. Rate Limiting

All API endpoints are rate-limited to prevent abuse.

### Rate Limit Tiers

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/metrics` | 100 requests | 15 minutes |
| `/api/analytics/fairness` | 50 requests | 15 minutes |
| `/api/admin/*` | 100 requests | 15 minutes |
| General API | 100 requests | 15 minutes |

### Rate Limit Headers

Every response includes rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699189200
```

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

### Rate Limit Response

When rate limit is exceeded:

**Status:** 429 Too Many Requests

**Response:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 120
}
```

**Headers:**
```http
Retry-After: 120
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699189200
```

**Best Practice:** Check `X-RateLimit-Remaining` header and throttle requests before hitting limit.

---

## 6. Error Handling

### Standard Error Response Format

```typescript
{
  error: string,        // Error code or type
  message: string,      // Human-readable error message
  details?: any         // Optional additional details
}
```

---

### HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| **200 OK** | Success | Request succeeded |
| **201 Created** | Created | Resource created successfully |
| **400 Bad Request** | Invalid input | Missing required parameters, invalid format |
| **401 Unauthorized** | Not authenticated | Missing or invalid auth token |
| **403 Forbidden** | Not authorized | User lacks required permissions |
| **404 Not Found** | Resource not found | Endpoint or resource doesn't exist |
| **429 Too Many Requests** | Rate limited | Exceeded rate limit |
| **500 Internal Server Error** | Server error | Unexpected server-side error |

---

### Common Error Scenarios

**Missing Authentication:**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Insufficient Permissions:**
```json
{
  "error": "Forbidden",
  "message": "This endpoint requires admin access"
}
```

**Invalid Date Format:**
```json
{
  "error": "Bad Request",
  "message": "Invalid date format. Use ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)"
}
```

**Database Connection Error:**
```json
{
  "error": "Internal Server Error",
  "message": "Database connection failed. Please try again later."
}
```

---

## 7. Examples

### Example 1: Monitor Daily Metrics

**Use Case:** Check key metrics every morning for daily standup.

**Script:**

```bash
#!/bin/bash
# daily-metrics-check.sh

TOKEN="your-auth-token-here"
API_URL="https://proofound.io/api/metrics"

echo "Fetching metrics for today..."

curl -s -X GET "${API_URL}?metric=all" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '{
      ttfqi: .metrics.ttfqi.value,
      ttfqi_unit: .metrics.ttfqi.unit,
      ttfqi_status: .metrics.ttfqi.metadata.status,
      ttv: .metrics.ttv.value,
      ttv_unit: .metrics.ttv.unit,
      sus: .metrics.sus.average,
      sus_meets_target: .metrics.sus.meetsTarget
    }'
```

**Output:**

```json
{
  "ttfqi": 54,
  "ttfqi_unit": "hours",
  "ttfqi_status": "meeting_target",
  "ttv": 5,
  "ttv_unit": "days",
  "sus": 78.2,
  "sus_meets_target": true
}
```

---

### Example 2: Calculate Fairness Gap

**Use Case:** Monthly fairness audit before release.

**Script:**

```bash
#!/bin/bash
# fairness-check.sh

TOKEN="your-admin-token-here"
API_URL="https://proofound.io/api/analytics/fairness"

echo "Checking fairness gaps..."

# Check women vs men
echo "Women vs Men:"
curl -s -X GET "${API_URL}?cohortA=women&cohortB=men" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '{
      introductionGap: .introductionGap,
      contractGap: .contractGap,
      isSignificant: .isSignificant,
      pValueIntro: .pValueIntroduction
    }'

# Check underrepresented vs general
echo -e "\nUnderrepresented vs General:"
curl -s -X GET "${API_URL}?cohortA=underrepresented&cohortB=general" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '{
      introductionGap: .introductionGap,
      contractGap: .contractGap,
      isSignificant: .isSignificant,
      pValueIntro: .pValueIntroduction
    }'
```

---

### Example 3: Export Metrics to CSV

**Use Case:** Generate monthly report for stakeholders.

**Script:**

```python
#!/usr/bin/env python3
# export-metrics.py

import requests
import csv
from datetime import datetime, timedelta

TOKEN = "your-auth-token-here"
API_URL = "https://proofound.io/api/metrics"

# Get metrics for last 30 days
end_date = datetime.now()
start_date = end_date - timedelta(days=30)

response = requests.get(
    API_URL,
    params={
        "metric": "all",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat()
    },
    headers={"Authorization": f"Bearer {TOKEN}"}
)

data = response.json()

# Export to CSV
with open('metrics-report.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['Metric', 'Value', 'Unit', 'Target', 'Status', 'Sample Size'])
    
    if data['metrics']['ttfqi']:
        m = data['metrics']['ttfqi']
        writer.writerow([
            'TTFQI',
            m['median'],
            m['unit'],
            m['metadata']['target'],
            m['metadata']['status'],
            m['sampleSize']
        ])
    
    if data['metrics']['ttv']:
        m = data['metrics']['ttv']
        writer.writerow([
            'TTV',
            m['median'],
            m['unit'],
            m['metadata']['target'],
            m['metadata']['status'],
            m['sampleSize']
        ])
    
    if data['metrics']['sus']:
        m = data['metrics']['sus']
        writer.writerow([
            'SUS',
            round(m['average'], 1),
            'score',
            75,
            'meeting_target' if m['meetsTarget'] else 'below_target',
            m['sampleSize']
        ])

print("Metrics exported to metrics-report.csv")
```

---

### Example 4: JavaScript/TypeScript Client

**Use Case:** Fetch metrics in React admin dashboard.

```typescript
// lib/api/metrics.ts

interface MetricsResponse {
  metrics: {
    ttsc: TTSCResult | null;
    ttfqi: TTSCResult | null;
    ttv: TTSCResult | null;
    pac: PACResult | null;
    sus: SUSResult | null;
  };
  meta: {
    startDate: string;
    endDate: string;
    cohort?: string;
    timestamp: string;
  };
}

export async function fetchMetrics(
  metric: 'all' | 'ttsc' | 'ttfqi' | 'ttv' | 'pac' | 'sus' = 'all',
  options?: {
    startDate?: Date;
    endDate?: Date;
    cohort?: string;
  }
): Promise<MetricsResponse> {
  const params = new URLSearchParams({ metric });
  
  if (options?.startDate) {
    params.append('startDate', options.startDate.toISOString());
  }
  if (options?.endDate) {
    params.append('endDate', options.endDate.toISOString());
  }
  if (options?.cohort) {
    params.append('cohort', options.cohort);
  }
  
  const response = await fetch(`/api/metrics?${params}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch metrics');
  }
  
  return response.json();
}

// Usage in React component with SWR
import useSWR from 'swr';

function MetricsDashboard() {
  const { data, error, isLoading } = useSWR(
    '/api/metrics?metric=all',
    () => fetchMetrics('all'),
    { refreshInterval: 60000 } // Refresh every 60 seconds
  );
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Metrics Dashboard</h1>
      {data.metrics.ttfqi && (
        <div>
          <h2>TTFQI</h2>
          <p>{data.metrics.ttfqi.median} {data.metrics.ttfqi.unit}</p>
          <p>Status: {data.metrics.ttfqi.metadata.status}</p>
        </div>
      )}
      {/* Render other metrics... */}
    </div>
  );
}
```

---

## Appendix A: Response Type Definitions

Full TypeScript definitions for all response types:

```typescript
// Shared types
interface MetricResult {
  value: number;
  unit: 'hours' | 'days' | 'percentage' | 'score';
  timestamp: Date;
  sampleSize: number;
  metadata?: Record<string, any>;
}

interface TTSCResult extends MetricResult {
  median: number;
  p25: number;
  p75: number;
  mean: number;
}

interface PACResult {
  highPacAcceptanceRate: number;
  lowPacAcceptanceRate: number;
  acceptanceLift: number;
  highPacContractRate: number;
  lowPacContractRate: number;
  contractLift: number;
  meetsAcceptanceTarget: boolean;
  meetsContractTarget: boolean;
  timestamp: Date;
  sampleSize: {
    highPac: number;
    lowPac: number;
  };
}

interface SUSResult {
  average: number;
  median: number;
  min: number;
  max: number;
  meetsTarget: boolean;
  sampleSize: number;
  responseRate: number;
}

interface FairnessGapResult {
  cohortA: {
    name: string;
    introductionRate: number;
    contractRate: number;
    sampleSize: number;
  };
  cohortB: {
    name: string;
    introductionRate: number;
    contractRate: number;
    sampleSize: number;
  };
  introductionGap: number;
  contractGap: number;
  pValueIntroduction: number;
  pValueContract: number;
  isSignificant: boolean;
  timestamp: Date;
}
```

---

## Appendix B: Metric Calculation Logic

**Implementation Files:**
- Calculations: `/src/lib/analytics/metrics.ts`
- API Endpoints: `/src/app/api/metrics/route.ts`
- Fairness API: `/src/app/api/analytics/fairness/route.ts`

**Key Functions:**
- `calculateTTSC()` - Time to Signed Contract
- `calculateTTFQI()` - Time to First Qualified Introduction
- `calculateTTV()` - Time to Value
- `calculatePACLift()` - Purpose-Alignment Contribution Lift
- `calculateSUSMetrics()` - System Usability Scale
- `calculateFairnessGap()` - Fairness Gap Analysis

**Statistical Methods:**
- Percentile calculation: Linear interpolation
- Two-proportion z-test: For fairness significance testing
- Standard normal CDF: Using error function approximation

---

## Document Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| Nov 5, 2025 | 1.0 | Initial API documentation | Yurii Bakurov |

---

**Last Updated:** November 5, 2025  
**Next Review:** December 1, 2025  
**Document Owner:** Yurii Bakurov

---

**Questions or Updates?**  
Contact: yurii@proofound.io

