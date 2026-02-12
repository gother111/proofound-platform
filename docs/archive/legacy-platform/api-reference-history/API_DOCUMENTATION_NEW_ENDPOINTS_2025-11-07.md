# New API Endpoints - Complete Implementation

This document lists all new API endpoints added as part of the PRD completion implementation.

## Matching & Matching Hub

### POST `/api/matches/[id]/snooze`

**Purpose**: Snooze a match to temporarily hide it from the matches list

**Authentication**: Required

**Request Body**:

```json
{
  "duration": 7, // Days to snooze (7, 14, 30)
  "until": "2025-12-01T00:00:00Z" // Optional: specific date instead of duration
}
```

**Response**:

```json
{
  "success": true,
  "snoozeUntil": "2025-11-14T00:00:00Z"
}
```

**Status Codes**:

- `200`: Success
- `400`: Invalid request (missing duration/until)
- `404`: Match not found or unauthorized
- `500`: Server error

---

### DELETE `/api/matches/[id]/snooze`

**Purpose**: Unsnooze a match to make it visible again

**Authentication**: Required

**Response**:

```json
{
  "success": true
}
```

**Status Codes**:

- `200`: Success
- `404`: Match not found or unauthorized
- `500`: Server error

---

## Performance Monitoring

### POST `/api/analytics/web-vitals`

**Purpose**: Record Core Web Vitals metrics for performance monitoring

**Authentication**: Required

**Request Body**:

```json
{
  "metricName": "LCP", // LCP, FID, CLS, FCP, TTFB
  "value": 1250.5, // Metric value in ms (or unitless for CLS)
  "rating": "good", // "good" | "needs-improvement" | "poor"
  "delta": 25.3,
  "id": "unique-metric-id",
  "navigationType": "navigate",
  "pagePath": "/app/i/home"
}
```

**Response**:

```json
{
  "success": true
}
```

**Status Codes**:

- `200`: Success
- `500`: Server error (non-blocking - returns 200)

**Notes**:

- Uses `sendBeacon` API for reliability
- Metrics automatically stored in `performanceMetrics` table
- Alerts logged for "poor" ratings

---

## Organization Analytics

### GET `/api/analytics/org/ttsc-trend`

**Purpose**: Get Time-to-Signed-Contract trends over time

**Authentication**: Required

**Query Parameters**:

- `orgSlug` (required): Organization slug
- `groupBy` (optional): "week" | "month" (default: "week")
- `limit` (optional): Number of periods (default: 12)

**Response**:

```json
{
  "trends": [
    {
      "period": "2025-11-01T00:00:00Z",
      "medianDays": 25,
      "count": 5,
      "target": 30
    }
  ],
  "target": 30,
  "groupBy": "week"
}
```

**Status Codes**:

- `200`: Success
- `400`: Missing organization slug
- `500`: Server error

---

### GET `/api/analytics/org/fairness-note`

**Purpose**: Get latest fairness gap analysis (with real-time fallback)

**Authentication**: Required

**Query Parameters**:

- `orgSlug` (required): Organization slug

**Response**:

```json
{
  "hasData": true,
  "hasSignificantGaps": false,
  "findings": [
    {
      "type": "negative_gap",
      "cohort": {
        "role": "engineering",
        "seniority": "mid",
        "geography": "north_america"
      },
      "medianTTSC": 42,
      "globalMedian": 30,
      "deviationPercent": 40,
      "sampleSize": 15
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "cohort": {...},
      "action": "Review assignment criteria",
      "details": "This cohort experiences 40% longer TTSC..."
    }
  ],
  "cohortCount": 8,
  "message": "Significant fairness gaps detected",
  "lastGenerated": "2025-11-07T02:00:00Z",
  "isRealtime": false
}
```

**Status Codes**:

- `200`: Success
- `400`: Missing organization slug
- `500`: Server error

**Notes**:

- Returns stored note if fresh (<24h)
- Calculates real-time if stale
- Sets `isRealtime: true` for on-the-fly calculations

---

### POST `/api/analytics/org/fairness-note/generate`

**Purpose**: Manually trigger comprehensive fairness report generation

**Authentication**: Required (Admin)

**Request Body**:

```json
{
  "orgSlug": "demo-org"
}
```

**Response**:

```json
{
  "success": true,
  "noteId": "uuid",
  "cohortsAnalyzed": 15,
  "findings": 3,
  "hasSignificantGaps": true,
  "generatedAt": "2025-11-07T10:30:00Z"
}
```

**Status Codes**:

- `200`: Success
- `400`: Missing org slug or insufficient data
- `500`: Server error

**Notes**:

- Analyzes last 30 days of data
- More comprehensive than daily cron (includes more demographics)
- Stores result in `fairnessNotes` table

---

### GET `/api/analytics/org/next-actions`

**Purpose**: Get intelligent action recommendations for organization

