# API Reference

> Doc Class: `active`
> Verification Source: `src/app/api/**/route.ts`, `src/middleware.ts`, `package.json`, `.github/workflows/ci.yml`, `vercel.json`
> Last Verified: `2026-05-20`

Canonical API documentation generated from the current App Router route handlers under `src/app/api/**/route.ts`.

## Generation Method

- Source of truth: filesystem route scan of `src/app/api/**/route.ts`.
- HTTP methods: parsed from exported handler functions (`GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS`).
- Auth tier: heuristic classification from route path + handler source signals.
- Launch surface: classified through `src/lib/launch/surface-policy.ts`.
- Regenerate with: `node scripts/generate-api-reference.mjs`.

## Base URLs

- Production: `https://proofound.io/api`
- Local: `http://localhost:3000/api`

## Security Model (Operational)

- Session routes rely on authenticated Supabase user context.
- Mutating routes are typically CSRF-protected via middleware and route-level checks.
- Internal launch-ops routes require the internal bearer token accepted by `requireInternalOpsRequest`.
- Cron routes require `Authorization: Bearer <CRON_SECRET>`.
- Service routes may use privileged Supabase/admin operations and must remain server-only.

## Coverage Summary

- Total route handlers: **140**
- Auth tier counts: `public=37`, `session=84`, `service=1`, `cron=10`, `internal=8`
- Launch surface counts: `active MVP=108`, `internal launch ops=16`, `archived compatibility=16`
- Family count: **31**

## Endpoint Inventory

### admin

| Methods | Path                                      | Auth Tier  | Launch Surface        | Notes | Source                                                    |
| ------- | ----------------------------------------- | ---------- | --------------------- | ----- | --------------------------------------------------------- |
| `GET`   | `/api/admin/audit`                        | `internal` | `internal launch ops` | -     | `src/app/api/admin/audit/route.ts`                        |
| `GET`   | `/api/admin/internal-ops/queues`          | `internal` | `internal launch ops` | -     | `src/app/api/admin/internal-ops/queues/route.ts`          |
| `PATCH` | `/api/admin/internal-ops/queues/[id]`     | `internal` | `internal launch ops` | -     | `src/app/api/admin/internal-ops/queues/[id]/route.ts`     |
| `GET`   | `/api/admin/organizations/[orgId]/audit`  | `internal` | `internal launch ops` | -     | `src/app/api/admin/organizations/[orgId]/audit/route.ts`  |
| `POST`  | `/api/admin/organizations/[orgId]/verify` | `internal` | `internal launch ops` | -     | `src/app/api/admin/organizations/[orgId]/verify/route.ts` |

### ai

| Methods | Path                                                 | Auth Tier | Launch Surface | Notes | Source                                                               |
| ------- | ---------------------------------------------------- | --------- | -------------- | ----- | -------------------------------------------------------------------- |
| `POST`  | `/api/ai/assignments/clarify`                        | `session` | `active MVP`   | -     | `src/app/api/ai/assignments/clarify/route.ts`                        |
| `POST`  | `/api/ai/privacy-preflight/check`                    | `session` | `active MVP`   | -     | `src/app/api/ai/privacy-preflight/check/route.ts`                    |
| `POST`  | `/api/ai/proof-pack/suggest`                         | `session` | `active MVP`   | -     | `src/app/api/ai/proof-pack/suggest/route.ts`                         |
| `POST`  | `/api/ai/start-from-cv/sessions`                     | `public`  | `active MVP`   | -     | `src/app/api/ai/start-from-cv/sessions/route.ts`                     |
| `GET`   | `/api/ai/start-from-cv/sessions/[sessionId]`         | `public`  | `active MVP`   | -     | `src/app/api/ai/start-from-cv/sessions/[sessionId]/route.ts`         |
| `POST`  | `/api/ai/start-from-cv/sessions/[sessionId]/accept`  | `public`  | `active MVP`   | -     | `src/app/api/ai/start-from-cv/sessions/[sessionId]/accept/route.ts`  |
| `POST`  | `/api/ai/start-from-cv/sessions/[sessionId]/discard` | `public`  | `active MVP`   | -     | `src/app/api/ai/start-from-cv/sessions/[sessionId]/discard/route.ts` |
| `POST`  | `/api/ai/start-from-cv/sessions/[sessionId]/extract` | `public`  | `active MVP`   | -     | `src/app/api/ai/start-from-cv/sessions/[sessionId]/extract/route.ts` |
| `GET`   | `/api/ai/start-from-cv/status`                       | `public`  | `active MVP`   | -     | `src/app/api/ai/start-from-cv/status/route.ts`                       |
| `POST`  | `/api/ai/suggestions/events`                         | `session` | `active MVP`   | -     | `src/app/api/ai/suggestions/events/route.ts`                         |
| `POST`  | `/api/ai/verifications/compose`                      | `session` | `active MVP`   | -     | `src/app/api/ai/verifications/compose/route.ts`                      |

