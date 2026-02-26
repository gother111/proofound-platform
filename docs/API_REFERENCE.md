# API Reference

> Doc Class: `active`
> Verification Source: `src/app/api/**/route.ts`, `src/middleware.ts`, `package.json`, `.github/workflows/ci.yml`, `vercel.json`
> Last Verified: `2026-02-26`

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

- Total route handlers: **276**
- Auth tier counts: `public=161`, `session=98`, `service=5`, `cron=12`
- Family count: **53**

## Endpoint Inventory

### admin

| Methods | Path                                               | Auth Tier                  | Notes                            | Source                                                             |
| ------- | -------------------------------------------------- | -------------------------- | -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------ |
| `GET`   | `/api/admin/analytics/growth`                      | `public`                   | -                                | `src/app/api/admin/analytics/growth/route.ts`                      |
| `GET`   | `/api/admin/analytics/metrics-dashboard`           | `public`                   | -                                | `src/app/api/admin/analytics/metrics-dashboard/route.ts`           |
| `GET`   | `/api/admin/analytics/overview`                    | `public`                   | -                                | `src/app/api/admin/analytics/overview/route.ts`                    |
| `GET`   | `/api/admin/analytics/pac`                         | `public`                   | -                                | `src/app/api/admin/analytics/pac/route.ts`                         |
| `GET`   | `/api/admin/analytics/ttfqi`                       | `public`                   | -                                | `src/app/api/admin/analytics/ttfqi/route.ts`                       |
| `GET`   | `/api/admin/analytics/ttv`                         | `public`                   | -                                | `src/app/api/admin/analytics/ttv/route.ts`                         |
| `GET`   | `/api/admin/audit`                                 | `public`                   | -                                | `src/app/api/admin/audit/route.ts`                                 |
| `GET`   | `/api/admin/cron/summary`                          | `public`                   | -                                | `src/app/api/admin/cron/summary/route.ts`                          |
| `GET`   | `/api/admin/fairness-metrics`                      | `public`                   | -                                | `src/app/api/admin/fairness-metrics/route.ts`                      |
| `POST`  | `/api/admin/fairness-report`                       | `public`                   | -                                | `src/app/api/admin/fairness-report/route.ts`                       |
| `POST`  | `/api/admin/fairness/generate-note`                | `session`                  | -                                | `src/app/api/admin/fairness/generate-note/route.ts`                |
| `GET`   | `/api/admin/fairness/notes`                        | `public`                   | -                                | `src/app/api/admin/fairness/notes/route.ts`                        |
| `GET`   | `/api/admin/fairness/notes/[version]`              | `public`                   | -                                | `src/app/api/admin/fairness/notes/[version]/route.ts`              |
| `GET    | POST`                                              | `/api/admin/feature-flags` | `public`                         | -                                                                  | `src/app/api/admin/feature-flags/route.ts` |
| `GET    | PATCH                                              | DELETE`                    | `/api/admin/feature-flags/[key]` | `public`                                                           | -                                          | `src/app/api/admin/feature-flags/[key]/route.ts` |
| `GET`   | `/api/admin/metrics/overview`                      | `public`                   | -                                | `src/app/api/admin/metrics/overview/route.ts`                      |
| `GET`   | `/api/admin/metrics/rollout`                       | `public`                   | -                                | `src/app/api/admin/metrics/rollout/route.ts`                       |
| `POST`  | `/api/admin/moderation/action`                     | `session`                  | -                                | `src/app/api/admin/moderation/action/route.ts`                     |
| `GET`   | `/api/admin/moderation/queue`                      | `public`                   | -                                | `src/app/api/admin/moderation/queue/route.ts`                      |
| `GET`   | `/api/admin/organizations`                         | `public`                   | -                                | `src/app/api/admin/organizations/route.ts`                         |
| `POST`  | `/api/admin/organizations/[orgId]/verify`          | `public`                   | -                                | `src/app/api/admin/organizations/[orgId]/verify/route.ts`          |
| `GET`   | `/api/admin/performance/metrics`                   | `public`                   | -                                | `src/app/api/admin/performance/metrics/route.ts`                   |
| `GET`   | `/api/admin/users`                                 | `public`                   | -                                | `src/app/api/admin/users/route.ts`                                 |
| `PATCH` | `/api/admin/users/[userId]/role`                   | `public`                   | -                                | `src/app/api/admin/users/[userId]/role/route.ts`                   |
| `POST`  | `/api/admin/users/[userId]/suspend`                | `public`                   | -                                | `src/app/api/admin/users/[userId]/suspend/route.ts`                |
| `POST`  | `/api/admin/verification/linkedin/[userId]/review` | `public`                   | -                                | `src/app/api/admin/verification/linkedin/[userId]/review/route.ts` |
| `GET`   | `/api/admin/verification/linkedin/queue`           | `session`                  | -                                | `src/app/api/admin/verification/linkedin/queue/route.ts`           |

### analytics

| Methods | Path                                        | Auth Tier                                | Notes                               | Source                                                      |
| ------- | ------------------------------------------- | ---------------------------------------- | ----------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `POST`  | `/api/analytics/dashboard`                  | `public`                                 | -                                   | `src/app/api/analytics/dashboard/route.ts`                  |
| `POST`  | `/api/analytics/dashboard-load-time`        | `session`                                | -                                   | `src/app/api/analytics/dashboard-load-time/route.ts`        |
| `GET    | POST                                        | DELETE`                                  | `/api/analytics/demographic-opt-in` | `public`                                                    | -                                                        | `src/app/api/analytics/demographic-opt-in/route.ts` |
| `POST`  | `/api/analytics/events`                     | `public`                                 | legacy/compat markers in source     | `src/app/api/analytics/events/route.ts`                     |
| `GET`   | `/api/analytics/fairness`                   | `session`                                | -                                   | `src/app/api/analytics/fairness/route.ts`                   |
| `GET    | POST`                                       | `/api/analytics/fairness/[assignmentId]` | `public`                            | -                                                           | `src/app/api/analytics/fairness/[assignmentId]/route.ts` |
| `GET    | POST`                                       | `/api/analytics/fairness/report`         | `public`                            | -                                                           | `src/app/api/analytics/fairness/report/route.ts`         |
| `GET`   | `/api/analytics/org/fairness-note`          | `public`                                 | contains TODO                       | `src/app/api/analytics/org/fairness-note/route.ts`          |
| `POST`  | `/api/analytics/org/fairness-note/generate` | `public`                                 | contains TODO                       | `src/app/api/analytics/org/fairness-note/generate/route.ts` |
| `GET`   | `/api/analytics/org/next-actions`           | `public`                                 | -                                   | `src/app/api/analytics/org/next-actions/route.ts`           |
| `GET`   | `/api/analytics/org/ttsc-trend`             | `public`                                 | contains TODO                       | `src/app/api/analytics/org/ttsc-trend/route.ts`             |
| `POST`  | `/api/analytics/tour-event`                 | `public`                                 | -                                   | `src/app/api/analytics/tour-event/route.ts`                 |
| `POST`  | `/api/analytics/track`                      | `public`                                 | -                                   | `src/app/api/analytics/track/route.ts`                      |
| `GET    | POST`                                       | `/api/analytics/web-vitals`              | `session`                           | -                                                           | `src/app/api/analytics/web-vitals/route.ts`              |

