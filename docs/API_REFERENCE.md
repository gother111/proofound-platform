# API Reference

> Doc Class: `active`
> Verification Source: `src/app/api/**/route.ts`, `src/middleware.ts`, `package.json`, `.github/workflows/ci.yml`, `vercel.json`
> Last Verified: `2026-04-09`

Canonical API documentation generated from the current App Router route handlers under `src/app/api/**/route.ts`.

## Generation Method

- Source of truth: filesystem route scan of `src/app/api/**/route.ts`.
- HTTP methods: parsed from exported handler functions (`GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS`).
- Auth tier: heuristic classification from route path + handler source signals.
- Regenerate with: `node scripts/generate-api-reference.mjs`.

## Base URLs

- Production: `https://proofound.io/api`
- Local: `http://localhost:3000/api`

## Security Model (Operational)

- Session routes rely on authenticated Supabase user context.
- Mutating routes are typically CSRF-protected via middleware and route-level checks.
- Cron routes require `Authorization: Bearer <CRON_SECRET>`.
- Service routes may use privileged Supabase/admin operations and must remain server-only.

## Coverage Summary

- Total route handlers: **118**
- Auth tier counts: `public=63`, `session=43`, `service=2`, `cron=10`
- Family count: **29**

## Endpoint Inventory

### admin

| Methods | Path                                      | Auth Tier | Notes | Source                                                    |
| ------- | ----------------------------------------- | --------- | ----- | --------------------------------------------------------- |
| `GET`   | `/api/admin/audit`                        | `public`  | -     | `src/app/api/admin/audit/route.ts`                        |
| `GET`   | `/api/admin/internal-ops/queues`          | `public`  | -     | `src/app/api/admin/internal-ops/queues/route.ts`          |
| `PATCH` | `/api/admin/internal-ops/queues/[id]`     | `public`  | -     | `src/app/api/admin/internal-ops/queues/[id]/route.ts`     |
| `GET`   | `/api/admin/organizations/[orgId]/audit`  | `public`  | -     | `src/app/api/admin/organizations/[orgId]/audit/route.ts`  |
| `POST`  | `/api/admin/organizations/[orgId]/verify` | `public`  | -     | `src/app/api/admin/organizations/[orgId]/verify/route.ts` |

### analytics

| Methods | Path                        | Auth Tier                   | Notes                           | Source                                      |
| ------- | --------------------------- | --------------------------- | ------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `POST`  | `/api/analytics/events`     | `public`                    | legacy/compat markers in source | `src/app/api/analytics/events/route.ts`     |
| `POST`  | `/api/analytics/tour-event` | `public`                    | -                               | `src/app/api/analytics/tour-event/route.ts` |
| `POST`  | `/api/analytics/track`      | `public`                    | -                               | `src/app/api/analytics/track/route.ts`      |
| `GET    | POST`                       | `/api/analytics/web-vitals` | `session`                       | -                                           | `src/app/api/analytics/web-vitals/route.ts` |

### assignments

| Methods | Path                            | Auth Tier                                | Notes                   | Source                                          |
| ------- | ------------------------------- | ---------------------------------------- | ----------------------- | ----------------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| `GET    | POST`                           | `/api/assignments`                       | `public`                | -                                               | `src/app/api/assignments/route.ts`                       |
| `GET    | PUT                             | DELETE`                                  | `/api/assignments/[id]` | `public`                                        | -                                                        | `src/app/api/assignments/[id]/route.ts` |
| `GET    | POST`                           | `/api/assignments/[id]/expertise-matrix` | `public`                | -                                               | `src/app/api/assignments/[id]/expertise-matrix/route.ts` |
| `GET    | POST`                           | `/api/assignments/[id]/outcomes`         | `public`                | -                                               | `src/app/api/assignments/[id]/outcomes/route.ts`         |
| `GET    | POST`                           | `/api/assignments/[id]/pipeline`         | `public`                | -                                               | `src/app/api/assignments/[id]/pipeline/route.ts`         |
| `POST`  | `/api/assignments/[id]/publish` | `public`                                 | -                       | `src/app/api/assignments/[id]/publish/route.ts` |

