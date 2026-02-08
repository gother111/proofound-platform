# API Documentation - New MVP Features

**Version:** 2.0  
**Last Updated:** November 8, 2025  
**Base URL:** `https://proofound.com/api` (Production) or `http://localhost:3000/api` (Development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Matching & Transparency](#matching--transparency)
3. [Interview Management](#interview-management)
4. [Decision Workflow](#decision-workflow)
5. [Analytics & Metrics](#analytics--metrics)
6. [AI Features](#ai-features)
7. [Profile & Data Management](#profile--data-management)
8. [Admin Endpoints](#admin-endpoints)
9. [Cron Jobs](#cron-jobs)
10. [Error Handling](#error-handling)

---

## Authentication

All endpoints (except public profile snippets) require authentication via Supabase Auth.

**Headers Required:**

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Session Management:**

- Access tokens valid for 1 hour
- Refresh tokens valid for 7 days
- Automatic refresh handled by Supabase client

---

## Matching & Transparency

### GET /api/match/explain/[matchId]

Get detailed match explanation with score breakdown.

**Authentication:** Required (User must own the match)

**Parameters:**

- `matchId` (path): UUID of the match

**Response:**

```json
{
  "success": true,
  "explanation": {
    "overallScore": 0.87,
    "breakdown": {
      "skills": { "score": 0.9, "weight": 0.4, "contribution": 0.36 },
      "values": { "score": 0.85, "weight": 0.3, "contribution": 0.255 },
      "experience": { "score": 0.8, "weight": 0.15, "contribution": 0.12 }
    },
    "pac": {
      "score": 0.92,
      "breakdown": {
        "purpose": 0.95,
        "alignment": 0.9,
        "contribution": 0.91
      }
    },
    "rank": 3,
    "totalCandidates": 47,
    "skillMatches": [
      { "skill": "React", "level": 5, "match": "exact" },
      { "skill": "TypeScript", "level": 4, "match": "close" }
    ]
  }
}
```

**Status Codes:**

- `200`: Success
- `401`: Unauthorized
- `404`: Match not found
- `500`: Server error

---

### POST /api/matches/[id]/snooze

Snooze a match for a specified duration.

**Authentication:** Required

**Parameters:**

- `id` (path): UUID of the match

**Request Body:**

```json
{
  "snoozedUntil": "2025-11-15T10:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "match": {
    "id": "match-uuid",
    "snoozedUntil": "2025-11-15T10:00:00Z"
  }
}
```

---

### GET /api/match/gates

Check if user meets verification gates for an assignment.

**Authentication:** Required

**Query Parameters:**

- `assignmentId`: UUID of assignment

**Response:**

```json
{
  "canProceed": false,
  "gates": [
    {
      "type": "email_verified",
      "met": true,
      "required": true
    },
    {
      "type": "profile_complete",
      "met": false,
      "required": true,
      "message": "Complete your profile with at least 3 skills"
    }
  ],
  "blockingGates": ["profile_complete"]
}
```

---

### GET /api/match/visible-fields/[matchId]

Get fields that will be visible to organization for consent dialog.

**Authentication:** Required (Individual user)

**Parameters:**

- `matchId` (path): UUID of match

**Response:**

```json
{
  "visibleFields": {
    "name": true,
    "email": true,
    "skills": true,
    "topSkills": 5,
    "experience": false,
    "education": false
  },
  "organizationName": "Acme Corp",
  "assignmentTitle": "Senior React Developer"
}
```

---

### GET /api/matching/profile

Get user's matching profile preferences.

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "profile": {
    "id": "profile-uuid",
    "weights": {
      "skills": 0.4,
      "values": 0.3,
      "experience": 0.15,
      "location": 0.1,
      "compensation": 0.05
    },
    "constraints": {
      "requireSkillMatch": true,
      "minimumScore": 0.7
    }
  }
}
```

### POST /api/matching/profile

Create or update matching profile.

**Authentication:** Required

**Request Body:**

```json
{
  "weights": {
    "skills": 0.5,
    "values": 0.25,
    "experience": 0.25
  },
  "constraints": {
    "requireSkillMatch": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "profile": {
    /* Updated profile */
  }
}
```

---

## Interview Management

### POST /api/interviews/schedule

Schedule an interview with video platform integration.

**Authentication:** Required (Organization)

**Request Body:**

```json
{
  "assignmentId": "assignment-uuid",
  "candidateId": "user-uuid",
  "scheduledAt": "2025-11-10T14:00:00Z",
  "duration": 30,
  "platform": "zoom",
  "participantEmails": ["candidate@example.com", "interviewer@example.com"],
  "notes": "Technical interview - React"
}
```

**Response:**

```json
{
  "success": true,
  "interview": {
    "id": "interview-uuid",
    "scheduledAt": "2025-11-10T14:00:00Z",
    "meetingLink": "https://zoom.us/j/123456789",
    "meetingId": "123456789",
    "platform": "zoom"
  }
}
```

**Calendar Invites (.ics):**

- The UI generates a downloadable `.ics` file client-side (no dedicated calendar download API endpoint is currently implemented).

**Platform Options:**

- `zoom`: Zoom meeting
- `google_meet`: Google Meet

**Status Codes:**

- `201`: Interview created
- `400`: Invalid parameters
- `401`: Unauthorized
- `409`: Time slot unavailable

---

### GET /api/integrations/video/status

Check video integration connection status.

**Authentication:** Required

**Response:**

```json
{
  "zoom": {
    "connected": true,
    "expiresAt": "2025-12-01T00:00:00Z"
  },
  "googleMeet": {
    "connected": false,
    "connectUrl": "/api/integrations/google/connect"
  }
}
```

---

### GET /api/integrations/zoom/connect

Initiate Zoom OAuth flow.

**Authentication:** Required

**Response:** 302 Redirect to Zoom OAuth

---

### GET /api/integrations/zoom/callback

Handle Zoom OAuth callback (internal use).

---

### GET /api/integrations/google/connect

Initiate Google OAuth flow.

**Authentication:** Required

**Response:** 302 Redirect to Google OAuth

---

### GET /api/integrations/google/callback

Handle Google OAuth callback (internal use).

---

## Decision Workflow

### POST /api/decisions

Record hiring decision after interview.

**Authentication:** Required (Organization)

**Request Body:**

```json
{
  "interviewId": "interview-uuid",
  "decision": "hire",
  "feedback": "Excellent technical skills, great culture fit",
  "metadata": {
    "offeredCompensation": 120000,
    "startDate": "2025-12-01"
  }
}
```

**Decision Types:**

- `hire`: Offer position
- `reject`: Do not hire
- `maybe`: Need more information
- `hold`: Put on hold

**Response:**

```json
{
  "success": true,
  "decision": {
    "id": "decision-uuid",
    "interviewId": "interview-uuid",
    "decision": "hire",
    "madeAt": "2025-11-08T15:30:00Z",
    "withinSLA": true
  }
}
```

---

### GET /api/decisions/window/[interviewId]

Get decision window status and remaining time.

**Authentication:** Required

**Parameters:**

- `interviewId` (path): UUID of interview

**Response:**

```json
{
  "success": true,
  "window": {
    "deadline": "2025-11-10T14:00:00Z",
    "hoursRemaining": 36.5,
    "isOverdue": false,
    "reminderSent": false,
    "withinSLA": true
  }
}
```

---

## Analytics & Metrics

### POST /api/analytics/web-vitals

Record Core Web Vitals metric.

**Authentication:** Optional (can be anonymous)

**Request Body:**

```json
{
  "metricName": "LCP",
  "value": 1847,
  "rating": "good",
  "delta": 100,
  "id": "metric-id-123",
  "navigationType": "navigate",
  "pagePath": "/app/i/dashboard"
}
```

**Metric Names:**

- `LCP`: Largest Contentful Paint (ms)
- `FID`: First Input Delay (ms)
- `CLS`: Cumulative Layout Shift (score)
- `FCP`: First Contentful Paint (ms)
- `TTFB`: Time to First Byte (ms)

**Response:**

```json
{
  "success": true
}
```

---

### GET /api/analytics/web-vitals

Get aggregated performance metrics (Admin only).

**Authentication:** Required (Admin role)

**Query Parameters:**

- `days`: Number of days to include (default: 7)
- `page`: Filter by page path (optional)

**Response:**

```json
{
  "success": true,
  "metrics": [
    {
      "metric_name": "LCP",
      "sample_count": 1543,
      "avg_value": 1920,
      "p50": 1800,
      "p75": 2100,
      "p95": 2900,
      "good_count": 1200,
      "needs_improvement_count": 243,
      "poor_count": 100
    }
  ],
  "trends": [
    /* Daily breakdown */
  ],
  "pageBreakdown": [
    /* Per-page metrics */
  ]
}
```

---

### POST /api/analytics/dashboard-load-time

Record dashboard load time.

**Authentication:** Required

**Request Body:**

```json
{
  "dashboardType": "individual",
  "loadTimeMs": 1450,
  "tileCount": 6,
  "dataFetchTimeMs": 800,
  "renderTimeMs": 650,
  "pagePath": "/app/i/dashboard"
}
```

**Dashboard Types:**

- `individual`: Individual user dashboard
- `organization`: Organization dashboard
- `admin`: Admin dashboard

---

### GET /api/metrics/all

Get all platform metrics (Admin only).

**Authentication:** Required (Admin role)

**Response:**

```json
{
  "success": true,
  "metrics": {
    "ttfqi": {
      "average": 4.2,
      "median": 3.8,
      "p95": 7.5,
      "unit": "days"
    },
    "ttv": {
      "average": 14.5,
      "median": 12.0,
      "p95": 25.0,
      "unit": "days"
    },
    "ttsc": {
      "average": 45.2,
      "median": 42.0,
      "p95": 65.0,
      "unit": "days"
    },
    "pacLift": {
      "average": 0.15,
      "description": "15% improvement in alignment"
    }
  }
}
```

---

### GET /api/analytics/fairness/report

Get fairness analysis reports (Admin only).

**Authentication:** Required (Admin role)

**Query Parameters:**

- `assignmentId`: Filter by assignment (optional)

**Response:**

```json
{
  "success": true,
  "reports": [
    {
      "id": "report-uuid",
      "assignmentId": "assignment-uuid",
      "generatedAt": "2025-11-08T00:00:00Z",
      "summary": {
        "totalCandidates": 150,
        "demographicBreakdown": {
          /* ... */
        },
        "identifiedGaps": 2
      },
      "reportUrl": "/reports/fairness/report-uuid.md"
    }
  ]
}
```

---

### POST /api/surveys/sus

Submit System Usability Scale survey response.

**Authentication:** Required

**Request Body:**

```json
{
  "responses": [1, 5, 2, 4, 1, 5, 2, 4, 1, 5],
  "context": "post_interview_scheduling",
  "metadata": {
    "feature": "interview_scheduler"
  }
}
```

**Response Array:**

- Array of 10 integers (1-5)
- Scoring: 1 = Strongly Disagree, 5 = Strongly Agree

**Response:**

```json
{
  "success": true,
  "score": 82.5,
  "rating": "Excellent"
}
```

**Rating Scale:**

- `80-100`: Excellent
- `68-79`: Good
- `51-67`: OK
- `0-50`: Poor

---

## AI Features

### POST /api/expertise/auto-suggest

Extract skills from CV/JD text using AI.

**Authentication:** Required

**Request Body:**

```json
{
  "text": "Senior Software Engineer with 5+ years in React and TypeScript...",
  "context": "cv"
}
```

**Context Options:**

- `cv`: Resume/CV
- `jd`: Job Description
- `general`: General text

**Response:**

```json
{
  "success": true,
  "suggestions": [
    {
      "skillName": "React",
      "level": 4,
      "confidence": 0.92,
      "monthsExperience": 60,
      "relevance": "current",
      "taxonomyCode": "react-js",
      "context": "5+ years in React"
    },
    {
      "skillName": "TypeScript",
      "level": 4,
      "confidence": 0.88,
      "monthsExperience": 48,
      "relevance": "current",
      "taxonomyCode": "typescript"
    }
  ],
  "metadata": {
    "summary": "Experienced full-stack developer...",
    "totalExperienceYears": 5,
    "industries": ["Software Development"],
    "roles": ["Engineer", "Developer"],
    "method": "ai"
  }
}
```

**Skill Levels:**

- `1`: Novice
- `2`: Beginner
- `3`: Competent
- `4`: Proficient
- `5`: Expert

---

### POST /api/policy/explain

Get AI-powered plain language explanation of policy text.

**Authentication:** Required

**Request Body:**

```json
{
  "policyText": "Data subjects have the right to obtain...",
  "question": "What does this mean for deleting my account?"
}
```

**Response:**

```json
{
  "success": true,
  "explanation": "This means you can request to delete your account at any time...",
  "relatedQuestions": ["How long does deletion take?", "What data is kept after deletion?"]
}
```

---

## Profile & Data Management

### POST /api/data-import/preview

Preview conflicts before importing JSON profile.

**Authentication:** Required

**Request Body:**

```json
{
  "profileData": {
    "name": "Jane Doe",
    "skills": [{ "name": "Python", "level": 5 }]
  }
}
```

**Response:**

```json
{
  "success": true,
  "conflicts": [
    {
      "field": "skills.Python",
      "currentValue": { "level": 4 },
      "newValue": { "level": 5 },
      "suggestedStrategy": "overwrite",
      "reason": "New value is higher level"
    }
  ]
}
```

---

### POST /api/profile/snippet

Create shareable profile snippet.

**Authentication:** Required

**Request Body:**

```json
{
  "fields": {
    "name": true,
    "headline": true,
    "skills": true,
    "topSkills": 5
  },
  "theme": "auto",
  "format": "card",
  "expiresInDays": 30
}
```

**Format Options:**

- `mini`: Compact badge
- `card`: Standard profile card
- `full`: Complete profile

**Response:**

```json
{
  "success": true,
  "snippet": {
    "id": "snippet-uuid",
    "shareToken": "abc123def456",
    "url": "https://proofound.com/p/abc123def456",
    "embedCode": "<iframe src=\"...\"></iframe>",
    "expiresAt": "2025-12-08T00:00:00Z"
  }
}
```

---

### GET /api/profile/snippet

List user's profile snippets.

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "snippets": [
    {
      "id": "snippet-uuid",
      "url": "https://proofound.com/p/abc123",
      "viewCount": 45,
      "lastViewedAt": "2025-11-07T12:00:00Z",
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

---

### DELETE /api/profile/snippet?id={snippetId}

Delete a profile snippet.

**Authentication:** Required

**Response:**

```json
{
  "success": true
}
```

---

### GET /api/evidence-pack/[candidateId]

Generate and download evidence pack PDF.

**Authentication:** Required (Organization owner)

**Query Parameters:**

- `assignmentId`: UUID of assignment

**Response:** PDF file download

**Headers:**

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="evidence-pack-jane-doe-2025-11-08.pdf"
```

---

### GET /api/user/audit-log

Get user's activity audit log.

**Authentication:** Required

**Query Parameters:**

- `limit`: Number of events (default: 50, max: 200)
- `offset`: Pagination offset (default: 0)

**Response:**

```json
{
  "events": [
    {
      "id": "event-uuid",
      "timestamp": "2025-11-08T10:30:00Z",
      "action": "Updated profile",
      "ipHash": "a1b2c3d4...",
      "device": "Chrome on Windows",
      "metadata": { "fields_updated": ["headline", "bio"] }
    }
  ],
  "total": 234,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

---

## Admin Endpoints

All admin endpoints require `role = 'admin'` in user profile.

### GET /api/analytics/web-vitals

_See Analytics & Metrics section_

### GET /api/metrics/all

_See Analytics & Metrics section_

### GET /api/analytics/fairness/report

_See Analytics & Metrics section_

---

## Cron Jobs

Cron jobs are protected by `CRON_SECRET` in Authorization header.

### POST /api/cron/fairness-report

Generate weekly fairness report.

**Schedule:** Weekly (Monday 00:00 UTC)

**Headers:**

```http
Authorization: Bearer {CRON_SECRET}
```

**Response:**

```json
{
  "success": true,
  "reportsGenerated": 5
}
```

---

### POST /api/cron/decision-reminders

Send decision reminders for overdue interviews.

**Schedule:** Every 6 hours

**Headers:**

```http
Authorization: Bearer {CRON_SECRET}
```

**Response:**

```json
{
  "success": true,
  "remindersSent": 12
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    /* Optional additional info */
  }
}
```

### Common Error Codes

| Code                  | HTTP Status | Description                         |
| --------------------- | ----------- | ----------------------------------- |
| `UNAUTHORIZED`        | 401         | Missing or invalid authentication   |
| `FORBIDDEN`           | 403         | Insufficient permissions            |
| `NOT_FOUND`           | 404         | Resource not found                  |
| `VALIDATION_ERROR`    | 400         | Invalid request parameters          |
| `CONFLICT`            | 409         | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests                   |
| `INTERNAL_ERROR`      | 500         | Server error                        |

---

## Rate Limits

| Endpoint                      | Limit | Window     |
| ----------------------------- | ----- | ---------- |
| `/api/evidence-pack/*`        | 10    | 1 hour     |
| `/api/user/audit-log`         | 100   | 1 hour     |
| `/api/expertise/auto-suggest` | 20    | 1 hour     |
| `/api/policy/explain`         | 50    | 1 hour     |
| General API                   | 1000  | 15 minutes |

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1699459200
```

---

## Changelog

### v2.0 (November 8, 2025)

**Added:**

- Match transparency endpoints (explainer, gates, visible fields)
- Interview scheduling with Zoom/Google Meet integration
- Decision workflow with SLA tracking
- Web Vitals and dashboard load time tracking
- AI skill extraction and policy explanation
- Profile snippet sharing
- Evidence pack PDF export
- User audit log viewer
- SUS survey collection
- Fairness analytics

**Changed:**

- `/api/expertise/auto-suggest` now uses AI instead of keyword matching
- Improved error responses with detailed codes

**Deprecated:**

- None

---

## Support

**Technical Support:** dev@proofound.com  
**Documentation:** https://docs.proofound.com  
**Status Page:** https://status.proofound.com

---

**Last Updated:** November 8, 2025  
**Version:** 2.0