### analytics

| Methods     | Path                        | Auth Tier | Launch Surface           | Notes                           | Source                                      |
| ----------- | --------------------------- | --------- | ------------------------ | ------------------------------- | ------------------------------------------- |
| `POST`      | `/api/analytics/events`     | `public`  | `archived compatibility` | legacy/compat markers in source | `src/app/api/analytics/events/route.ts`     |
| `POST`      | `/api/analytics/tour-event` | `public`  | `archived compatibility` | legacy/compat markers in source | `src/app/api/analytics/tour-event/route.ts` |
| `POST`      | `/api/analytics/track`      | `public`  | `archived compatibility` | legacy/compat markers in source | `src/app/api/analytics/track/route.ts`      |
| `GET\|POST` | `/api/analytics/web-vitals` | `public`  | `archived compatibility` | legacy/compat markers in source | `src/app/api/analytics/web-vitals/route.ts` |

### assignments

| Methods            | Path                                     | Auth Tier | Launch Surface | Notes | Source                                                   |
| ------------------ | ---------------------------------------- | --------- | -------------- | ----- | -------------------------------------------------------- |
| `GET\|POST`        | `/api/assignments`                       | `session` | `active MVP`   | -     | `src/app/api/assignments/route.ts`                       |
| `GET\|PUT\|DELETE` | `/api/assignments/[id]`                  | `session` | `active MVP`   | -     | `src/app/api/assignments/[id]/route.ts`                  |
| `GET\|POST`        | `/api/assignments/[id]/expertise-matrix` | `session` | `active MVP`   | -     | `src/app/api/assignments/[id]/expertise-matrix/route.ts` |
| `GET\|POST`        | `/api/assignments/[id]/outcomes`         | `session` | `active MVP`   | -     | `src/app/api/assignments/[id]/outcomes/route.ts`         |
| `GET\|POST`        | `/api/assignments/[id]/pipeline`         | `session` | `active MVP`   | -     | `src/app/api/assignments/[id]/pipeline/route.ts`         |
| `POST`             | `/api/assignments/[id]/publish`          | `session` | `active MVP`   | -     | `src/app/api/assignments/[id]/publish/route.ts`          |

### candidate-invites

| Methods | Path                                        | Auth Tier | Launch Surface | Notes | Source                                                      |
| ------- | ------------------------------------------- | --------- | -------------- | ----- | ----------------------------------------------------------- |
| `GET`   | `/api/candidate-invites/[token]`            | `session` | `active MVP`   | -     | `src/app/api/candidate-invites/[token]/route.ts`            |
| `POST`  | `/api/candidate-invites/[token]/claim`      | `session` | `active MVP`   | -     | `src/app/api/candidate-invites/[token]/claim/route.ts`      |
| `POST`  | `/api/candidate-invites/[token]/proof-card` | `session` | `active MVP`   | -     | `src/app/api/candidate-invites/[token]/proof-card/route.ts` |
| `GET`   | `/api/candidate-invites/[token]/workspace`  | `session` | `active MVP`   | -     | `src/app/api/candidate-invites/[token]/workspace/route.ts`  |

### conversations

| Methods     | Path                                           | Auth Tier | Launch Surface | Notes | Source                                                         |
| ----------- | ---------------------------------------------- | --------- | -------------- | ----- | -------------------------------------------------------------- |
| `GET\|POST` | `/api/conversations`                           | `session` | `active MVP`   | -     | `src/app/api/conversations/route.ts`                           |
| `GET\|POST` | `/api/conversations/[conversationId]`          | `session` | `active MVP`   | -     | `src/app/api/conversations/[conversationId]/route.ts`          |
| `GET\|POST` | `/api/conversations/[conversationId]/messages` | `session` | `active MVP`   | -     | `src/app/api/conversations/[conversationId]/messages/route.ts` |
| `POST`      | `/api/conversations/[conversationId]/reveal`   | `session` | `active MVP`   | -     | `src/app/api/conversations/[conversationId]/reveal/route.ts`   |