### candidate-invites

| Methods | Path                                        | Auth Tier | Notes                           | Source                                                      |
| ------- | ------------------------------------------- | --------- | ------------------------------- | ----------------------------------------------------------- |
| `GET`   | `/api/candidate-invites/[token]`            | `public`  | -                               | `src/app/api/candidate-invites/[token]/route.ts`            |
| `POST`  | `/api/candidate-invites/[token]/claim`      | `session` | -                               | `src/app/api/candidate-invites/[token]/claim/route.ts`      |
| `POST`  | `/api/candidate-invites/[token]/proof-card` | `session` | legacy/compat markers in source | `src/app/api/candidate-invites/[token]/proof-card/route.ts` |

### conversations

| Methods | Path                                         | Auth Tier                                      | Notes     | Source                                                       |
| ------- | -------------------------------------------- | ---------------------------------------------- | --------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `GET    | POST`                                        | `/api/conversations`                           | `session` | -                                                            | `src/app/api/conversations/route.ts`                           |
| `GET    | POST`                                        | `/api/conversations/[conversationId]`          | `session` | -                                                            | `src/app/api/conversations/[conversationId]/route.ts`          |
| `GET    | POST`                                        | `/api/conversations/[conversationId]/messages` | `session` | contains TODO                                                | `src/app/api/conversations/[conversationId]/messages/route.ts` |
| `POST`  | `/api/conversations/[conversationId]/reveal` | `session`                                      | -         | `src/app/api/conversations/[conversationId]/reveal/route.ts` |

### cron

| Methods | Path                                  | Auth Tier  | Notes                   | Source                                                |
| ------- | ------------------------------------- | ---------- | ----------------------- | ----------------------------------------------------- |
| `GET`   | `/api/cron/account-deletion-workflow` | `archived` | returns 410 before work | `src/app/api/cron/account-deletion-workflow/route.ts` |
| `GET`   | `/api/cron/decision-reminders`        | `cron`     | -                       | `src/app/api/cron/decision-reminders/route.ts`        |
| `GET`   | `/api/cron/health-check`              | `cron`     | -                       | `src/app/api/cron/health-check/route.ts`              |
| `GET`   | `/api/cron/launch-synthetic-checks`   | `cron`     | -                       | `src/app/api/cron/launch-synthetic-checks/route.ts`   |
| `GET`   | `/api/cron/performance-check`         | `cron`     | -                       | `src/app/api/cron/performance-check/route.ts`         |
| `GET`   | `/api/cron/process-deletions`         | `archived` | returns 410 before work | `src/app/api/cron/process-deletions/route.ts`         |
| `GET`   | `/api/cron/refresh-matches`           | `cron`     | -                       | `src/app/api/cron/refresh-matches/route.ts`           |
| `GET`   | `/api/cron/refresh-matches-worker`    | `cron`     | -                       | `src/app/api/cron/refresh-matches-worker/route.ts`    |
| `GET`   | `/api/cron/send-deletion-reminders`   | `archived` | returns 410 before work | `src/app/api/cron/send-deletion-reminders/route.ts`   |
| `GET`   | `/api/cron/sla-enforcement`           | `cron`     | -                       | `src/app/api/cron/sla-enforcement/route.ts`           |

### csrf-token

| Methods | Path              | Auth Tier | Notes | Source                            |
| ------- | ----------------- | --------- | ----- | --------------------------------- |
| `GET`   | `/api/csrf-token` | `session` | -     | `src/app/api/csrf-token/route.ts` |

### decisions

