# API Reference

> Doc Class: `active`
> Verification Source: `src/app/api/**`, `package.json`, `.github/workflows/ci.yml`, `vercel.json`
> Last Verified: `2026-02-23`

This is the canonical API documentation for the Proofound platform.

Historical API specs are archived at:

- `docs/archive/legacy-platform/api-reference-history/API_DOCUMENTATION_FINAL_2025-11-08.md`
- `docs/archive/legacy-platform/api-reference-history/API_DOCUMENTATION_NEW_ENDPOINTS_2025-11-07.md`
- `docs/archive/legacy-platform/api-reference-history/api-documentation_2025-11-04.md`

## Base URLs

- Production: `https://proofound.io/api`
- Local: `http://localhost:3000/api`

## Authentication and Security

- Most endpoints require an authenticated Supabase session.
- Mutating endpoints are protected by CSRF checks (`x-csrf-token`).
- Cron endpoints require `Authorization: Bearer <CRON_SECRET>`.
- Security middleware and headers are enforced in `src/middleware.ts` and `next.config.js`.

## Core Endpoint Families

### Health and Monitoring

- `GET /api/health`
- `GET /api/monitoring/perf-status`
- `POST /api/performance/track`

### Auth and Verification

- `GET /api/auth/linkedin`
- `GET /api/auth/linkedin/callback`
- `GET /api/auth/zoom/callback`
- `GET /api/auth/google/callback`
- `POST /api/verification/work-email/send`
- `POST /api/verification/work-email/verify`
- `POST /api/verification/skill/request`
- `POST /api/verification/skill/respond`

### Matching

- `POST /api/core/matching/profile`
- `POST /api/core/matching/assignment`
- `POST /api/core/matching/interest`
- `GET /api/match/explain/[matchId]`
- `POST /api/match/snooze`
- `POST /api/matches/[id]/snooze`

### Assignments, Interviews, Contracts

- `GET|POST /api/assignments`
- `GET|PUT|DELETE /api/assignments/[id]`
- `POST /api/assignments/[id]/publish`
- `GET|POST /api/assignments/[id]/outcomes`
- `GET|POST /api/assignments/[id]/expertise-matrix`
- `GET|POST /api/assignments/[id]/pipeline`
- `POST /api/interviews/schedule`
- `POST /api/interviews/complete`
- `GET|POST /api/contracts`

### Profiles and Organizations

- `GET /api/user/me`
- `GET|PATCH /api/user/account`
- `GET|PATCH /api/user/privacy-settings`
- `POST /api/profile/snippet`
- `GET|POST /api/organizations`
- `GET|PATCH /api/organizations/[orgId]`
- `GET|POST /api/organizations/[orgId]/candidate-invites`
- `PATCH /api/organizations/[orgId]/candidate-invites/[inviteId]`
- `GET /api/candidate-invites/[token]`
- `POST /api/candidate-invites/[token]/claim`
- `POST /api/candidate-invites/[token]/proof-card`

### Analytics and Admin

- `POST /api/analytics/track`
- `GET /api/analytics/dashboard`
- `GET /api/admin/analytics/overview`
- `GET /api/admin/users`
- `GET /api/admin/organizations`
- `POST /api/admin/fairness/generate-note`

### Cron

Configured in `vercel.json`:

- `GET /api/cron/account-deletion-workflow`
- `GET /api/cron/decision-reminders`

Additional cron routes exist for internal and scheduled operations:

- `/api/cron/refresh-matches`
- `/api/cron/performance-check`
- `/api/cron/fairness-note`

## Error Envelope

Most endpoints return JSON with one of the following shapes:

```json
{ "success": true, "data": {} }
```

```json
{ "error": "message", "details": "optional" }
```

## API Contract Change Process

1. Update route implementation in `src/app/api/**`.
2. Add or update tests in `tests/**` or `e2e/**`.
3. Update this file (`docs/API_REFERENCE.md`).
4. If the change is significant, add rationale and verification in `project/changes/entries/`.

## Verification Checklist

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `curl -sS https://proofound.io/api/health`

## Related Docs

- `README.md`
- `docs/ENV_VARIABLES.md`
- `docs/deployment-guide.md`
- `docs/monitoring-alerting.md`
- `project/Documentation.md`