### assignment-templates

| Methods | Path   | Auth Tier                        | Notes    | Source |
| ------- | ------ | -------------------------------- | -------- | ------ | ------------------------------------------------ |
| `GET    | POST`  | `/api/assignment-templates`      | `public` | -      | `src/app/api/assignment-templates/route.ts`      |
| `GET    | PATCH` | `/api/assignment-templates/[id]` | `public` | -      | `src/app/api/assignment-templates/[id]/route.ts` |

### assignments

| Methods | Path                            | Auth Tier                                | Notes                   | Source                                          |
| ------- | ------------------------------- | ---------------------------------------- | ----------------------- | ----------------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| `GET    | POST`                           | `/api/assignments`                       | `public`                | -                                               | `src/app/api/assignments/route.ts`                       |
| `GET    | PUT                             | DELETE`                                  | `/api/assignments/[id]` | `public`                                        | -                                                        | `src/app/api/assignments/[id]/route.ts` |
| `GET    | POST`                           | `/api/assignments/[id]/expertise-matrix` | `public`                | -                                               | `src/app/api/assignments/[id]/expertise-matrix/route.ts` |
| `GET    | POST`                           | `/api/assignments/[id]/outcomes`         | `public`                | -                                               | `src/app/api/assignments/[id]/outcomes/route.ts`         |
| `GET    | POST`                           | `/api/assignments/[id]/pipeline`         | `public`                | -                                               | `src/app/api/assignments/[id]/pipeline/route.ts`         |
| `POST`  | `/api/assignments/[id]/publish` | `public`                                 | -                       | `src/app/api/assignments/[id]/publish/route.ts` |
| `POST`  | `/api/assignments/invite`       | `public`                                 | -                       | `src/app/api/assignments/invite/route.ts`       |
| `GET    | POST`                           | `/api/assignments/invite/[token]`        | `public`                | -                                               | `src/app/api/assignments/invite/[token]/route.ts`        |

### auth

| Methods | Path                          | Auth Tier | Notes | Source                                        |
| ------- | ----------------------------- | --------- | ----- | --------------------------------------------- |
| `GET`   | `/api/auth/google/callback`   | `public`  | -     | `src/app/api/auth/google/callback/route.ts`   |
| `GET`   | `/api/auth/linkedin`          | `session` | -     | `src/app/api/auth/linkedin/route.ts`          |
| `GET`   | `/api/auth/linkedin/callback` | `session` | -     | `src/app/api/auth/linkedin/callback/route.ts` |
| `GET`   | `/api/auth/zoom/callback`     | `public`  | -     | `src/app/api/auth/zoom/callback/route.ts`     |

### candidate-invites

| Methods | Path                                        | Auth Tier | Notes | Source                                                      |
| ------- | ------------------------------------------- | --------- | ----- | ----------------------------------------------------------- |
| `GET`   | `/api/candidate-invites/[token]`            | `public`  | -     | `src/app/api/candidate-invites/[token]/route.ts`            |
| `POST`  | `/api/candidate-invites/[token]/claim`      | `session` | -     | `src/app/api/candidate-invites/[token]/claim/route.ts`      |
| `POST`  | `/api/candidate-invites/[token]/proof-card` | `session` | -     | `src/app/api/candidate-invites/[token]/proof-card/route.ts` |

### contracts

| Methods | Path  | Auth Tier        | Notes                 | Source        |
| ------- | ----- | ---------------- | --------------------- | ------------- | -------------------------------- | ------------------------------------- |
| `GET    | POST` | `/api/contracts` | `public`              | contains TODO | `src/app/api/contracts/route.ts` |
| `GET    | PATCH | DELETE`          | `/api/contracts/[id]` | `public`      | -                                | `src/app/api/contracts/[id]/route.ts` |

### conversations

| Methods | Path                                         | Auth Tier                                      | Notes     | Source                                                       |
| ------- | -------------------------------------------- | ---------------------------------------------- | --------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `GET    | POST`                                        | `/api/conversations`                           | `session` | -                                                            | `src/app/api/conversations/route.ts`                           |
| `GET    | POST`                                        | `/api/conversations/[conversationId]`          | `session` | -                                                            | `src/app/api/conversations/[conversationId]/route.ts`          |
| `GET    | POST`                                        | `/api/conversations/[conversationId]/messages` | `session` | contains TODO                                                | `src/app/api/conversations/[conversationId]/messages/route.ts` |
| `POST`  | `/api/conversations/[conversationId]/reveal` | `service`                                      | -         | `src/app/api/conversations/[conversationId]/reveal/route.ts` |

### core

| Methods | Path                              | Auth Tier                             | Notes                           | Source                                            |
| ------- | --------------------------------- | ------------------------------------- | ------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `POST`  | `/api/core/matching/assignment`   | `public`                              | -                               | `src/app/api/core/matching/assignment/route.ts`   |
| `GET    | POST`                             | `/api/core/matching/interest`         | `public`                        | -                                                 | `src/app/api/core/matching/interest/route.ts`         |
| `GET    | PUT`                              | `/api/core/matching/matching-profile` | `public`                        | legacy/compat markers in source                   | `src/app/api/core/matching/matching-profile/route.ts` |
| `POST`  | `/api/core/matching/near-matches` | `public`                              | -                               | `src/app/api/core/matching/near-matches/route.ts` |
| `POST`  | `/api/core/matching/profile`      | `service`                             | legacy/compat markers in source | `src/app/api/core/matching/profile/route.ts`      |

### cron

