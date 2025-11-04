# API Documentation

**Proofound Platform API**
**Version**: 1.0
**Last Updated**: 2025-11-04

---

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

---

## Authentication

All API endpoints (except public endpoints) require authentication via Supabase session cookies.

**Authentication Flow**:
1. User signs in via Supabase Auth
2. Session cookie is automatically set
3. API routes use `requireAuth()` middleware to validate session

**Headers**:
```http
Cookie: sb-<project>-auth-token=<session-token>
x-csrf-token: <csrf-token> (for POST/PATCH/DELETE requests)
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse.

**Default Limits**:
- API endpoints: 30 requests / 60 seconds
- Auth endpoints: More restrictive (configured per endpoint)

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1699564800
```

**Rate Limit Exceeded**:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
```

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

---

## Core Endpoints

### 1. Matching API

#### POST /api/core/matching/profile

Computes top matching assignments for the authenticated user's profile.

**Request**:
```json
{
  "mode": "balanced",  // "mission-first" | "skills-first" | "balanced"
  "k": 20,            // Top k results (max 100)
  "weights": {        // Optional custom weights
    "values": 0.3,
    "skills": 0.4,
    "experience": 0.3
  }
}
```

**Response** (200 OK):
```json
{
  "items": [
    {
      "assignmentId": "uuid",
      "score": 0.87,
      "subscores": {
        "values": 0.9,
        "causes": 0.85,
        "skills": 0.88,
        "experience": 0.82
      },
      "contributions": {
        "values": 0.27,
        "skills": 0.35,
        "experience": 0.25
      },
      "gaps": [
        {
          "id": "skill-react",
          "required": 5,
          "have": 3
        }
      ],
      "missing": ["skill-typescript"],
      "assignment": {
        "id": "uuid",
        "role": "Senior Engineer",
        // Scrubbed: org name not included
      }
    }
  ],
  "meta": {
    "total": 150,
    "returned": 20,
    "durationMs": 123,
    "weights": { "values": 0.3, "skills": 0.4, "experience": 0.3 }
  }
}
```

**Errors**:
- `404`: Matching profile not found
- `429`: Rate limit exceeded
- `500`: Internal server error

---

### 2. Metrics API

#### GET /api/metrics

Returns platform metrics (requires organization membership).

**Query Parameters**:
- `metric` (optional): Specific metric to fetch (`ttsc`, `ttfqi`, `ttv`, `pac`, `all`)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `cohort` (optional): Cohort filter

**Request**:
```http
GET /api/metrics?metric=all
```

**Response** (200 OK):
```json
{
  "metrics": {
    "ttsc": {
      "median": 25.5,
      "p25": 18.2,
      "p75": 32.1,
      "mean": 26.3,
      "unit": "days",
      "sampleSize": 87,
      "metadata": {
        "target": 30,
        "status": "meeting_target"
      }
    },
    "ttfqi": {
      "median": 48.5,
      "p25": 24.0,
      "p75": 68.0,
      "mean": 51.2,
      "unit": "hours",
      "sampleSize": 234,
      "metadata": {
        "target": 72,
        "status": "meeting_target"
      }
    },
    "pac": {
      "highPacAcceptanceRate": 72.5,
      "lowPacAcceptanceRate": 58.3,
      "acceptanceLift": 24.4,
      "highPacContractRate": 45.2,
      "lowPacContractRate": 32.1,
      "contractLift": 40.8,
      "meetsAcceptanceTarget": true,
      "meetsContractTarget": true,
      "sampleSize": {
        "highPac": 120,
        "lowPac": 95
      }
    }
  },
  "meta": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-03-31T23:59:59Z",
    "cohort": null,
    "timestamp": "2024-04-01T10:30:00Z"
  }
}
```

**Errors**:
- `403`: Unauthorized (not an org member)
- `429`: Rate limit exceeded
- `500`: Internal server error

---

### 3. Data Export API

#### GET /api/data-export

Exports all user data for GDPR compliance.

**Request**:
```http
GET /api/data-export
```

**Response** (200 OK):
Downloads a JSON file with all user data.

**Response Headers**:
```http
Content-Type: application/json
Content-Disposition: attachment; filename="proofound-data-export-<user-id>-<date>.json"
```

**Response Body**:
```json
{
  "exportedAt": "2024-04-01T10:30:00Z",
  "userId": "uuid",
  "profile": {
    "core": { /* profile data */ },
    "individual": { /* individual profile data */ },
    "matching": { /* matching profile data */ }
  },
  "skills": {
    "skills": [ /* skills array */ ],
    "proofs": [ /* skill proofs array */ ]
  },
  "workExperience": {
    "projects": [ /* projects array */ ],
    "experiences": [ /* experiences array */ ],
    "education": [ /* education array */ ]
  },
  "matching": {
    "matches": [ /* matches array */ ],
    "interests": [ /* match interests array */ ]
  },
  "contracts": [ /* contracts array */ ],
  "analytics": {
    "events": [ /* analytics events array */ ]
  },
  "metadata": {
    "version": "1.0",
    "dataProtectionNotice": "...",
    "rightsNotice": "..."
  }
}
```

**Errors**:
- `401`: Unauthorized
- `500`: Internal server error

---

### 4. Data Import API

#### POST /api/data-import

Imports user data from a previous export.

**Request**:
```json
{
  "version": "1.0",
  "profile": {
    "individual": { /* data */ },
    "matching": { /* data */ }
  },
  "skills": {
    "skills": [ /* skills array */ ]
  },
  "workExperience": {
    "projects": [ /* projects array */ ],
    "experiences": [ /* experiences array */ ]
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "results": {
    "imported": [
      "individual_profile",
      "matching_profile",
      "skills (15 items)",
      "projects (5 items)"
    ],
    "skipped": [],
    "errors": []
  },
  "message": "Successfully imported 4 data types"
}
```

**Errors**:
- `400`: Invalid input data format
- `401`: Unauthorized
- `500`: Internal server error

---

### 5. Contract API

#### GET /api/contracts/[id]

Get a specific contract by ID.

**Request**:
```http
GET /api/contracts/abc123
```

**Response** (200 OK):
```json
{
  "contract": {
    "id": "abc123",
    "userId": "user-uuid",
    "orgId": "org-uuid",
    "assignmentId": "assignment-uuid",
    "contractType": "full-time",
    "userAttestation": true,
    "orgAttestation": false,
    "signedAt": null,
    "startDate": "2024-05-01",
    "endDate": "2025-05-01",
    "compensationAmount": 120000,
    "compensationCurrency": "USD",
    "compensationPeriod": "yearly",
    "createdAt": "2024-04-01T10:00:00Z",
    "updatedAt": "2024-04-01T10:30:00Z"
  }
}
```

**Errors**:
- `404`: Contract not found or access denied
- `401`: Unauthorized
- `500`: Internal server error

---

#### PATCH /api/contracts/[id]

Update a contract (add attestation, update details).

**Request**:
```json
{
  "userAttestation": true,
  "notes": "Contract terms agreed"
}
```

**Response** (200 OK):
```json
{
  "contract": {
    "id": "abc123",
    "userAttestation": true,
    "orgAttestation": false,
    "updatedAt": "2024-04-01T11:00:00Z"
    // ... other fields
  }
}
```

**Events Triggered**:
- When both attestations are `true`:
  - `contract_signed` analytics event emitted
  - Email notification sent to both parties

**Errors**:
- `400`: Invalid input
- `404`: Contract not found
- `401`: Unauthorized
- `500`: Internal server error

---

### 6. CSRF Token API

#### GET /api/csrf-token

Returns a CSRF token for use in mutating requests.

**Request**:
```http
GET /api/csrf-token
```

**Response** (200 OK):
```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Response Headers**:
Sets `csrf_token` httpOnly cookie.

**Usage**:
Include the token in `x-csrf-token` header for all POST/PATCH/DELETE requests:

```javascript
const response = await fetch('/api/csrf-token');
const { token } = await response.json();

await fetch('/api/contracts/abc123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': token,
  },
  body: JSON.stringify({ userAttestation: true }),
});
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": [ /* Optional: validation errors, etc. */ ]
}
```

**Common HTTP Status Codes**:
- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page

**Response**:
```json
{
  "items": [ /* data */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Webhooks

### Veriff Webhook

#### POST /api/verification/veriff/webhook

Receives identity verification status updates from Veriff.

**Headers**:
```http
X-Signature: <hmac-sha256-signature>
```

**Request**:
```json
{
  "status": "approved",
  "verification": {
    "id": "veriff-session-id",
    "code": 9001,
    "person": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Response** (200 OK):
```json
{
  "status": "received"
}
```

---

## SDK / Client Libraries

### JavaScript/TypeScript

```typescript
import { ProofoundClient } from '@proofound/sdk';

const client = new ProofoundClient({
  baseUrl: 'https://your-domain.com/api',
});

// Get matches
const matches = await client.matching.getMatches({
  mode: 'balanced',
  k: 20,
});

// Get metrics
const metrics = await client.metrics.getAll();

// Export data
const exportData = await client.data.export();
```

---

## Rate Limit Best Practices

1. **Cache responses** when possible
2. **Respect `Retry-After` header** on 429 responses
3. **Implement exponential backoff** for retries
4. **Use webhooks** instead of polling when available

---

## Security Best Practices

1. **Always include CSRF token** in mutating requests
2. **Never expose session tokens** in client-side code
3. **Validate all inputs** on the client side before sending
4. **Use HTTPS** in production
5. **Rotate credentials** regularly

---

## Changelog

### v1.0 (2025-11-04)
- Initial API documentation
- Added CSRF protection requirement
- Added rate limiting documentation
- Added data export/import endpoints

---

## Support

For API support, contact: [support@proofound.com](mailto:support@proofound.com)

For bug reports: [GitHub Issues](https://github.com/your-org/proofound/issues)