### cron

| Methods | Path                                  | Auth Tier | Launch Surface           | Notes                           | Source                                                |
| ------- | ------------------------------------- | --------- | ------------------------ | ------------------------------- | ----------------------------------------------------- |
| `GET`   | `/api/cron/account-deletion-workflow` | `cron`    | `archived compatibility` | legacy/compat markers in source | `src/app/api/cron/account-deletion-workflow/route.ts` |
| `GET`   | `/api/cron/decision-reminders`        | `cron`    | `internal launch ops`    | -                               | `src/app/api/cron/decision-reminders/route.ts`        |
| `GET`   | `/api/cron/health-check`              | `cron`    | `internal launch ops`    | -                               | `src/app/api/cron/health-check/route.ts`              |
| `GET`   | `/api/cron/launch-synthetic-checks`   | `cron`    | `internal launch ops`    | -                               | `src/app/api/cron/launch-synthetic-checks/route.ts`   |
| `GET`   | `/api/cron/performance-check`         | `cron`    | `internal launch ops`    | -                               | `src/app/api/cron/performance-check/route.ts`         |
| `GET`   | `/api/cron/process-deletions`         | `cron`    | `archived compatibility` | legacy/compat markers in source | `src/app/api/cron/process-deletions/route.ts`         |
| `GET`   | `/api/cron/refresh-matches`           | `cron`    | `internal launch ops`    | -                               | `src/app/api/cron/refresh-matches/route.ts`           |
| `GET`   | `/api/cron/refresh-matches-worker`    | `cron`    | `internal launch ops`    | -                               | `src/app/api/cron/refresh-matches-worker/route.ts`    |
| `GET`   | `/api/cron/send-deletion-reminders`   | `cron`    | `archived compatibility` | legacy/compat markers in source | `src/app/api/cron/send-deletion-reminders/route.ts`   |
| `GET`   | `/api/cron/sla-enforcement`           | `cron`    | `internal launch ops`    | -                               | `src/app/api/cron/sla-enforcement/route.ts`           |

### csrf-token

| Methods | Path              | Auth Tier | Launch Surface | Notes | Source                            |
| ------- | ----------------- | --------- | -------------- | ----- | --------------------------------- |
| `GET`   | `/api/csrf-token` | `session` | `active MVP`   | -     | `src/app/api/csrf-token/route.ts` |

### decisions

| Methods | Path                                  | Auth Tier | Launch Surface | Notes | Source                                                |
| ------- | ------------------------------------- | --------- | -------------- | ----- | ----------------------------------------------------- |
| `POST`  | `/api/decisions`                      | `session` | `active MVP`   | -     | `src/app/api/decisions/route.ts`                      |
| `GET`   | `/api/decisions/window/[interviewId]` | `session` | `active MVP`   | -     | `src/app/api/decisions/window/[interviewId]/route.ts` |

### engagement-verifications

| Methods | Path                                 | Auth Tier | Launch Surface | Notes | Source                                               |
| ------- | ------------------------------------ | --------- | -------------- | ----- | ---------------------------------------------------- |
| `PATCH` | `/api/engagement-verifications/[id]` | `session` | `active MVP`   | -     | `src/app/api/engagement-verifications/[id]/route.ts` |

### expertise