| Methods | Path                                  | Auth Tier                   | Notes                           | Source                                                |
| ------- | ------------------------------------- | --------------------------- | ------------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| `GET`   | `/api/cron/account-deletion-workflow` | `cron`                      | -                               | `src/app/api/cron/account-deletion-workflow/route.ts` |
| `GET`   | `/api/cron/decision-reminders`        | `cron`                      | -                               | `src/app/api/cron/decision-reminders/route.ts`        |
| `GET`   | `/api/cron/fairness-note`             | `cron`                      | -                               | `src/app/api/cron/fairness-note/route.ts`             |
| `GET    | POST`                                 | `/api/cron/fairness-report` | `cron`                          | contains TODO                                         | `src/app/api/cron/fairness-report/route.ts` |
| `GET`   | `/api/cron/generate-fairness-note`    | `cron`                      | -                               | `src/app/api/cron/generate-fairness-note/route.ts`    |
| `GET`   | `/api/cron/health-check`              | `cron`                      | -                               | `src/app/api/cron/health-check/route.ts`              |
| `GET`   | `/api/cron/performance-check`         | `cron`                      | -                               | `src/app/api/cron/performance-check/route.ts`         |
| `GET`   | `/api/cron/process-deletions`         | `cron`                      | legacy/compat markers in source | `src/app/api/cron/process-deletions/route.ts`         |
| `GET`   | `/api/cron/refresh-matches`           | `cron`                      | -                               | `src/app/api/cron/refresh-matches/route.ts`           |
| `GET`   | `/api/cron/send-deletion-reminders`   | `cron`                      | legacy/compat markers in source | `src/app/api/cron/send-deletion-reminders/route.ts`   |
| `GET`   | `/api/cron/sla-enforcement`           | `cron`                      | -                               | `src/app/api/cron/sla-enforcement/route.ts`           |
| `GET`   | `/api/cron/weekly-digest`             | `cron`                      | -                               | `src/app/api/cron/weekly-digest/route.ts`             |

### csrf-token

| Methods | Path              | Auth Tier | Notes | Source                            |
| ------- | ----------------- | --------- | ----- | --------------------------------- |
| `GET`   | `/api/csrf-token` | `session` | -     | `src/app/api/csrf-token/route.ts` |

### dashboard

| Methods | Path  | Auth Tier               | Notes    | Source |
| ------- | ----- | ----------------------- | -------- | ------ | --------------------------------------- |
| `GET    | POST` | `/api/dashboard/layout` | `public` | -      | `src/app/api/dashboard/layout/route.ts` |

### data-export

| Methods | Path               | Auth Tier | Notes | Source                             |
| ------- | ------------------ | --------- | ----- | ---------------------------------- |
| `GET`   | `/api/data-export` | `public`  | -     | `src/app/api/data-export/route.ts` |

### data-import

| Methods | Path                       | Auth Tier | Notes                           | Source                                     |
| ------- | -------------------------- | --------- | ------------------------------- | ------------------------------------------ |
| `POST`  | `/api/data-import`         | `public`  | -                               | `src/app/api/data-import/route.ts`         |
| `POST`  | `/api/data-import/preview` | `public`  | legacy/compat markers in source | `src/app/api/data-import/preview/route.ts` |

### decisions

| Methods | Path                                  | Auth Tier | Notes | Source                                                |
| ------- | ------------------------------------- | --------- | ----- | ----------------------------------------------------- |
| `POST`  | `/api/decisions`                      | `session` | -     | `src/app/api/decisions/route.ts`                      |
| `GET`   | `/api/decisions/window/[interviewId]` | `session` | -     | `src/app/api/decisions/window/[interviewId]/route.ts` |

### evidence-pack

| Methods | Path                               | Auth Tier | Notes | Source                                             |
| ------- | ---------------------------------- | --------- | ----- | -------------------------------------------------- |
| `POST`  | `/api/evidence-pack`               | `session` | -     | `src/app/api/evidence-pack/route.ts`               |
| `GET`   | `/api/evidence-pack/[candidateId]` | `session` | -     | `src/app/api/evidence-pack/[candidateId]/route.ts` |

### expertise

| Methods  | Path                                               | Auth Tier                                              | Notes                           | Source                                                             |
| -------- | -------------------------------------------------- | ------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `POST`   | `/api/expertise/auto-suggest`                      | `session`                                              | -                               | `src/app/api/expertise/auto-suggest/route.ts`                      |
| `GET`    | `/api/expertise/gap-analysis`                      | `public`                                               | legacy/compat markers in source | `src/app/api/expertise/gap-analysis/route.ts`                      |
| `POST`   | `/api/expertise/jd-to-l4`                          | `public`                                               | -                               | `src/app/api/expertise/jd-to-l4/route.ts`                          |
| `POST`   | `/api/expertise/linkedin-disconnect`               | `session`                                              | -                               | `src/app/api/expertise/linkedin-disconnect/route.ts`               |
| `POST`   | `/api/expertise/linkedin-import`                   | `session`                                              | legacy/compat markers in source | `src/app/api/expertise/linkedin-import/route.ts`                   |
| `GET`    | `/api/expertise/linkedin-status`                   | `session`                                              | -                               | `src/app/api/expertise/linkedin-status/route.ts`                   |
| `GET     | PUT`                                               | `/api/expertise/profile`                               | `public`                        | -                                                                  | `src/app/api/expertise/profile/route.ts`                               |
| `GET`    | `/api/expertise/stats`                             | `public`                                               | -                               | `src/app/api/expertise/stats/route.ts`                             |
| `GET`    | `/api/expertise/taxonomy`                          | `service`                                              | -                               | `src/app/api/expertise/taxonomy/route.ts`                          |
| `GET     | POST`                                              | `/api/expertise/user-skills`                           | `public`                        | legacy/compat markers in source; contains TODO                     | `src/app/api/expertise/user-skills/route.ts`                           |
| `PATCH   | DELETE`                                            | `/api/expertise/user-skills/[id]`                      | `public`                        | -                                                                  | `src/app/api/expertise/user-skills/[id]/route.ts`                      |
| `GET     | POST`                                              | `/api/expertise/user-skills/[id]/proofs`               | `public`                        | -                                                                  | `src/app/api/expertise/user-skills/[id]/proofs/route.ts`               |
| `DELETE` | `/api/expertise/user-skills/[id]/proofs/[proofId]` | `public`                                               | -                               | `src/app/api/expertise/user-skills/[id]/proofs/[proofId]/route.ts` |
| `GET     | POST`                                              | `/api/expertise/user-skills/[id]/verification-request` | `session`                       | legacy/compat markers in source                                    | `src/app/api/expertise/user-skills/[id]/verification-request/route.ts` |
| `POST`   | `/api/expertise/verification/[requestId]/respond`  | `session`                                              | -                               | `src/app/api/expertise/verification/[requestId]/respond/route.ts`  |
| `GET`    | `/api/expertise/verifications/incoming`            | `session`                                              | -                               | `src/app/api/expertise/verifications/incoming/route.ts`            |

### feature-flags

| Methods | Path                 | Auth Tier | Notes | Source                               |
| ------- | -------------------- | --------- | ----- | ------------------------------------ |
| `GET`   | `/api/feature-flags` | `session` | -     | `src/app/api/feature-flags/route.ts` |

### feedback