| Methods | Path                                  | Auth Tier | Notes | Source                                                |
| ------- | ------------------------------------- | --------- | ----- | ----------------------------------------------------- |
| `POST`  | `/api/decisions`                      | `session` | -     | `src/app/api/decisions/route.ts`                      |
| `GET`   | `/api/decisions/window/[interviewId]` | `session` | -     | `src/app/api/decisions/window/[interviewId]/route.ts` |

### engagement-verifications

| Methods | Path                                 | Auth Tier | Notes | Source                                               |
| ------- | ------------------------------------ | --------- | ----- | ---------------------------------------------------- |
| `PATCH` | `/api/engagement-verifications/[id]` | `public`  | -     | `src/app/api/engagement-verifications/[id]/route.ts` |

### expertise

| Methods  | Path                                               | Auth Tier                                | Notes                           | Source                                                             |
| -------- | -------------------------------------------------- | ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------- |
| `POST`   | `/api/expertise/jd-to-l4`                          | `public`                                 | -                               | `src/app/api/expertise/jd-to-l4/route.ts`                          |
| `GET`    | `/api/expertise/taxonomy`                          | `service`                                | -                               | `src/app/api/expertise/taxonomy/route.ts`                          |
| `GET     | POST`                                              | `/api/expertise/user-skills`             | `public`                        | legacy/compat markers in source                                    | `src/app/api/expertise/user-skills/route.ts`             |
| `PATCH   | DELETE`                                            | `/api/expertise/user-skills/[id]`        | `public`                        | -                                                                  | `src/app/api/expertise/user-skills/[id]/route.ts`        |
| `GET     | POST`                                              | `/api/expertise/user-skills/[id]/proofs` | `public`                        | legacy/compat markers in source                                    | `src/app/api/expertise/user-skills/[id]/proofs/route.ts` |
| `DELETE` | `/api/expertise/user-skills/[id]/proofs/[proofId]` | `public`                                 | legacy/compat markers in source | `src/app/api/expertise/user-skills/[id]/proofs/[proofId]/route.ts` |

### feature-flags

| Methods | Path                 | Auth Tier | Notes                           | Source                               |
| ------- | -------------------- | --------- | ------------------------------- | ------------------------------------ |
| `GET`   | `/api/feature-flags` | `session` | legacy/compat markers in source | `src/app/api/feature-flags/route.ts` |

### feedback

| Methods | Path                          | Auth Tier | Notes | Source                                        |
| ------- | ----------------------------- | --------- | ----- | --------------------------------------------- |
| `GET`   | `/api/feedback/[interviewId]` | `session` | -     | `src/app/api/feedback/[interviewId]/route.ts` |
| `POST`  | `/api/feedback/submit`        | `session` | -     | `src/app/api/feedback/submit/route.ts`        |
| `GET`   | `/api/feedback/token/[token]` | `public`  | -     | `src/app/api/feedback/token/[token]/route.ts` |

### health

| Methods | Path          | Auth Tier | Notes                                                    | Source                        |
| ------- | ------------- | --------- | -------------------------------------------------------- | ----------------------------- |
| `GET`   | `/api/health` | `public`  | Minimal `ok` / `degraded` liveness only; no diagnostics. | `src/app/api/health/route.ts` |

### individual

| Methods | Path                        | Auth Tier | Notes | Source                                      |
| ------- | --------------------------- | --------- | ----- | ------------------------------------------- |
| `GET`   | `/api/individual/readiness` | `public`  | -     | `src/app/api/individual/readiness/route.ts` |

### interviews