| Methods         | Path                                               | Auth Tier | Launch Surface           | Notes                            | Source                                                             |
| --------------- | -------------------------------------------------- | --------- | ------------------------ | -------------------------------- | ------------------------------------------------------------------ |
| `POST`          | `/api/expertise/cv-import/wizard-apply`            | `public`  | `archived compatibility` | legacy/compat markers in source  | `src/app/api/expertise/cv-import/wizard-apply/route.ts`            |
| `POST`          | `/api/expertise/cv-import/wizard-extract`          | `public`  | `archived compatibility` | legacy/compat markers in source  | `src/app/api/expertise/cv-import/wizard-extract/route.ts`          |
| `GET`           | `/api/expertise/cv-import/wizard-extract/status`   | `public`  | `archived compatibility` | legacy/compat markers in source  | `src/app/api/expertise/cv-import/wizard-extract/status/route.ts`   |
| `POST`          | `/api/expertise/cv-import/wizard-suggest`          | `public`  | `archived compatibility` | legacy/compat markers in source  | `src/app/api/expertise/cv-import/wizard-suggest/route.ts`          |
| `POST`          | `/api/expertise/jd-to-l4`                          | `session` | `active MVP`             | -                                | `src/app/api/expertise/jd-to-l4/route.ts`                          |
| `GET`           | `/api/expertise/taxonomy`                          | `service` | `active MVP`             | compatibility handling in source | `src/app/api/expertise/taxonomy/route.ts`                          |
| `GET\|POST`     | `/api/expertise/user-skills`                       | `session` | `active MVP`             | compatibility handling in source | `src/app/api/expertise/user-skills/route.ts`                       |
| `PATCH\|DELETE` | `/api/expertise/user-skills/[id]`                  | `session` | `active MVP`             | -                                | `src/app/api/expertise/user-skills/[id]/route.ts`                  |
| `GET\|POST`     | `/api/expertise/user-skills/[id]/proofs`           | `session` | `active MVP`             | compatibility handling in source | `src/app/api/expertise/user-skills/[id]/proofs/route.ts`           |
| `DELETE`        | `/api/expertise/user-skills/[id]/proofs/[proofId]` | `session` | `active MVP`             | compatibility handling in source | `src/app/api/expertise/user-skills/[id]/proofs/[proofId]/route.ts` |

### feature-flags

| Methods | Path                 | Auth Tier | Launch Surface | Notes                            | Source                               |
| ------- | -------------------- | --------- | -------------- | -------------------------------- | ------------------------------------ |
| `GET`   | `/api/feature-flags` | `session` | `active MVP`   | compatibility handling in source | `src/app/api/feature-flags/route.ts` |

### feedback

| Methods | Path                          | Auth Tier | Launch Surface | Notes | Source                                        |
| ------- | ----------------------------- | --------- | -------------- | ----- | --------------------------------------------- |
| `GET`   | `/api/feedback/[interviewId]` | `session` | `active MVP`   | -     | `src/app/api/feedback/[interviewId]/route.ts` |
| `POST`  | `/api/feedback/submit`        | `session` | `active MVP`   | -     | `src/app/api/feedback/submit/route.ts`        |
| `GET`   | `/api/feedback/token/[token]` | `public`  | `active MVP`   | -     | `src/app/api/feedback/token/[token]/route.ts` |

### health

| Methods | Path          | Auth Tier | Launch Surface | Notes | Source                        |
| ------- | ------------- | --------- | -------------- | ----- | ----------------------------- |
| `GET`   | `/api/health` | `public`  | `active MVP`   | -     | `src/app/api/health/route.ts` |

### individual

| Methods | Path                        | Auth Tier | Launch Surface | Notes | Source                                      |
| ------- | --------------------------- | --------- | -------------- | ----- | ------------------------------------------- |
| `GET`   | `/api/individual/readiness` | `session` | `active MVP`   | -     | `src/app/api/individual/readiness/route.ts` |

### interviews

| Methods     | Path                       | Auth Tier | Launch Surface | Notes                            | Source                                     |
| ----------- | -------------------------- | --------- | -------------- | -------------------------------- | ------------------------------------------ |
| `GET`       | `/api/interviews`          | `session` | `active MVP`   | -                                | `src/app/api/interviews/route.ts`          |
| `POST`      | `/api/interviews/cancel`   | `session` | `active MVP`   | -                                | `src/app/api/interviews/cancel/route.ts`   |
| `POST`      | `/api/interviews/complete` | `session` | `active MVP`   | -                                | `src/app/api/interviews/complete/route.ts` |
| `POST`      | `/api/interviews/edit`     | `session` | `active MVP`   | -                                | `src/app/api/interviews/edit/route.ts`     |
| `POST`      | `/api/interviews/no-show`  | `session` | `active MVP`   | -                                | `src/app/api/interviews/no-show/route.ts`  |
| `GET\|POST` | `/api/interviews/schedule` | `session` | `active MVP`   | compatibility handling in source | `src/app/api/interviews/schedule/route.ts` |

### location

