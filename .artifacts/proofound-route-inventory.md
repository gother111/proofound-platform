# Proofound Route Inventory

Generated: 2026-03-16  
Workspace: `/Users/yuriibakurov/proofound`

## Purpose

This is a planning companion to `/.artifacts/proofound-implementation-status-snapshot.md`.
It captures the currently compiled route surface from the repo so the next execution blocks can
reason from the actual active tree rather than from doc intent alone.

## Quick Summary

- API route handlers under `src/app/api/**`: `213`
- App page routes under `src/app/**/page.tsx`: `92`
- Highest-volume API families:
  - `expertise` -> `18`
  - `cron` -> `17`
  - `organizations` -> `16`
  - `verification` -> `15`
  - `user` -> `13`
  - `integrations` -> `12`
  - `match` -> `11`
- MVP-critical route families for current planning:
  - `health`
  - `monitoring`
  - `verify`
  - `verification`
  - `org`
  - `conversations`
  - `decisions`
  - `engagement-verifications`
  - `upload`
  - `portfolio`
- Broad compiled families that still exceed the locked MVP corridor and should be treated as active scope until removed or hard-gated:
  - `contracts`
  - `projects`
  - `expertise`
  - `skill-gaps`
  - `integrations`
  - large parts of `organizations`
  - large parts of `admin`

## Current Planning Lens

### Most important launch routes

- `src/app/api/health/route.ts`
- `src/app/api/monitoring/launch-status/route.ts`
- `src/app/api/monitoring/perf-status/route.ts`
- `src/app/api/cron/launch-synthetic-checks/route.ts`
- `src/app/api/org/readiness/route.ts`
- `src/app/api/individual/readiness/route.ts`

### Most important verification corridor routes

- `src/app/api/verify/[token]/route.ts`
- `src/app/api/verify/custom/[token]/route.ts`
- `src/app/api/verification/requests/skill/route.ts`
- `src/app/api/verification/requests/custom/route.ts`
- `src/app/api/verification/requests/skill/[requestId]/respond/route.ts`
- `src/app/api/verification/status/route.ts`
- `src/app/api/verification/work-email/send/route.ts`
- `src/app/api/verification/work-email/verify/route.ts`
- `src/app/api/verification/linkedin/initiate/route.ts`

### Most important org corridor routes

- `src/app/api/org/[id]/shortlist/route.ts`
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
- `src/app/api/interviews/schedule/route.ts`
- `src/app/api/decisions/route.ts`
- `src/app/api/engagement-verifications/[id]/route.ts`

### Public trust and portfolio pages

- `src/app/portfolio/[handle]/page.tsx`
- `src/app/portfolio/org/[slug]/page.tsx`
- `src/app/verify/[token]/page.tsx`
- `src/app/verify/custom/[token]/page.tsx`

## API Family Counts

| Family                   | Count |
| ------------------------ | ----: |
| expertise                |    18 |
| cron                     |    17 |
| organizations            |    16 |
| verification             |    15 |
| user                     |    13 |
| integrations             |    12 |
| match                    |    11 |
| assignments              |     8 |
| feedback                 |     8 |
| portfolio                |     7 |
| interviews               |     6 |
| admin                    |     5 |
| core                     |     5 |
| notifications            |     5 |
| analytics                |     4 |
| auth                     |     4 |
| conversations            |     4 |
| moderation               |     4 |
| profile                  |     4 |
| upload                   |     4 |
| candidate-invites        |     3 |
| org                      |     3 |
| skill-gaps               |     3 |
| contracts                |     2 |
| data-import              |     2 |
| decisions                |     2 |
| matching                 |     2 |
| messages                 |     2 |
| monitoring               |     2 |
| projects                 |     2 |
| surveys                  |     2 |
| verify                   |     2 |
| csrf-token               |     1 |
| data-export              |     1 |
| engagement-verifications |     1 |
| feature-flags            |     1 |
| health                   |     1 |
| individual               |     1 |
| internal                 |     1 |
| lifecycle                |     1 |
| location                 |     1 |
| matches                  |     1 |
| matching-profile         |     1 |
| performance              |     1 |
| policy                   |     1 |
| profiles                 |     1 |
| taxonomy                 |     1 |
| updates                  |     1 |