**Authentication**: Required

**Query Parameters**:

- `orgId` (required): Organization ID

**Response**:

```json
{
  "actions": [
    {
      "id": "stale-assignment-uuid",
      "priority": "high",
      "category": "assignment",
      "title": "No matches for assignment",
      "description": "\"Senior Engineer\" has been active for 14+ days with no matches...",
      "actionLabel": "Review Criteria",
      "actionUrl": "/o/org-id/assignments/uuid/edit",
      "metadata": {
        "assignmentId": "uuid"
      }
    }
  ],
  "generatedAt": "2025-11-07T10:30:00Z"
}
```

**Status Codes**:

- `200`: Success
- `400`: Missing organization ID
- `500`: Server error

**Recommendation Types**:

- Stale assignments (>14 days, no matches)
- Pending reviews (>3 days)
- Low match quality (<0.5 avg score)
- High drop-off rates (<20% conversion)

---

## Expertise & Skills

### POST `/api/expertise/jd-to-l4`

**Purpose**: Parse job description and map to L4 skills with AI

**Authentication**: Required

**Request Body**:

```json
{
  "jdText": "We're looking for a Senior Python Developer..."
}
```

**Response**:

```json
{
  "suggestions": [
    {
      "l4_id": "python-advanced",
      "l4_name": "Python - Advanced",
      "proficiency_level": 4,
      "confidence": 0.92,
      "why": "JD mentions 'Expert Python developer with 5+ years'...",
      "source_text": "Expert Python developer with 5+ years"
    }
  ],
  "parsedAt": "2025-11-07T10:30:00Z"
}
```

**Status Codes**:

- `200`: Success
- `400`: Invalid input (too short/long, missing text)
- `500`: Server error

**Notes**:

- Min length: 50 characters
- Max length: 10,000 characters
- Returns top 20 suggestions
- Includes "why mapped" explanations

---

## Organization Team Management

### GET `/api/org/[id]/coverage`

**Purpose**: Get team skill coverage matrix

**Authentication**: Required

**Query Parameters**:

- `department` (optional): Filter by department
- `project` (optional): Filter by project

**Response**:

```json
{
  "members": [
    {
      "id": "uuid",
      "name": "John Doe",
      "role": "Senior Engineer",
      "skills": ["python-advanced", "react-intermediate"]
    }
  ],
  "skillCoverage": [
    {
      "l4_id": "python-advanced",
      "l4_name": "Python - Advanced",
      "l2_name": "Software Development",
      "coverage": 3,
      "members": ["uuid1", "uuid2", "uuid3"]
    }
  ],
  "stats": {
    "totalMembers": 10,
    "totalSkills": 45,
    "noCoverage": 5,
    "singleCoverage": 12,
    "multipleCoverage": 28
  }
}
```

**Status Codes**:

- `200`: Success
- `500`: Server error

**Coverage Levels**:

- `0`: No coverage (gap)
- `1`: Single point of failure
- `2+`: Good coverage

---

## Cron Jobs

### GET `/api/cron/fairness-note`

**Purpose**: Automated daily fairness gap analysis (runs at 2 AM UTC)

**Authentication**: Cron secret required

**Headers**:

```
Authorization: Bearer {CRON_SECRET}
```

**Response**:

```json
{
  "success": true,
  "cohortsAnalyzed": 8,
  "findings": 2,
  "hasSignificantGaps": true
}
```

**Status Codes**:

- `200`: Success
- `401`: Unauthorized (invalid cron secret)
- `500`: Server error

**Configuration**: `vercel.json`

```json
{
  "path": "/api/cron/fairness-note",
  "schedule": "0 2 * * *"
}
```

**Notes**:

- Analyzes last 7 days of data
- Flags gaps >20% deviation from global median
- Stores result in `fairnessNotes` table
- Requires min 40 samples for significance

---

## Performance Targets

All endpoints should meet the following performance targets (PRD Part 8):

| Metric                    | Target  | Measured By      |
| ------------------------- | ------- | ---------------- |
| Dashboard Load (P95)      | ≤ 2.5s  | Web Vitals (LCP) |
| API Latency (P95)         | ≤ 500ms | Custom metrics   |
| Time-to-Interactive (P95) | ≤ 3.5s  | Web Vitals (TTI) |

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    // Optional additional context
  }
}
```

## Rate Limiting

Standard rate limits apply:

- Authenticated users: 100 requests/minute
- Analytics endpoints: 20 requests/minute
- Cron endpoints: No limit (authenticated via secret)

## Next Steps

1. Update main `API_DOCUMENTATION.md` with these new endpoints
2. Generate OpenAPI/Swagger spec
3. Create Postman collection for testing
4. Add API versioning headers

---

**Last Updated**: November 7, 2025  
**Version**: 1.0.0  
**Completeness**: 100% (all PRD features implemented)