| Methods | Path                         | Auth Tier | Launch Surface | Notes | Source                                       |
| ------- | ---------------------------- | --------- | -------------- | ----- | -------------------------------------------- |
| `GET`   | `/api/location/autocomplete` | `public`  | `active MVP`   | -     | `src/app/api/location/autocomplete/route.ts` |

### match

| Methods             | Path                                  | Auth Tier | Launch Surface           | Notes                            | Source                                                |
| ------------------- | ------------------------------------- | --------- | ------------------------ | -------------------------------- | ----------------------------------------------------- |
| `POST`              | `/api/match/assignment`               | `public`  | `active MVP`             | -                                | `src/app/api/match/assignment/route.ts`               |
| `GET`               | `/api/match/explain/[matchId]`        | `session` | `active MVP`             | -                                | `src/app/api/match/explain/[matchId]/route.ts`        |
| `POST`              | `/api/match/gates`                    | `session` | `active MVP`             | -                                | `src/app/api/match/gates/route.ts`                    |
| `GET\|POST\|DELETE` | `/api/match/hide`                     | `session` | `active MVP`             | compatibility handling in source | `src/app/api/match/hide/route.ts`                     |
| `GET\|POST`         | `/api/match/interest`                 | `public`  | `active MVP`             | -                                | `src/app/api/match/interest/route.ts`                 |
| `POST`              | `/api/match/profile`                  | `public`  | `active MVP`             | -                                | `src/app/api/match/profile/route.ts`                  |
| `GET`               | `/api/match/snoozed`                  | `session` | `active MVP`             | -                                | `src/app/api/match/snoozed/route.ts`                  |
| `GET`               | `/api/match/test`                     | `public`  | `archived compatibility` | -                                | `src/app/api/match/test/route.ts`                     |
| `GET`               | `/api/match/visible-fields/[matchId]` | `session` | `active MVP`             | -                                | `src/app/api/match/visible-fields/[matchId]/route.ts` |

### matches

| Methods        | Path                       | Auth Tier | Launch Surface | Notes | Source                                     |
| -------------- | -------------------------- | --------- | -------------- | ----- | ------------------------------------------ |
| `POST\|DELETE` | `/api/matches/[id]/snooze` | `session` | `active MVP`   | -     | `src/app/api/matches/[id]/snooze/route.ts` |

### matching-profile

| Methods    | Path                    | Auth Tier | Launch Surface | Notes | Source                                  |
| ---------- | ----------------------- | --------- | -------------- | ----- | --------------------------------------- |
| `GET\|PUT` | `/api/matching-profile` | `public`  | `active MVP`   | -     | `src/app/api/matching-profile/route.ts` |

### monitoring

| Methods | Path                                 | Auth Tier  | Launch Surface        | Notes                            | Source                                               |
| ------- | ------------------------------------ | ---------- | --------------------- | -------------------------------- | ---------------------------------------------------- |
| `GET`   | `/api/monitoring/health-diagnostics` | `internal` | `internal launch ops` | -                                | `src/app/api/monitoring/health-diagnostics/route.ts` |
| `GET`   | `/api/monitoring/launch-status`      | `internal` | `internal launch ops` | -                                | `src/app/api/monitoring/launch-status/route.ts`      |
| `GET`   | `/api/monitoring/perf-status`        | `internal` | `internal launch ops` | compatibility handling in source | `src/app/api/monitoring/perf-status/route.ts`        |

### org

| Methods | Path                                     | Auth Tier | Launch Surface | Notes | Source                                                   |
| ------- | ---------------------------------------- | --------- | -------------- | ----- | -------------------------------------------------------- |
| `POST`  | `/api/org/[id]/matches/[matchId]/review` | `session` | `active MVP`   | -     | `src/app/api/org/[id]/matches/[matchId]/review/route.ts` |
| `GET`   | `/api/org/[id]/shortlist`                | `session` | `active MVP`   | -     | `src/app/api/org/[id]/shortlist/route.ts`                |
| `GET`   | `/api/org/readiness`                     | `session` | `active MVP`   | -     | `src/app/api/org/readiness/route.ts`                     |

### organizations