## API Route Inventory By Family

### `admin` (5)

- `src/app/api/admin/audit/route.ts`
- `src/app/api/admin/organizations/[orgId]/audit/route.ts`
- `src/app/api/admin/organizations/[orgId]/verify/route.ts`
- `src/app/api/admin/verification/linkedin/[userId]/review/route.ts`
- `src/app/api/admin/verification/linkedin/queue/route.ts`

### `analytics` (4)

- `src/app/api/analytics/events/route.ts`
- `src/app/api/analytics/tour-event/route.ts`
- `src/app/api/analytics/track/route.ts`
- `src/app/api/analytics/web-vitals/route.ts`

### `assignments` (8)

- `src/app/api/assignments/[id]/expertise-matrix/route.ts`
- `src/app/api/assignments/[id]/outcomes/route.ts`
- `src/app/api/assignments/[id]/pipeline/route.ts`
- `src/app/api/assignments/[id]/publish/route.ts`
- `src/app/api/assignments/[id]/route.ts`
- `src/app/api/assignments/invite/[token]/route.ts`
- `src/app/api/assignments/invite/route.ts`
- `src/app/api/assignments/route.ts`

### `auth` (4)

- `src/app/api/auth/google/callback/route.ts`
- `src/app/api/auth/linkedin/callback/route.ts`
- `src/app/api/auth/linkedin/route.ts`
- `src/app/api/auth/zoom/callback/route.ts`

### `candidate-invites` (3)

- `src/app/api/candidate-invites/[token]/claim/route.ts`
- `src/app/api/candidate-invites/[token]/proof-card/route.ts`
- `src/app/api/candidate-invites/[token]/route.ts`

### `contracts` (2)

- `src/app/api/contracts/[id]/route.ts`
- `src/app/api/contracts/route.ts`

### `conversations` (4)

- `src/app/api/conversations/[conversationId]/messages/route.ts`
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
- `src/app/api/conversations/[conversationId]/route.ts`
- `src/app/api/conversations/route.ts`

### `core` (5)

- `src/app/api/core/matching/assignment/route.ts`
- `src/app/api/core/matching/interest/route.ts`
- `src/app/api/core/matching/matching-profile/route.ts`
- `src/app/api/core/matching/near-matches/route.ts`
- `src/app/api/core/matching/profile/route.ts`

### `cron` (17)

- `src/app/api/cron/account-deletion-workflow/route.ts`
- `src/app/api/cron/cv-import-temp-cleanup/route.ts`
- `src/app/api/cron/decision-reminders/route.ts`
- `src/app/api/cron/fairness-note/route.ts`
- `src/app/api/cron/fairness-report/route.ts`
- `src/app/api/cron/generate-fairness-note/route.ts`
- `src/app/api/cron/health-check/route.ts`
- `src/app/api/cron/launch-synthetic-checks/route.ts`
- `src/app/api/cron/performance-check/route.ts`
- `src/app/api/cron/process-deletions/route.ts`
- `src/app/api/cron/python-internal-worker/route.ts`
- `src/app/api/cron/refresh-matches-worker/route.ts`
- `src/app/api/cron/refresh-matches/route.ts`
- `src/app/api/cron/send-deletion-reminders/route.ts`
- `src/app/api/cron/sla-enforcement/route.ts`
- `src/app/api/cron/weekly-digest/route.ts`
- `src/app/api/cron/workflow-jobs/route.ts`

### `csrf-token` (1)

- `src/app/api/csrf-token/route.ts`

### `data-export` (1)

- `src/app/api/data-export/route.ts`

### `data-import` (2)

- `src/app/api/data-import/preview/route.ts`
- `src/app/api/data-import/route.ts`

### `decisions` (2)