| Methods | Path                          | Auth Tier                           | Notes     | Source                                        |
| ------- | ----------------------------- | ----------------------------------- | --------- | --------------------------------------------- | --------------------------------------------------- |
| `GET`   | `/api/feedback/[interviewId]` | `session`                           | -         | `src/app/api/feedback/[interviewId]/route.ts` |
| `POST`  | `/api/feedback/submit`        | `session`                           | -         | `src/app/api/feedback/submit/route.ts`        |
| `GET    | POST`                         | `/api/feedback/sus`                 | `session` | -                                             | `src/app/api/feedback/sus/route.ts`                 |
| `GET    | POST`                         | `/api/feedback/sus/check-trigger`   | `public`  | -                                             | `src/app/api/feedback/sus/check-trigger/route.ts`   |
| `POST`  | `/api/feedback/sus/dismiss`   | `public`                            | -         | `src/app/api/feedback/sus/dismiss/route.ts`   |
| `POST`  | `/api/feedback/sus/submit`    | `public`                            | -         | `src/app/api/feedback/sus/submit/route.ts`    |
| `GET`   | `/api/feedback/token/[token]` | `public`                            | -         | `src/app/api/feedback/token/[token]/route.ts` |
| `GET    | POST`                         | `/api/feedback/why-not-shortlisted` | `session` | contains TODO                                 | `src/app/api/feedback/why-not-shortlisted/route.ts` |

### goals

| Methods | Path | Auth Tier | Notes   | Source       |
| ------- | ---- | --------- | ------- | ------------ | -------- | ------------------------------- | ---------------------------- |
| `GET    | POST | PATCH     | DELETE` | `/api/goals` | `public` | legacy/compat markers in source | `src/app/api/goals/route.ts` |

### health

| Methods | Path          | Auth Tier | Notes | Source                        |
| ------- | ------------- | --------- | ----- | ----------------------------- |
| `GET`   | `/api/health` | `service` | -     | `src/app/api/health/route.ts` |

### impact

| Methods | Path                   | Auth Tier | Notes | Source                                 |
| ------- | ---------------------- | --------- | ----- | -------------------------------------- |
| `GET`   | `/api/impact/snapshot` | `public`  | -     | `src/app/api/impact/snapshot/route.ts` |

### individual

| Methods | Path                        | Auth Tier | Notes | Source                                      |
| ------- | --------------------------- | --------- | ----- | ------------------------------------------- |
| `GET`   | `/api/individual/readiness` | `public`  | -     | `src/app/api/individual/readiness/route.ts` |

### integrations

| Methods  | Path                                      | Auth Tier | Notes         | Source                                                    |
| -------- | ----------------------------------------- | --------- | ------------- | --------------------------------------------------------- |
| `GET`    | `/api/integrations`                       | `public`  | -             | `src/app/api/integrations/route.ts`                       |
| `GET`    | `/api/integrations/[provider]/connect`    | `session` | contains TODO | `src/app/api/integrations/[provider]/connect/route.ts`    |
| `DELETE` | `/api/integrations/[provider]/disconnect` | `public`  | -             | `src/app/api/integrations/[provider]/disconnect/route.ts` |
| `GET`    | `/api/integrations/google/callback`       | `public`  | -             | `src/app/api/integrations/google/callback/route.ts`       |
| `GET`    | `/api/integrations/google/connect`        | `session` | -             | `src/app/api/integrations/google/connect/route.ts`        |
| `GET`    | `/api/integrations/video`                 | `session` | -             | `src/app/api/integrations/video/route.ts`                 |
| `DELETE` | `/api/integrations/video/[provider]`      | `session` | -             | `src/app/api/integrations/video/[provider]/route.ts`      |
| `GET`    | `/api/integrations/video/[provider]/auth` | `session` | -             | `src/app/api/integrations/video/[provider]/auth/route.ts` |
| `POST`   | `/api/integrations/video/generate-link`   | `session` | -             | `src/app/api/integrations/video/generate-link/route.ts`   |
| `GET`    | `/api/integrations/video/status`          | `public`  | -             | `src/app/api/integrations/video/status/route.ts`          |
| `GET`    | `/api/integrations/zoom/callback`         | `public`  | -             | `src/app/api/integrations/zoom/callback/route.ts`         |
| `GET`    | `/api/integrations/zoom/connect`          | `session` | -             | `src/app/api/integrations/zoom/connect/route.ts`          |

### interviews

| Methods | Path                       | Auth Tier                  | Notes         | Source                                     |
| ------- | -------------------------- | -------------------------- | ------------- | ------------------------------------------ | ------------------------------------------ |
| `GET`   | `/api/interviews`          | `session`                  | -             | `src/app/api/interviews/route.ts`          |
| `POST`  | `/api/interviews/cancel`   | `session`                  | contains TODO | `src/app/api/interviews/cancel/route.ts`   |
| `POST`  | `/api/interviews/complete` | `session`                  | -             | `src/app/api/interviews/complete/route.ts` |
| `GET    | POST`                      | `/api/interviews/schedule` | `session`     | legacy/compat markers in source            | `src/app/api/interviews/schedule/route.ts` |

### match

| Methods   | Path                                  | Auth Tier             | Notes               | Source                                                |
| --------- | ------------------------------------- | --------------------- | ------------------- | ----------------------------------------------------- | ------------------------------------- | ----------------------------------- |
| `UNKNOWN` | `/api/match/assignment`               | `public`              | -                   | `src/app/api/match/assignment/route.ts`               |
| `GET      | POST`                                 | `/api/match/decision` | `session`           | legacy/compat markers in source                       | `src/app/api/match/decision/route.ts` |
| `GET`     | `/api/match/explain/[matchId]`        | `public`              | -                   | `src/app/api/match/explain/[matchId]/route.ts`        |
| `POST`    | `/api/match/gates`                    | `public`              | -                   | `src/app/api/match/gates/route.ts`                    |
| `GET      | POST                                  | DELETE`               | `/api/match/hide`   | `public`                                              | legacy/compat markers in source       | `src/app/api/match/hide/route.ts`   |
| `UNKNOWN` | `/api/match/interest`                 | `public`              | -                   | `src/app/api/match/interest/route.ts`                 |
| `UNKNOWN` | `/api/match/profile`                  | `public`              | -                   | `src/app/api/match/profile/route.ts`                  |
| `GET      | POST                                  | DELETE`               | `/api/match/snooze` | `session`                                             | -                                     | `src/app/api/match/snooze/route.ts` |
| `GET`     | `/api/match/snoozed`                  | `public`              | -                   | `src/app/api/match/snoozed/route.ts`                  |
| `GET`     | `/api/match/visible-fields/[matchId]` | `session`             | -                   | `src/app/api/match/visible-fields/[matchId]/route.ts` |

### matches

| Methods | Path    | Auth Tier                  | Notes    | Source |
| ------- | ------- | -------------------------- | -------- | ------ | ------------------------------------------ |
| `POST   | DELETE` | `/api/matches/[id]/snooze` | `public` | -      | `src/app/api/matches/[id]/snooze/route.ts` |