| Methods | Path                       | Auth Tier                  | Notes     | Source                                     |
| ------- | -------------------------- | -------------------------- | --------- | ------------------------------------------ | ------------------------------------------ |
| `GET`   | `/api/interviews`          | `session`                  | -         | `src/app/api/interviews/route.ts`          |
| `POST`  | `/api/interviews/cancel`   | `session`                  | -         | `src/app/api/interviews/cancel/route.ts`   |
| `POST`  | `/api/interviews/complete` | `session`                  | -         | `src/app/api/interviews/complete/route.ts` |
| `POST`  | `/api/interviews/edit`     | `session`                  | -         | `src/app/api/interviews/edit/route.ts`     |
| `POST`  | `/api/interviews/no-show`  | `session`                  | -         | `src/app/api/interviews/no-show/route.ts`  |
| `GET    | POST`                      | `/api/interviews/schedule` | `session` | legacy/compat markers in source            | `src/app/api/interviews/schedule/route.ts` |

### location

| Methods | Path                         | Auth Tier | Notes | Source                                       |
| ------- | ---------------------------- | --------- | ----- | -------------------------------------------- |
| `GET`   | `/api/location/autocomplete` | `public`  | -     | `src/app/api/location/autocomplete/route.ts` |

### match

| Methods   | Path                                  | Auth Tier | Notes             | Source                                                |
| --------- | ------------------------------------- | --------- | ----------------- | ----------------------------------------------------- | ------------------------------- | --------------------------------- |
| `UNKNOWN` | `/api/match/assignment`               | `public`  | -                 | `src/app/api/match/assignment/route.ts`               |
| `GET`     | `/api/match/explain/[matchId]`        | `public`  | -                 | `src/app/api/match/explain/[matchId]/route.ts`        |
| `POST`    | `/api/match/gates`                    | `public`  | -                 | `src/app/api/match/gates/route.ts`                    |
| `GET      | POST                                  | DELETE`   | `/api/match/hide` | `public`                                              | legacy/compat markers in source | `src/app/api/match/hide/route.ts` |
| `UNKNOWN` | `/api/match/interest`                 | `public`  | -                 | `src/app/api/match/interest/route.ts`                 |
| `UNKNOWN` | `/api/match/profile`                  | `public`  | -                 | `src/app/api/match/profile/route.ts`                  |
| `GET`     | `/api/match/snoozed`                  | `public`  | -                 | `src/app/api/match/snoozed/route.ts`                  |
| `GET`     | `/api/match/test`                     | `session` | -                 | `src/app/api/match/test/route.ts`                     |
| `GET`     | `/api/match/visible-fields/[matchId]` | `session` | -                 | `src/app/api/match/visible-fields/[matchId]/route.ts` |

### matches

| Methods | Path    | Auth Tier                  | Notes    | Source |
| ------- | ------- | -------------------------- | -------- | ------ | ------------------------------------------ |
| `POST   | DELETE` | `/api/matches/[id]/snooze` | `public` | -      | `src/app/api/matches/[id]/snooze/route.ts` |

### matching-profile

| Methods | Path | Auth Tier               | Notes    | Source |
| ------- | ---- | ----------------------- | -------- | ------ | --------------------------------------- |
| `GET    | PUT` | `/api/matching-profile` | `public` | -      | `src/app/api/matching-profile/route.ts` |

### monitoring

| Methods | Path                                 | Auth Tier  | Notes                                        | Source                                               |
| ------- | ------------------------------------ | ---------- | -------------------------------------------- | ---------------------------------------------------- |
| `GET`   | `/api/monitoring/health-diagnostics` | `internal` | protected DB/env/mock/deployment diagnostics | `src/app/api/monitoring/health-diagnostics/route.ts` |
| `GET`   | `/api/monitoring/launch-status`      | `internal` | launch-ops auth required                     | `src/app/api/monitoring/launch-status/route.ts`      |
| `GET`   | `/api/monitoring/perf-status`        | `internal` | launch-ops auth required                     | `src/app/api/monitoring/perf-status/route.ts`        |

### org

| Methods | Path                                     | Auth Tier | Notes | Source                                                   |
| ------- | ---------------------------------------- | --------- | ----- | -------------------------------------------------------- |
| `POST`  | `/api/org/[id]/matches/[matchId]/review` | `public`  | -     | `src/app/api/org/[id]/matches/[matchId]/review/route.ts` |
| `GET`   | `/api/org/[id]/shortlist`                | `public`  | -     | `src/app/api/org/[id]/shortlist/route.ts`                |
| `GET`   | `/api/org/readiness`                     | `public`  | -     | `src/app/api/org/readiness/route.ts`                     |