| Methods     | Path                                                      | Auth Tier | Launch Surface        | Notes                            | Source                                                                    |
| ----------- | --------------------------------------------------------- | --------- | --------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| `GET`       | `/api/organizations`                                      | `session` | `active MVP`          | compatibility handling in source | `src/app/api/organizations/route.ts`                                      |
| `GET\|PUT`  | `/api/organizations/[orgId]`                              | `session` | `active MVP`          | -                                | `src/app/api/organizations/[orgId]/route.ts`                              |
| `GET`       | `/api/organizations/[orgId]/assignments`                  | `session` | `active MVP`          | -                                | `src/app/api/organizations/[orgId]/assignments/route.ts`                  |
| `GET`       | `/api/organizations/[orgId]/audit/export`                 | `session` | `internal launch ops` | -                                | `src/app/api/organizations/[orgId]/audit/export/route.ts`                 |
| `GET\|POST` | `/api/organizations/[orgId]/candidate-invites`            | `session` | `active MVP`          | -                                | `src/app/api/organizations/[orgId]/candidate-invites/route.ts`            |
| `PATCH`     | `/api/organizations/[orgId]/candidate-invites/[inviteId]` | `session` | `active MVP`          | -                                | `src/app/api/organizations/[orgId]/candidate-invites/[inviteId]/route.ts` |
| `GET`       | `/api/organizations/[orgId]/team`                         | `session` | `active MVP`          | -                                | `src/app/api/organizations/[orgId]/team/route.ts`                         |
| `GET\|PUT`  | `/api/organizations/[orgId]/visibility`                   | `session` | `active MVP`          | -                                | `src/app/api/organizations/[orgId]/visibility/route.ts`                   |

### performance

| Methods | Path                     | Auth Tier | Launch Surface           | Notes                           | Source                                   |
| ------- | ------------------------ | --------- | ------------------------ | ------------------------------- | ---------------------------------------- |
| `POST`  | `/api/performance/track` | `public`  | `archived compatibility` | legacy/compat markers in source | `src/app/api/performance/track/route.ts` |

### portfolio

| Methods     | Path                                     | Auth Tier | Launch Surface | Notes | Source                                                   |
| ----------- | ---------------------------------------- | --------- | -------------- | ----- | -------------------------------------------------------- |
| `GET`       | `/api/portfolio/export`                  | `session` | `active MVP`   | -     | `src/app/api/portfolio/export/route.ts`                  |
| `GET`       | `/api/portfolio/org/[slug]/export`       | `session` | `active MVP`   | -     | `src/app/api/portfolio/org/[slug]/export/route.ts`       |
| `GET`       | `/api/portfolio/public/[handle]/export`  | `public`  | `active MVP`   | -     | `src/app/api/portfolio/public/[handle]/export/route.ts`  |
| `GET`       | `/api/portfolio/public/[handle]/summary` | `public`  | `active MVP`   | -     | `src/app/api/portfolio/public/[handle]/summary/route.ts` |
| `GET`       | `/api/portfolio/text-pack`               | `session` | `active MVP`   | -     | `src/app/api/portfolio/text-pack/route.ts`               |
| `GET\|POST` | `/api/portfolio/visibility`              | `session` | `active MVP`   | -     | `src/app/api/portfolio/visibility/route.ts`              |

### profile

| Methods     | Path                            | Auth Tier | Launch Surface           | Notes                           | Source                                          |
| ----------- | ------------------------------- | --------- | ------------------------ | ------------------------------- | ----------------------------------------------- |
| `GET`       | `/api/profile`                  | `session` | `active MVP`             | -                               | `src/app/api/profile/route.ts`                  |
| `GET`       | `/api/profile/completeness`     | `public`  | `archived compatibility` | legacy/compat markers in source | `src/app/api/profile/completeness/route.ts`     |
| `GET\|POST` | `/api/profile/privacy-settings` | `session` | `active MVP`             | -                               | `src/app/api/profile/privacy-settings/route.ts` |
| `GET\|POST` | `/api/profile/visibility`       | `session` | `active MVP`             | -                               | `src/app/api/profile/visibility/route.ts`       |

### proof-artifacts

| Methods | Path                                                      | Auth Tier | Launch Surface | Notes | Source                                                                    |
| ------- | --------------------------------------------------------- | --------- | -------------- | ----- | ------------------------------------------------------------------------- |
| `POST`  | `/api/proof-artifacts/[artifactId]/text-extraction`       | `session` | `active MVP`   | -     | `src/app/api/proof-artifacts/[artifactId]/text-extraction/route.ts`       |
| `POST`  | `/api/proof-artifacts/[artifactId]/text-extraction/apply` | `session` | `active MVP`   | -     | `src/app/api/proof-artifacts/[artifactId]/text-extraction/apply/route.ts` |
| `GET`   | `/api/proof-artifacts/text-extraction/status`             | `session` | `active MVP`   | -     | `src/app/api/proof-artifacts/text-extraction/status/route.ts`             |