### matching

| Methods | Path    | Auth Tier                    | Notes                   | Source                          |
| ------- | ------- | ---------------------------- | ----------------------- | ------------------------------- | -------------------------------------------- | --------------------------------------- |
| `GET    | POST    | PUT`                         | `/api/matching/profile` | `public`                        | legacy/compat markers in source              | `src/app/api/matching/profile/route.ts` |
| `GET    | DELETE` | `/api/matching/profile/[id]` | `public`                | legacy/compat markers in source | `src/app/api/matching/profile/[id]/route.ts` |

### matching-profile

| Methods | Path | Auth Tier               | Notes    | Source                          |
| ------- | ---- | ----------------------- | -------- | ------------------------------- | --------------------------------------- |
| `GET    | PUT` | `/api/matching-profile` | `public` | legacy/compat markers in source | `src/app/api/matching-profile/route.ts` |

### messages

| Methods | Path                             | Auth Tier       | Notes                           | Source                                           |
| ------- | -------------------------------- | --------------- | ------------------------------- | ------------------------------------------------ | ------------------------------- |
| `GET    | POST`                            | `/api/messages` | `session`                       | legacy/compat markers in source                  | `src/app/api/messages/route.ts` |
| `GET`   | `/api/messages/[conversationId]` | `session`       | legacy/compat markers in source | `src/app/api/messages/[conversationId]/route.ts` |

### metrics

| Methods | Path               | Auth Tier | Notes | Source                             |
| ------- | ------------------ | --------- | ----- | ---------------------------------- |
| `GET`   | `/api/metrics`     | `public`  | -     | `src/app/api/metrics/route.ts`     |
| `GET`   | `/api/metrics/all` | `public`  | -     | `src/app/api/metrics/all/route.ts` |

### mobile/v1

| Methods | Path                                         | Auth Tier                                       | Notes                            | Source                                                       |
| ------- | -------------------------------------------- | ----------------------------------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------ |
| `GET`   | `/api/mobile/v1/account/status`              | `public`                                        | -                                | `src/app/api/mobile/v1/account/status/route.ts`              |
| `GET`   | `/api/mobile/v1/admin/analytics/overview`    | `public`                                        | -                                | `src/app/api/mobile/v1/admin/analytics/overview/route.ts`    |
| `GET`   | `/api/mobile/v1/admin/moderation/queue`      | `public`                                        | -                                | `src/app/api/mobile/v1/admin/moderation/queue/route.ts`      |
| `GET    | POST`                                        | `/api/mobile/v1/assignments`                    | `public`                         | -                                                            | `src/app/api/mobile/v1/assignments/route.ts`                    |
| `GET`   | `/api/mobile/v1/bootstrap`                   | `public`                                        | -                                | `src/app/api/mobile/v1/bootstrap/route.ts`                   |
| `GET`   | `/api/mobile/v1/conversations`               | `public`                                        | -                                | `src/app/api/mobile/v1/conversations/route.ts`               |
| `POST   | DELETE`                                      | `/api/mobile/v1/devices/token`                  | `public`                         | -                                                            | `src/app/api/mobile/v1/devices/token/route.ts`                  |
| `GET    | POST`                                        | `/api/mobile/v1/interviews`                     | `public`                         | -                                                            | `src/app/api/mobile/v1/interviews/route.ts`                     |
| `POST`  | `/api/mobile/v1/matching/assignment`         | `public`                                        | -                                | `src/app/api/mobile/v1/matching/assignment/route.ts`         |
| `GET`   | `/api/mobile/v1/matching/explain/[matchId]`  | `public`                                        | -                                | `src/app/api/mobile/v1/matching/explain/[matchId]/route.ts`  |
| `POST`  | `/api/mobile/v1/matching/feed`               | `public`                                        | -                                | `src/app/api/mobile/v1/matching/feed/route.ts`               |
| `GET    | POST                                         | DELETE`                                         | `/api/mobile/v1/matching/hide`   | `public`                                                     | -                                                               | `src/app/api/mobile/v1/matching/hide/route.ts`   |
| `POST`  | `/api/mobile/v1/matching/interest`           | `public`                                        | -                                | `src/app/api/mobile/v1/matching/interest/route.ts`           |
| `GET    | POST                                         | DELETE`                                         | `/api/mobile/v1/matching/snooze` | `public`                                                     | -                                                               | `src/app/api/mobile/v1/matching/snooze/route.ts` |
| `GET    | POST`                                        | `/api/mobile/v1/messages`                       | `public`                         | -                                                            | `src/app/api/mobile/v1/messages/route.ts`                       |
| `GET`   | `/api/mobile/v1/notifications`               | `public`                                        | -                                | `src/app/api/mobile/v1/notifications/route.ts`               |
| `PATCH` | `/api/mobile/v1/notifications/[id]/read`     | `public`                                        | -                                | `src/app/api/mobile/v1/notifications/[id]/read/route.ts`     |
| `POST`  | `/api/mobile/v1/notifications/mark-all-read` | `public`                                        | -                                | `src/app/api/mobile/v1/notifications/mark-all-read/route.ts` |
| `GET    | PATCH`                                       | `/api/mobile/v1/notifications/preferences`      | `public`                         | -                                                            | `src/app/api/mobile/v1/notifications/preferences/route.ts`      |
| `PUT`   | `/api/mobile/v1/onboarding/individual`       | `public`                                        | -                                | `src/app/api/mobile/v1/onboarding/individual/route.ts`       |
| `PUT`   | `/api/mobile/v1/onboarding/org`              | `public`                                        | -                                | `src/app/api/mobile/v1/onboarding/org/route.ts`              |
| `GET    | PATCH`                                       | `/api/mobile/v1/organizations/[orgId]`          | `public`                         | -                                                            | `src/app/api/mobile/v1/organizations/[orgId]/route.ts`          |
| `GET    | POST`                                        | `/api/mobile/v1/organizations/[orgId]/goals`    | `public`                         | -                                                            | `src/app/api/mobile/v1/organizations/[orgId]/goals/route.ts`    |
| `GET    | POST`                                        | `/api/mobile/v1/organizations/[orgId]/projects` | `public`                         | -                                                            | `src/app/api/mobile/v1/organizations/[orgId]/projects/route.ts` |
| `GET`   | `/api/mobile/v1/organizations/[orgId]/team`  | `public`                                        | -                                | `src/app/api/mobile/v1/organizations/[orgId]/team/route.ts`  |
| `POST`  | `/api/mobile/v1/persona/switch`              | `public`                                        | -                                | `src/app/api/mobile/v1/persona/switch/route.ts`              |
| `GET    | PATCH`                                       | `/api/mobile/v1/profile/visibility`             | `public`                         | -                                                            | `src/app/api/mobile/v1/profile/visibility/route.ts`             |
| `GET`   | `/api/mobile/v1/shortlist`                   | `public`                                        | -                                | `src/app/api/mobile/v1/shortlist/route.ts`                   |
| `GET`   | `/api/mobile/v1/verification/status`         | `public`                                        | -                                | `src/app/api/mobile/v1/verification/status/route.ts`         |