### organizations

| Methods | Path                                                      | Auth Tier                                      | Notes                           | Source                                                                    |
| ------- | --------------------------------------------------------- | ---------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `GET`   | `/api/organizations`                                      | `public`                                       | legacy/compat markers in source | `src/app/api/organizations/route.ts`                                      |
| `GET    | PUT`                                                      | `/api/organizations/[orgId]`                   | `public`                        | -                                                                         | `src/app/api/organizations/[orgId]/route.ts`                   |
| `GET`   | `/api/organizations/[orgId]/assignments`                  | `public`                                       | -                               | `src/app/api/organizations/[orgId]/assignments/route.ts`                  |
| `GET`   | `/api/organizations/[orgId]/audit/export`                 | `public`                                       | -                               | `src/app/api/organizations/[orgId]/audit/export/route.ts`                 |
| `GET    | POST`                                                     | `/api/organizations/[orgId]/candidate-invites` | `session`                       | -                                                                         | `src/app/api/organizations/[orgId]/candidate-invites/route.ts` |
| `PATCH` | `/api/organizations/[orgId]/candidate-invites/[inviteId]` | `session`                                      | -                               | `src/app/api/organizations/[orgId]/candidate-invites/[inviteId]/route.ts` |
| `GET`   | `/api/organizations/[orgId]/team`                         | `public`                                       | -                               | `src/app/api/organizations/[orgId]/team/route.ts`                         |
| `GET    | PUT`                                                      | `/api/organizations/[orgId]/visibility`        | `session`                       | -                                                                         | `src/app/api/organizations/[orgId]/visibility/route.ts`        |

### performance

| Methods | Path                     | Auth Tier | Notes | Source                                   |
| ------- | ------------------------ | --------- | ----- | ---------------------------------------- |
| `POST`  | `/api/performance/track` | `public`  | -     | `src/app/api/performance/track/route.ts` |

### portfolio

| Methods | Path                                     | Auth Tier                   | Notes     | Source                                                   |
| ------- | ---------------------------------------- | --------------------------- | --------- | -------------------------------------------------------- | ------------------------------------------- |
| `GET`   | `/api/portfolio/export`                  | `session`                   | -         | `src/app/api/portfolio/export/route.ts`                  |
| `GET`   | `/api/portfolio/org/[slug]/export`       | `session`                   | -         | `src/app/api/portfolio/org/[slug]/export/route.ts`       |
| `GET`   | `/api/portfolio/public/[handle]/export`  | `public`                    | -         | `src/app/api/portfolio/public/[handle]/export/route.ts`  |
| `GET`   | `/api/portfolio/public/[handle]/summary` | `public`                    | -         | `src/app/api/portfolio/public/[handle]/summary/route.ts` |
| `GET`   | `/api/portfolio/text-pack`               | `session`                   | -         | `src/app/api/portfolio/text-pack/route.ts`               |
| `GET    | POST`                                    | `/api/portfolio/visibility` | `session` | -                                                        | `src/app/api/portfolio/visibility/route.ts` |

### profile

| Methods | Path                        | Auth Tier                       | Notes    | Source                                      |
| ------- | --------------------------- | ------------------------------- | -------- | ------------------------------------------- | ----------------------------------------------- |
| `GET`   | `/api/profile/completeness` | `public`                        | -        | `src/app/api/profile/completeness/route.ts` |
| `GET    | POST`                       | `/api/profile/privacy-settings` | `public` | -                                           | `src/app/api/profile/privacy-settings/route.ts` |
| `GET    | POST`                       | `/api/profile/visibility`       | `public` | -                                           | `src/app/api/profile/visibility/route.ts`       |