- `src/app/api/decisions/route.ts`
- `src/app/api/decisions/window/[interviewId]/route.ts`

### `engagement-verifications` (1)

- `src/app/api/engagement-verifications/[id]/route.ts`

### `expertise` (18)

- `src/app/api/expertise/auto-suggest/route.ts`
- `src/app/api/expertise/cv-import/suggest/route.ts`
- `src/app/api/expertise/cv-import/wizard-apply/route.ts`
- `src/app/api/expertise/cv-import/wizard-extract/route.ts`
- `src/app/api/expertise/cv-import/wizard-extract/status/route.ts`
- `src/app/api/expertise/cv-import/wizard-suggest/route.ts`
- `src/app/api/expertise/gap-analysis/route.ts`
- `src/app/api/expertise/jd-to-l4/route.ts`
- `src/app/api/expertise/linkedin-disconnect/route.ts`
- `src/app/api/expertise/linkedin-import/route.ts`
- `src/app/api/expertise/linkedin-status/route.ts`
- `src/app/api/expertise/profile/route.ts`
- `src/app/api/expertise/stats/route.ts`
- `src/app/api/expertise/taxonomy/route.ts`
- `src/app/api/expertise/user-skills/[id]/proofs/[proofId]/route.ts`
- `src/app/api/expertise/user-skills/[id]/proofs/route.ts`
- `src/app/api/expertise/user-skills/[id]/route.ts`
- `src/app/api/expertise/user-skills/route.ts`

### `feature-flags` (1)

- `src/app/api/feature-flags/route.ts`

### `feedback` (8)

- `src/app/api/feedback/[interviewId]/route.ts`
- `src/app/api/feedback/submit/route.ts`
- `src/app/api/feedback/sus/check-trigger/route.ts`
- `src/app/api/feedback/sus/dismiss/route.ts`
- `src/app/api/feedback/sus/route.ts`
- `src/app/api/feedback/sus/submit/route.ts`
- `src/app/api/feedback/token/[token]/route.ts`
- `src/app/api/feedback/why-not-shortlisted/route.ts`

### `health` (1)

- `src/app/api/health/route.ts`

### `individual` (1)

- `src/app/api/individual/readiness/route.ts`

### `integrations` (12)

- `src/app/api/integrations/[provider]/connect/route.ts`
- `src/app/api/integrations/[provider]/disconnect/route.ts`
- `src/app/api/integrations/google/callback/route.ts`
- `src/app/api/integrations/google/connect/route.ts`
- `src/app/api/integrations/route.ts`
- `src/app/api/integrations/video/[provider]/auth/route.ts`
- `src/app/api/integrations/video/[provider]/route.ts`
- `src/app/api/integrations/video/generate-link/route.ts`
- `src/app/api/integrations/video/route.ts`
- `src/app/api/integrations/video/status/route.ts`
- `src/app/api/integrations/zoom/callback/route.ts`
- `src/app/api/integrations/zoom/connect/route.ts`

### `internal` (1)

- `src/app/api/internal/python-jobs/route.ts`

### `interviews` (6)

- `src/app/api/interviews/cancel/route.ts`
- `src/app/api/interviews/complete/route.ts`
- `src/app/api/interviews/edit/route.ts`
- `src/app/api/interviews/no-show/route.ts`
- `src/app/api/interviews/route.ts`
- `src/app/api/interviews/schedule/route.ts`

### `lifecycle` (1)

- `src/app/api/lifecycle/[operationId]/route.ts`

### `location` (1)

- `src/app/api/location/autocomplete/route.ts`

### `match` (11)

- `src/app/api/match/assignment/route.ts`
- `src/app/api/match/decision/route.ts`
- `src/app/api/match/explain/[matchId]/route.ts`
- `src/app/api/match/gates/route.ts`
- `src/app/api/match/hide/route.ts`
- `src/app/api/match/interest/route.ts`
- `src/app/api/match/profile/route.ts`
- `src/app/api/match/snooze/route.ts`
- `src/app/api/match/snoozed/route.ts`
- `src/app/api/match/test/route.ts`
- `src/app/api/match/visible-fields/[matchId]/route.ts`