### upload

| Methods        | Path                          | Auth Tier | Launch Surface | Notes | Source                                        |
| -------------- | ----------------------------- | --------- | -------------- | ----- | --------------------------------------------- |
| `POST\|DELETE` | `/api/upload/avatar`          | `public`  | `active MVP`   | -     | `src/app/api/upload/avatar/route.ts`          |
| `POST`         | `/api/upload/cover`           | `public`  | `active MVP`   | -     | `src/app/api/upload/cover/route.ts`           |
| `POST\|DELETE` | `/api/upload/document`        | `public`  | `active MVP`   | -     | `src/app/api/upload/document/route.ts`        |
| `GET`          | `/api/upload/status/[fileId]` | `public`  | `active MVP`   | -     | `src/app/api/upload/status/[fileId]/route.ts` |

### user

| Methods       | Path                                | Auth Tier | Launch Surface           | Notes                            | Source                                              |
| ------------- | ----------------------------------- | --------- | ------------------------ | -------------------------------- | --------------------------------------------------- |
| `GET\|DELETE` | `/api/user/account`                 | `session` | `active MVP`             | -                                | `src/app/api/user/account/route.ts`                 |
| `POST`        | `/api/user/account/cancel-deletion` | `session` | `archived compatibility` | -                                | `src/app/api/user/account/cancel-deletion/route.ts` |
| `GET`         | `/api/user/audit-log`               | `session` | `active MVP`             | -                                | `src/app/api/user/audit-log/route.ts`               |
| `GET`         | `/api/user/audit-log/purpose`       | `public`  | `archived compatibility` | -                                | `src/app/api/user/audit-log/purpose/route.ts`       |
| `GET\|POST`   | `/api/user/consent`                 | `session` | `active MVP`             | compatibility handling in source | `src/app/api/user/consent/route.ts`                 |
| `GET`         | `/api/user/consent/check`           | `session` | `active MVP`             | -                                | `src/app/api/user/consent/check/route.ts`           |
| `GET`         | `/api/user/data-inventory`          | `session` | `active MVP`             | -                                | `src/app/api/user/data-inventory/route.ts`          |
| `GET\|PUT`    | `/api/user/email`                   | `session` | `active MVP`             | -                                | `src/app/api/user/email/route.ts`                   |
| `GET`         | `/api/user/export`                  | `session` | `active MVP`             | compatibility handling in source | `src/app/api/user/export/route.ts`                  |
| `GET`         | `/api/user/me`                      | `session` | `active MVP`             | -                                | `src/app/api/user/me/route.ts`                      |
| `PUT`         | `/api/user/password`                | `session` | `active MVP`             | -                                | `src/app/api/user/password/route.ts`                |
| `GET\|POST`   | `/api/user/privacy-settings`        | `session` | `active MVP`             | -                                | `src/app/api/user/privacy-settings/route.ts`        |

### verification

| Methods            | Path                                                   | Auth Tier | Launch Surface | Notes | Source                                                                 |
| ------------------ | ------------------------------------------------------ | --------- | -------------- | ----- | ---------------------------------------------------------------------- |
| `GET`              | `/api/verification/requests`                           | `session` | `active MVP`   | -     | `src/app/api/verification/requests/route.ts`                           |
| `GET\|POST\|PATCH` | `/api/verification/requests/bundles/[requestId]`       | `session` | `active MVP`   | -     | `src/app/api/verification/requests/bundles/[requestId]/route.ts`       |
| `POST`             | `/api/verification/requests/custom`                    | `session` | `active MVP`   | -     | `src/app/api/verification/requests/custom/route.ts`                    |
| `GET`              | `/api/verification/requests/custom/artifacts`          | `public`  | `active MVP`   | -     | `src/app/api/verification/requests/custom/artifacts/route.ts`          |
| `GET`              | `/api/verification/requests/email-hint`                | `public`  | `active MVP`   | -     | `src/app/api/verification/requests/email-hint/route.ts`                |
| `POST\|DELETE`     | `/api/verification/requests/impact-story/[requestId]`  | `public`  | `active MVP`   | -     | `src/app/api/verification/requests/impact-story/[requestId]/route.ts`  |
| `GET\|POST`        | `/api/verification/requests/skill`                     | `session` | `active MVP`   | -     | `src/app/api/verification/requests/skill/route.ts`                     |
| `POST\|DELETE`     | `/api/verification/requests/skill/[requestId]`         | `public`  | `active MVP`   | -     | `src/app/api/verification/requests/skill/[requestId]/route.ts`         |
| `POST`             | `/api/verification/requests/skill/[requestId]/respond` | `session` | `active MVP`   | -     | `src/app/api/verification/requests/skill/[requestId]/respond/route.ts` |
| `GET`              | `/api/verification/status`                             | `session` | `active MVP`   | -     | `src/app/api/verification/status/route.ts`                             |
| `POST`             | `/api/verification/work-email/send`                    | `session` | `active MVP`   | -     | `src/app/api/verification/work-email/send/route.ts`                    |
| `GET`              | `/api/verification/work-email/verify`                  | `public`  | `active MVP`   | -     | `src/app/api/verification/work-email/verify/route.ts`                  |