### moderation

| Methods | Path                                    | Auth Tier | Notes                           | Source                                                  |
| ------- | --------------------------------------- | --------- | ------------------------------- | ------------------------------------------------------- |
| `POST`  | `/api/moderation/appeals`               | `session` | -                               | `src/app/api/moderation/appeals/route.ts`               |
| `POST`  | `/api/moderation/report`                | `session` | legacy/compat markers in source | `src/app/api/moderation/report/route.ts`                |
| `POST`  | `/api/moderation/statements-of-reasons` | `public`  | -                               | `src/app/api/moderation/statements-of-reasons/route.ts` |
| `GET`   | `/api/moderation/transparency-report`   | `public`  | -                               | `src/app/api/moderation/transparency-report/route.ts`   |

### momentum

| Methods | Path                    | Auth Tier | Notes | Source                                  |
| ------- | ----------------------- | --------- | ----- | --------------------------------------- |
| `GET`   | `/api/momentum/summary` | `public`  | -     | `src/app/api/momentum/summary/route.ts` |

### monitoring

| Methods | Path                          | Auth Tier | Notes | Source                                        |
| ------- | ----------------------------- | --------- | ----- | --------------------------------------------- |
| `GET`   | `/api/monitoring/perf-status` | `public`  | -     | `src/app/api/monitoring/perf-status/route.ts` |

### notifications

| Methods | Path                               | Auth Tier                        | Notes    | Source                                             |
| ------- | ---------------------------------- | -------------------------------- | -------- | -------------------------------------------------- | ------------------------------------------------ |
| `GET    | POST`                              | `/api/notifications`             | `public` | -                                                  | `src/app/api/notifications/route.ts`             |
| `PATCH` | `/api/notifications/[id]/read`     | `public`                         | -        | `src/app/api/notifications/[id]/read/route.ts`     |
| `POST`  | `/api/notifications/mark-all-read` | `public`                         | -        | `src/app/api/notifications/mark-all-read/route.ts` |
| `GET    | PATCH`                             | `/api/notifications/preferences` | `public` | -                                                  | `src/app/api/notifications/preferences/route.ts` |
| `GET`   | `/api/notifications/unread-count`  | `public`                         | -        | `src/app/api/notifications/unread-count/route.ts`  |

### org

| Methods | Path                      | Auth Tier | Notes         | Source                                    |
| ------- | ------------------------- | --------- | ------------- | ----------------------------------------- |
| `GET`   | `/api/org/[id]/coverage`  | `public`  | contains TODO | `src/app/api/org/[id]/coverage/route.ts`  |
| `GET`   | `/api/org/[id]/dashboard` | `public`  | -             | `src/app/api/org/[id]/dashboard/route.ts` |
| `GET`   | `/api/org/[id]/shortlist` | `public`  | -             | `src/app/api/org/[id]/shortlist/route.ts` |
| `GET`   | `/api/org/readiness`      | `public`  | -             | `src/app/api/org/readiness/route.ts`      |

### organizations