### upload

| Methods | Path                          | Auth Tier              | Notes    | Source                                        |
| ------- | ----------------------------- | ---------------------- | -------- | --------------------------------------------- | -------------------------------------- |
| `POST   | DELETE`                       | `/api/upload/avatar`   | `public` | -                                             | `src/app/api/upload/avatar/route.ts`   |
| `POST`  | `/api/upload/cover`           | `public`               | -        | `src/app/api/upload/cover/route.ts`           |
| `POST   | DELETE`                       | `/api/upload/document` | `public` | -                                             | `src/app/api/upload/document/route.ts` |
| `GET`   | `/api/upload/status/[fileId]` | `public`               | -        | `src/app/api/upload/status/[fileId]/route.ts` |

### user

| Methods | Path                                | Auth Tier                    | Notes                           | Source                                              |
| ------- | ----------------------------------- | ---------------------------- | ------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| `GET    | DELETE`                             | `/api/user/account`          | `session`                       | -                                                   | `src/app/api/user/account/route.ts`          |
| `POST`  | `/api/user/account/cancel-deletion` | `public`                     | -                               | `src/app/api/user/account/cancel-deletion/route.ts` |
| `GET`   | `/api/user/audit-log`               | `public`                     | -                               | `src/app/api/user/audit-log/route.ts`               |
| `GET`   | `/api/user/audit-log/purpose`       | `session`                    | -                               | `src/app/api/user/audit-log/purpose/route.ts`       |
| `GET    | POST`                               | `/api/user/consent`          | `session`                       | legacy/compat markers in source                     | `src/app/api/user/consent/route.ts`          |
| `GET`   | `/api/user/consent/check`           | `session`                    | -                               | `src/app/api/user/consent/check/route.ts`           |
| `GET    | PUT`                                | `/api/user/email`            | `session`                       | -                                                   | `src/app/api/user/email/route.ts`            |
| `GET`   | `/api/user/export`                  | `public`                     | legacy/compat markers in source | `src/app/api/user/export/route.ts`                  |
| `GET`   | `/api/user/me`                      | `session`                    | -                               | `src/app/api/user/me/route.ts`                      |
| `PUT`   | `/api/user/password`                | `session`                    | -                               | `src/app/api/user/password/route.ts`                |
| `GET    | POST`                               | `/api/user/privacy-settings` | `session`                       | -                                                   | `src/app/api/user/privacy-settings/route.ts` |

### verification

| Methods | Path                                                   | Auth Tier                                             | Notes                                            | Source                                                                 |
| ------- | ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `GET`   | `/api/verification/requests`                           | `session`                                             | -                                                | `src/app/api/verification/requests/route.ts`                           |
| `GET    | POST                                                   | PATCH`                                                | `/api/verification/requests/bundles/[requestId]` | `public`                                                               | -                                                                     | `src/app/api/verification/requests/bundles/[requestId]/route.ts` |
| `POST`  | `/api/verification/requests/custom`                    | `session`                                             | -                                                | `src/app/api/verification/requests/custom/route.ts`                    |
| `GET`   | `/api/verification/requests/custom/artifacts`          | `public`                                              | -                                                | `src/app/api/verification/requests/custom/artifacts/route.ts`          |
| `GET`   | `/api/verification/requests/email-hint`                | `public`                                              | -                                                | `src/app/api/verification/requests/email-hint/route.ts`                |
| `POST   | DELETE`                                                | `/api/verification/requests/impact-story/[requestId]` | `public`                                         | -                                                                      | `src/app/api/verification/requests/impact-story/[requestId]/route.ts` |
| `GET    | POST`                                                  | `/api/verification/requests/skill`                    | `session`                                        | -                                                                      | `src/app/api/verification/requests/skill/route.ts`                    |
| `POST   | DELETE`                                                | `/api/verification/requests/skill/[requestId]`        | `public`                                         | -                                                                      | `src/app/api/verification/requests/skill/[requestId]/route.ts`        |
| `POST`  | `/api/verification/requests/skill/[requestId]/respond` | `session`                                             | -                                                | `src/app/api/verification/requests/skill/[requestId]/respond/route.ts` |
| `GET`   | `/api/verification/status`                             | `session`                                             | -                                                | `src/app/api/verification/status/route.ts`                             |
| `POST`  | `/api/verification/work-email/send`                    | `session`                                             | -                                                | `src/app/api/verification/work-email/send/route.ts`                    |
| `GET`   | `/api/verification/work-email/verify`                  | `public`                                              | -                                                | `src/app/api/verification/work-email/verify/route.ts`                  |