### `matches` (1)

- `src/app/api/matches/[id]/snooze/route.ts`

### `matching` (2)

- `src/app/api/matching/profile/[id]/route.ts`
- `src/app/api/matching/profile/route.ts`

### `matching-profile` (1)

- `src/app/api/matching-profile/route.ts`

### `messages` (2)

- `src/app/api/messages/[conversationId]/route.ts`
- `src/app/api/messages/route.ts`

### `moderation` (4)

- `src/app/api/moderation/appeals/route.ts`
- `src/app/api/moderation/report/route.ts`
- `src/app/api/moderation/statements-of-reasons/route.ts`
- `src/app/api/moderation/transparency-report/route.ts`

### `monitoring` (2)

- `src/app/api/monitoring/launch-status/route.ts`
- `src/app/api/monitoring/perf-status/route.ts`

### `notifications` (5)

- `src/app/api/notifications/[id]/read/route.ts`
- `src/app/api/notifications/mark-all-read/route.ts`
- `src/app/api/notifications/preferences/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/unread-count/route.ts`

### `org` (3)

- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `src/app/api/org/[id]/shortlist/route.ts`
- `src/app/api/org/readiness/route.ts`

### `organizations` (16)

- `src/app/api/organizations/[orgId]/assignments/route.ts`
- `src/app/api/organizations/[orgId]/audit/export/route.ts`
- `src/app/api/organizations/[orgId]/candidate-invites/[inviteId]/route.ts`
- `src/app/api/organizations/[orgId]/candidate-invites/route.ts`
- `src/app/api/organizations/[orgId]/causes/route.ts`
- `src/app/api/organizations/[orgId]/goals/[id]/route.ts`
- `src/app/api/organizations/[orgId]/goals/route.ts`
- `src/app/api/organizations/[orgId]/ownership/[ownershipId]/route.ts`
- `src/app/api/organizations/[orgId]/ownership/route.ts`
- `src/app/api/organizations/[orgId]/partnerships/[id]/route.ts`
- `src/app/api/organizations/[orgId]/partnerships/route.ts`
- `src/app/api/organizations/[orgId]/route.ts`
- `src/app/api/organizations/[orgId]/team/route.ts`
- `src/app/api/organizations/[orgId]/test-matches/route.ts`
- `src/app/api/organizations/[orgId]/visibility/route.ts`
- `src/app/api/organizations/route.ts`

### `performance` (1)

- `src/app/api/performance/track/route.ts`

### `policy` (1)

- `src/app/api/policy/explain/route.ts`

### `portfolio` (7)

- `src/app/api/portfolio/export/route.ts`
- `src/app/api/portfolio/org/[slug]/export/route.ts`
- `src/app/api/portfolio/public/[handle]/export/route.ts`
- `src/app/api/portfolio/public/[handle]/summary/route.ts`
- `src/app/api/portfolio/text-pack/route.ts`
- `src/app/api/portfolio/view/route.ts`
- `src/app/api/portfolio/visibility/route.ts`

### `profile` (4)

- `src/app/api/profile/completeness/route.ts`
- `src/app/api/profile/privacy-settings/route.ts`
- `src/app/api/profile/snippet/route.ts`
- `src/app/api/profile/visibility/route.ts`

### `profiles` (1)

- `src/app/api/profiles/[handle]/route.ts`

### `projects` (2)

- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/route.ts`

### `skill-gaps` (3)

- `src/app/api/skill-gaps/goals/route.ts`
- `src/app/api/skill-gaps/overview/route.ts`
- `src/app/api/skill-gaps/route.ts`

### `surveys` (2)

- `src/app/api/surveys/sus/prompt/route.ts`
- `src/app/api/surveys/sus/route.ts`

### `taxonomy` (1)

- `src/app/api/taxonomy/[kind]/route.ts`

### `updates` (1)

- `src/app/api/updates/route.ts`

### `upload` (4)

- `src/app/api/upload/avatar/route.ts`
- `src/app/api/upload/cover/route.ts`
- `src/app/api/upload/document/route.ts`
- `src/app/api/upload/status/[fileId]/route.ts`

### `user` (13)

- `src/app/api/user/account/cancel-deletion/route.ts`
- `src/app/api/user/account/route.ts`
- `src/app/api/user/audit-log/purpose/route.ts`
- `src/app/api/user/audit-log/route.ts`
- `src/app/api/user/consent/check/route.ts`
- `src/app/api/user/consent/route.ts`
- `src/app/api/user/email/route.ts`
- `src/app/api/user/export/route.ts`
- `src/app/api/user/import/route.ts`
- `src/app/api/user/me/route.ts`
- `src/app/api/user/password/route.ts`
- `src/app/api/user/privacy-settings/route.ts`
- `src/app/api/user/tour-status/route.ts`

### `verification` (15)

- `src/app/api/verification/linkedin/initiate/route.ts`
- `src/app/api/verification/requests/bundles/[requestId]/route.ts`
- `src/app/api/verification/requests/custom/artifacts/route.ts`
- `src/app/api/verification/requests/custom/route.ts`
- `src/app/api/verification/requests/email-hint/route.ts`
- `src/app/api/verification/requests/impact-story/[requestId]/route.ts`
- `src/app/api/verification/requests/route.ts`
- `src/app/api/verification/requests/skill/[requestId]/respond/route.ts`
- `src/app/api/verification/requests/skill/[requestId]/route.ts`
- `src/app/api/verification/requests/skill/route.ts`
- `src/app/api/verification/status/route.ts`
- `src/app/api/verification/veriff/session/route.ts`
- `src/app/api/verification/veriff/webhook/route.ts`
- `src/app/api/verification/work-email/send/route.ts`
- `src/app/api/verification/work-email/verify/route.ts`

### `verify` (2)

- `src/app/api/verify/[token]/route.ts`
- `src/app/api/verify/custom/[token]/route.ts`

## Public Page Route Inventory

### Public-facing portfolio and trust pages

- `src/app/portfolio/[handle]/page.tsx`
- `src/app/portfolio/org/[slug]/page.tsx`
- `src/app/p/[token]/page.tsx`
- `src/app/p/[token]/embed/page.tsx`
- `src/app/verify/[token]/page.tsx`
- `src/app/verify/custom/[token]/page.tsx`
- `src/app/(public)/feedback/[token]/page.tsx`
- `src/app/candidate-invite/[token]/page.tsx`
- `src/app/assign/[token]/page.tsx`

### App pages that matter most to the current MVP corridor

- `src/app/app/i/portfolio/page.tsx`
- `src/app/app/i/verifications/page.tsx`
- `src/app/app/i/messages/page.tsx`
- `src/app/app/i/interviews/page.tsx`
- `src/app/app/o/[slug]/shortlist/page.tsx`
- `src/app/app/o/[slug]/messages/page.tsx`
- `src/app/app/o/[slug]/interviews/page.tsx`
- `src/app/app/o/[slug]/assignments/[id]/review/page.tsx`

### Notable broad page surface beyond the narrow launch corridor

- `src/app/app/i/expertise/page.tsx`
- `src/app/app/i/projects/page.tsx`
- `src/app/app/i/skill-gaps/page.tsx`
- `src/app/app/i/settings/integrations/page.tsx`
- `src/app/app/o/[slug]/projects/page.tsx`
- `src/app/app/o/[slug]/team/page.tsx`
- `src/app/app/o/[slug]/members/page.tsx`
- `src/app/admin/**`

## Inventory Notes

- Route families that are still compiled should be treated as active scope even if some are internal-only or weakly linked from the UI.
- This inventory is code-surface only. It does not prove runtime health, auth reachability, or business readiness.
- The implementation-status snapshot remains the main interpretation document:
  - `/.artifacts/proofound-implementation-status-snapshot.md`