| Methods | Path                                                      | Auth Tier                                            | Notes                                          | Source                                                                    |
| ------- | --------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `GET`   | `/api/organizations`                                      | `public`                                             | legacy/compat markers in source                | `src/app/api/organizations/route.ts`                                      |
| `GET    | PUT`                                                      | `/api/organizations/[orgId]`                         | `public`                                       | -                                                                         | `src/app/api/organizations/[orgId]/route.ts`                         |
| `GET`   | `/api/organizations/[orgId]/assignments`                  | `session`                                            | -                                              | `src/app/api/organizations/[orgId]/assignments/route.ts`                  |
| `GET    | POST`                                                     | `/api/organizations/[orgId]/candidate-invites`       | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/candidate-invites/route.ts`       |
| `PATCH` | `/api/organizations/[orgId]/candidate-invites/[inviteId]` | `session`                                            | -                                              | `src/app/api/organizations/[orgId]/candidate-invites/[inviteId]/route.ts` |
| `PUT`   | `/api/organizations/[orgId]/causes`                       | `session`                                            | -                                              | `src/app/api/organizations/[orgId]/causes/route.ts`                       |
| `GET    | PUT`                                                      | `/api/organizations/[orgId]/culture`                 | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/culture/route.ts`                 |
| `GET`   | `/api/organizations/[orgId]/culture/preview`              | `public`                                             | -                                              | `src/app/api/organizations/[orgId]/culture/preview/route.ts`              |
| `POST`  | `/api/organizations/[orgId]/evidence-pack`                | `session`                                            | -                                              | `src/app/api/organizations/[orgId]/evidence-pack/route.ts`                |
| `GET    | POST`                                                     | `/api/organizations/[orgId]/goals`                   | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/goals/route.ts`                   |
| `PUT    | DELETE`                                                   | `/api/organizations/[orgId]/goals/[id]`              | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/goals/[id]/route.ts`              |
| `GET    | POST`                                                     | `/api/organizations/[orgId]/impact`                  | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/impact/route.ts`                  |
| `PUT    | DELETE`                                                   | `/api/organizations/[orgId]/impact/[id]`             | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/impact/[id]/route.ts`             |
| `GET    | POST`                                                     | `/api/organizations/[orgId]/ownership`               | `public`                                       | -                                                                         | `src/app/api/organizations/[orgId]/ownership/route.ts`               |
| `PUT    | DELETE`                                                   | `/api/organizations/[orgId]/ownership/[ownershipId]` | `public`                                       | -                                                                         | `src/app/api/organizations/[orgId]/ownership/[ownershipId]/route.ts` |
| `GET    | POST`                                                     | `/api/organizations/[orgId]/partnerships`            | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/partnerships/route.ts`            |
| `GET    | PUT                                                       | DELETE`                                              | `/api/organizations/[orgId]/partnerships/[id]` | `session`                                                                 | -                                                                    | `src/app/api/organizations/[orgId]/partnerships/[id]/route.ts` |
| `GET    | POST`                                                     | `/api/organizations/[orgId]/projects`                | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/projects/route.ts`                |
| `GET    | PUT                                                       | DELETE`                                              | `/api/organizations/[orgId]/projects/[id]`     | `session`                                                                 | -                                                                    | `src/app/api/organizations/[orgId]/projects/[id]/route.ts`     |
| `GET    | POST`                                                     | `/api/organizations/[orgId]/structure`               | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/structure/route.ts`               |
| `GET    | PUT                                                       | DELETE`                                              | `/api/organizations/[orgId]/structure/[id]`    | `session`                                                                 | -                                                                    | `src/app/api/organizations/[orgId]/structure/[id]/route.ts`    |
| `GET`   | `/api/organizations/[orgId]/structure/export`             | `session`                                            | -                                              | `src/app/api/organizations/[orgId]/structure/export/route.ts`             |
| `GET`   | `/api/organizations/[orgId]/team`                         | `public`                                             | -                                              | `src/app/api/organizations/[orgId]/team/route.ts`                         |
| `GET    | PUT`                                                      | `/api/organizations/[orgId]/visibility`              | `session`                                      | -                                                                         | `src/app/api/organizations/[orgId]/visibility/route.ts`              |
| `POST`  | `/api/organizations/evidence-pack`                        | `session`                                            | -                                              | `src/app/api/organizations/evidence-pack/route.ts`                        |

### performance

| Methods | Path                     | Auth Tier | Notes | Source                                   |
| ------- | ------------------------ | --------- | ----- | ---------------------------------------- |
| `POST`  | `/api/performance/track` | `public`  | -     | `src/app/api/performance/track/route.ts` |

### policy

| Methods | Path  | Auth Tier             | Notes     | Source |
| ------- | ----- | --------------------- | --------- | ------ | ------------------------------------- |
| `GET    | POST` | `/api/policy/explain` | `session` | -      | `src/app/api/policy/explain/route.ts` |

### portfolio

| Methods | Path                       | Auth Tier                   | Notes     | Source                                     |
| ------- | -------------------------- | --------------------------- | --------- | ------------------------------------------ | ------------------------------------------- |
| `GET`   | `/api/portfolio/export`    | `session`                   | -         | `src/app/api/portfolio/export/route.ts`    |
| `GET`   | `/api/portfolio/text-pack` | `session`                   | -         | `src/app/api/portfolio/text-pack/route.ts` |
| `GET    | POST`                      | `/api/portfolio/view`       | `public`  | -                                          | `src/app/api/portfolio/view/route.ts`       |
| `GET    | POST`                      | `/api/portfolio/visibility` | `session` | -                                          | `src/app/api/portfolio/visibility/route.ts` |

### profile

| Methods | Path                        | Auth Tier                       | Notes                  | Source                                      |
| ------- | --------------------------- | ------------------------------- | ---------------------- | ------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| `GET`   | `/api/profile/completeness` | `public`                        | -                      | `src/app/api/profile/completeness/route.ts` |
| `GET    | POST`                       | `/api/profile/privacy-settings` | `public`               | -                                           | `src/app/api/profile/privacy-settings/route.ts` |
| `GET    | POST                        | DELETE`                         | `/api/profile/snippet` | `session`                                   | -                                               | `src/app/api/profile/snippet/route.ts` |
| `GET    | POST`                       | `/api/profile/visibility`       | `public`               | -                                           | `src/app/api/profile/visibility/route.ts`       |

### profiles

| Methods | Path                     | Auth Tier | Notes | Source                                   |
| ------- | ------------------------ | --------- | ----- | ---------------------------------------- |
| `GET`   | `/api/profiles/[handle]` | `session` | -     | `src/app/api/profiles/[handle]/route.ts` |

### projects

| Methods | Path  | Auth Tier       | Notes                | Source    |
| ------- | ----- | --------------- | -------------------- | --------- | ------------------------------- | ------------------------------------ |
| `GET    | POST` | `/api/projects` | `public`             | -         | `src/app/api/projects/route.ts` |
| `GET    | PATCH | DELETE`         | `/api/projects/[id]` | `session` | contains TODO                   | `src/app/api/projects/[id]/route.ts` |

### skill-gaps

| Methods | Path                       | Auth Tier | Notes                   | Source                                     |
| ------- | -------------------------- | --------- | ----------------------- | ------------------------------------------ | ------------------------------- | --------------------------------------- |
| `GET`   | `/api/skill-gaps`          | `public`  | -                       | `src/app/api/skill-gaps/route.ts`          |
| `GET    | POST                       | PATCH`    | `/api/skill-gaps/goals` | `public`                                   | legacy/compat markers in source | `src/app/api/skill-gaps/goals/route.ts` |
| `GET`   | `/api/skill-gaps/overview` | `public`  | -                       | `src/app/api/skill-gaps/overview/route.ts` |

### surveys

| Methods | Path  | Auth Tier                 | Notes     | Source |
| ------- | ----- | ------------------------- | --------- | ------ | ----------------------------------------- |
| `GET    | POST` | `/api/surveys/sus`        | `session` | -      | `src/app/api/surveys/sus/route.ts`        |
| `GET    | POST` | `/api/surveys/sus/prompt` | `public`  | -      | `src/app/api/surveys/sus/prompt/route.ts` |

### taxonomy

| Methods | Path                   | Auth Tier | Notes | Source                                 |
| ------- | ---------------------- | --------- | ----- | -------------------------------------- |
| `GET`   | `/api/taxonomy/[kind]` | `public`  | -     | `src/app/api/taxonomy/[kind]/route.ts` |

### updates

| Methods | Path           | Auth Tier | Notes | Source                         |
| ------- | -------------- | --------- | ----- | ------------------------------ |
| `GET`   | `/api/updates` | `public`  | -     | `src/app/api/updates/route.ts` |

### upload

| Methods | Path                | Auth Tier              | Notes    | Source                              |
| ------- | ------------------- | ---------------------- | -------- | ----------------------------------- | -------------------------------------- |
| `POST   | DELETE`             | `/api/upload/avatar`   | `public` | -                                   | `src/app/api/upload/avatar/route.ts`   |
| `POST`  | `/api/upload/cover` | `public`               | -        | `src/app/api/upload/cover/route.ts` |
| `POST   | DELETE`             | `/api/upload/document` | `public` | -                                   | `src/app/api/upload/document/route.ts` |

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
| `POST`  | `/api/user/import`                  | `session`                    | -                               | `src/app/api/user/import/route.ts`                  |
| `GET`   | `/api/user/me`                      | `session`                    | -                               | `src/app/api/user/me/route.ts`                      |
| `PUT`   | `/api/user/password`                | `session`                    | -                               | `src/app/api/user/password/route.ts`                |
| `GET    | POST`                               | `/api/user/privacy-settings` | `session`                       | -                                                   | `src/app/api/user/privacy-settings/route.ts` |
| `GET    | POST`                               | `/api/user/tour-status`      | `session`                       | -                                                   | `src/app/api/user/tour-status/route.ts`      |

### verification

| Methods | Path                                  | Auth Tier | Notes                           | Source                                                |
| ------- | ------------------------------------- | --------- | ------------------------------- | ----------------------------------------------------- |
| `POST`  | `/api/verification/linkedin/initiate` | `session` | -                               | `src/app/api/verification/linkedin/initiate/route.ts` |
| `POST`  | `/api/verification/skill/request`     | `session` | -                               | `src/app/api/verification/skill/request/route.ts`     |
| `POST`  | `/api/verification/skill/respond`     | `public`  | -                               | `src/app/api/verification/skill/respond/route.ts`     |
| `GET`   | `/api/verification/status`            | `session` | legacy/compat markers in source | `src/app/api/verification/status/route.ts`            |
| `POST`  | `/api/verification/veriff/session`    | `session` | -                               | `src/app/api/verification/veriff/session/route.ts`    |
| `POST`  | `/api/verification/veriff/webhook`    | `service` | -                               | `src/app/api/verification/veriff/webhook/route.ts`    |
| `POST`  | `/api/verification/work-email/send`   | `session` | -                               | `src/app/api/verification/work-email/send/route.ts`   |
| `GET`   | `/api/verification/work-email/verify` | `public`  | -                               | `src/app/api/verification/work-email/verify/route.ts` |

### verify

| Methods | Path  | Auth Tier             | Notes     | Source                          |
| ------- | ----- | --------------------- | --------- | ------------------------------- | ------------------------------------- |
| `GET    | POST` | `/api/verify/[token]` | `session` | legacy/compat markers in source | `src/app/api/verify/[token]/route.ts` |

### wellbeing

| Methods | Path                        | Auth Tier                        | Notes     | Source                                      |
| ------- | --------------------------- | -------------------------------- | --------- | ------------------------------------------- | ------------------------------------------------ |
| `GET    | POST`                       | `/api/wellbeing/checkin`         | `session` | -                                           | `src/app/api/wellbeing/checkin/route.ts`         |
| `GET`   | `/api/wellbeing/checkins`   | `session`                        | -         | `src/app/api/wellbeing/checkins/route.ts`   |
| `GET`   | `/api/wellbeing/delta`      | `session`                        | -         | `src/app/api/wellbeing/delta/route.ts`      |
| `GET`   | `/api/wellbeing/milestones` | `public`                         | -         | `src/app/api/wellbeing/milestones/route.ts` |
| `GET    | POST`                       | `/api/wellbeing/opt-in`          | `session` | -                                           | `src/app/api/wellbeing/opt-in/route.ts`          |
| `GET    | POST`                       | `/api/wellbeing/reflections`     | `session` | -                                           | `src/app/api/wellbeing/reflections/route.ts`     |
| `GET    | POST`                       | `/api/wellbeing/self-assessment` | `session` | -                                           | `src/app/api/wellbeing/self-assessment/route.ts` |
| `GET`   | `/api/wellbeing/trend`      | `public`                         | -         | `src/app/api/wellbeing/trend/route.ts`      |
| `GET    | POST`                       | `/api/wellbeing/work-schedule`   | `session` | -                                           | `src/app/api/wellbeing/work-schedule/route.ts`   |

## Compatibility / Deprecated Surface

Routes with source-level `legacy`/`deprecated` markers should be treated as compatibility surfaces and reviewed before removal.

| Path                                                   | Source                                                                 | Marker                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------ |
| `/api/analytics/events`                                | `src/app/api/analytics/events/route.ts`                                | legacy/deprecated text present |
| `/api/core/matching/matching-profile`                  | `src/app/api/core/matching/matching-profile/route.ts`                  | legacy/deprecated text present |
| `/api/core/matching/profile`                           | `src/app/api/core/matching/profile/route.ts`                           | legacy/deprecated text present |
| `/api/cron/process-deletions`                          | `src/app/api/cron/process-deletions/route.ts`                          | legacy/deprecated text present |
| `/api/cron/send-deletion-reminders`                    | `src/app/api/cron/send-deletion-reminders/route.ts`                    | legacy/deprecated text present |
| `/api/data-import/preview`                             | `src/app/api/data-import/preview/route.ts`                             | legacy/deprecated text present |
| `/api/expertise/gap-analysis`                          | `src/app/api/expertise/gap-analysis/route.ts`                          | legacy/deprecated text present |
| `/api/expertise/linkedin-import`                       | `src/app/api/expertise/linkedin-import/route.ts`                       | legacy/deprecated text present |
| `/api/expertise/user-skills`                           | `src/app/api/expertise/user-skills/route.ts`                           | legacy/deprecated text present |
| `/api/expertise/user-skills/[id]/verification-request` | `src/app/api/expertise/user-skills/[id]/verification-request/route.ts` | legacy/deprecated text present |
| `/api/goals`                                           | `src/app/api/goals/route.ts`                                           | legacy/deprecated text present |
| `/api/interviews/schedule`                             | `src/app/api/interviews/schedule/route.ts`                             | legacy/deprecated text present |
| `/api/match/decision`                                  | `src/app/api/match/decision/route.ts`                                  | legacy/deprecated text present |
| `/api/match/hide`                                      | `src/app/api/match/hide/route.ts`                                      | legacy/deprecated text present |
| `/api/matching/profile`                                | `src/app/api/matching/profile/route.ts`                                | legacy/deprecated text present |
| `/api/matching/profile/[id]`                           | `src/app/api/matching/profile/[id]/route.ts`                           | legacy/deprecated text present |
| `/api/matching-profile`                                | `src/app/api/matching-profile/route.ts`                                | legacy/deprecated text present |
| `/api/messages`                                        | `src/app/api/messages/route.ts`                                        | legacy/deprecated text present |
| `/api/messages/[conversationId]`                       | `src/app/api/messages/[conversationId]/route.ts`                       | legacy/deprecated text present |
| `/api/moderation/report`                               | `src/app/api/moderation/report/route.ts`                               | legacy/deprecated text present |
| `/api/organizations`                                   | `src/app/api/organizations/route.ts`                                   | legacy/deprecated text present |
| `/api/skill-gaps/goals`                                | `src/app/api/skill-gaps/goals/route.ts`                                | legacy/deprecated text present |
| `/api/user/consent`                                    | `src/app/api/user/consent/route.ts`                                    | legacy/deprecated text present |
| `/api/user/export`                                     | `src/app/api/user/export/route.ts`                                     | legacy/deprecated text present |
| `/api/verification/status`                             | `src/app/api/verification/status/route.ts`                             | legacy/deprecated text present |
| `/api/verify/[token]`                                  | `src/app/api/verify/[token]/route.ts`                                  | legacy/deprecated text present |

## Verification Checklist

- `npm run docs:freshness`
- `STRICT_DOCS_FRESHNESS=true npm run docs:freshness`
- `npm run lint`
- `npm run typecheck`
- API parity check: compare generated endpoint count with `find src/app/api -name route.ts | wc -l`