### verify

| Methods | Path  | Auth Tier                    | Notes     | Source                          |
| ------- | ----- | ---------------------------- | --------- | ------------------------------- | -------------------------------------------- |
| `GET    | POST` | `/api/verify/[token]`        | `session` | legacy/compat markers in source | `src/app/api/verify/[token]/route.ts`        |
| `GET    | POST` | `/api/verify/custom/[token]` | `public`  | -                               | `src/app/api/verify/custom/[token]/route.ts` |

## Compatibility / Deprecated Surface

Routes with source-level `legacy`/`deprecated` markers should be treated as compatibility surfaces and reviewed before removal.

| Path                                               | Source                                                             | Marker                         |
| -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| `/api/analytics/events`                            | `src/app/api/analytics/events/route.ts`                            | legacy/deprecated text present |
| `/api/candidate-invites/[token]/proof-card`        | `src/app/api/candidate-invites/[token]/proof-card/route.ts`        | legacy/deprecated text present |
| `/api/cron/account-deletion-workflow`              | `src/app/api/cron/account-deletion-workflow/route.ts`              | legacy/deprecated text present |
| `/api/cron/process-deletions`                      | `src/app/api/cron/process-deletions/route.ts`                      | legacy/deprecated text present |
| `/api/cron/send-deletion-reminders`                | `src/app/api/cron/send-deletion-reminders/route.ts`                | legacy/deprecated text present |
| `/api/expertise/user-skills`                       | `src/app/api/expertise/user-skills/route.ts`                       | legacy/deprecated text present |
| `/api/expertise/user-skills/[id]/proofs`           | `src/app/api/expertise/user-skills/[id]/proofs/route.ts`           | legacy/deprecated text present |
| `/api/expertise/user-skills/[id]/proofs/[proofId]` | `src/app/api/expertise/user-skills/[id]/proofs/[proofId]/route.ts` | legacy/deprecated text present |
| `/api/feature-flags`                               | `src/app/api/feature-flags/route.ts`                               | legacy/deprecated text present |
| `/api/interviews/schedule`                         | `src/app/api/interviews/schedule/route.ts`                         | legacy/deprecated text present |
| `/api/match/hide`                                  | `src/app/api/match/hide/route.ts`                                  | legacy/deprecated text present |
| `/api/monitoring/perf-status`                      | `src/app/api/monitoring/perf-status/route.ts`                      | legacy/deprecated text present |
| `/api/organizations`                               | `src/app/api/organizations/route.ts`                               | legacy/deprecated text present |
| `/api/user/consent`                                | `src/app/api/user/consent/route.ts`                                | legacy/deprecated text present |
| `/api/user/export`                                 | `src/app/api/user/export/route.ts`                                 | legacy/deprecated text present |
| `/api/verify/[token]`                              | `src/app/api/verify/[token]/route.ts`                              | legacy/deprecated text present |

## Verification Checklist

- `npm run docs:freshness`
- `STRICT_DOCS_FRESHNESS=true npm run docs:freshness`
- `npm run lint`
- `npm run typecheck`
- API parity check: compare generated endpoint count with `find src/app/api -name route.ts | wc -l`