### verify

| Methods     | Path                         | Auth Tier | Launch Surface | Notes                            | Source                                       |
| ----------- | ---------------------------- | --------- | -------------- | -------------------------------- | -------------------------------------------- |
| `GET\|POST` | `/api/verify/[token]`        | `session` | `active MVP`   | compatibility handling in source | `src/app/api/verify/[token]/route.ts`        |
| `GET\|POST` | `/api/verify/custom/[token]` | `public`  | `active MVP`   | -                                | `src/app/api/verify/custom/[token]/route.ts` |

## Compatibility / Deprecated Surface

Routes with source-level `legacy`/`deprecated` markers should be treated as compatibility surfaces and reviewed before removal.

| Path                                             | Source                                                           | Marker                            |
| ------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------- |
| `/api/analytics/events`                          | `src/app/api/analytics/events/route.ts`                          | archived by launch surface policy |
| `/api/analytics/tour-event`                      | `src/app/api/analytics/tour-event/route.ts`                      | archived by launch surface policy |
| `/api/analytics/track`                           | `src/app/api/analytics/track/route.ts`                           | archived by launch surface policy |
| `/api/analytics/web-vitals`                      | `src/app/api/analytics/web-vitals/route.ts`                      | archived by launch surface policy |
| `/api/cron/account-deletion-workflow`            | `src/app/api/cron/account-deletion-workflow/route.ts`            | archived by launch surface policy |
| `/api/cron/process-deletions`                    | `src/app/api/cron/process-deletions/route.ts`                    | archived by launch surface policy |
| `/api/cron/send-deletion-reminders`              | `src/app/api/cron/send-deletion-reminders/route.ts`              | archived by launch surface policy |
| `/api/expertise/cv-import/wizard-apply`          | `src/app/api/expertise/cv-import/wizard-apply/route.ts`          | archived by launch surface policy |
| `/api/expertise/cv-import/wizard-extract`        | `src/app/api/expertise/cv-import/wizard-extract/route.ts`        | archived by launch surface policy |
| `/api/expertise/cv-import/wizard-extract/status` | `src/app/api/expertise/cv-import/wizard-extract/status/route.ts` | archived by launch surface policy |
| `/api/expertise/cv-import/wizard-suggest`        | `src/app/api/expertise/cv-import/wizard-suggest/route.ts`        | archived by launch surface policy |
| `/api/match/test`                                | `src/app/api/match/test/route.ts`                                | archived by launch surface policy |
| `/api/performance/track`                         | `src/app/api/performance/track/route.ts`                         | archived by launch surface policy |
| `/api/profile/completeness`                      | `src/app/api/profile/completeness/route.ts`                      | archived by launch surface policy |
| `/api/user/account/cancel-deletion`              | `src/app/api/user/account/cancel-deletion/route.ts`              | archived by launch surface policy |
| `/api/user/audit-log/purpose`                    | `src/app/api/user/audit-log/purpose/route.ts`                    | archived by launch surface policy |

## Verification Checklist

- `npm run docs:freshness`
- `STRICT_DOCS_FRESHNESS=true npm run docs:freshness`
- `npm run lint`
- `npm run typecheck`
- API parity check: compare generated endpoint count with `find src/app/api -name route.ts | wc -l`
