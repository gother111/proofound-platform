# Automation and Flows Audit

Audit snapshot: `2026-03-05`

## Category Score

### Automation Reliability: 2/5

The repo contains a substantial amount of automation, but scheduling, auth posture, and flow ownership are inconsistent. Some flows are robust, while others are half-active compatibility paths with stale documentation.

## Primary Flows Traced

- Visitor to signup/login to onboarding gate
- Auth callback to role-based home redirect
- Organization assignment and matching surfaces from route structure
- Privacy export and immediate account deletion APIs
- Matching refresh queue and worker
- Decision reminders and bundled background work
- Admin verification and moderation surfaces from route inventory

## What Is Working and Should Be Preserved

- Auth callback redirect safety:
  - `src/app/auth/callback/route.ts:68-86`
- Immediate account deletion path is explicit and implemented:
  - `src/app/api/user/account/route.ts:24-150`
- Matching refresh worker uses a shared internal auth helper:
  - `src/app/api/cron/refresh-matches-worker/route.ts:44-59`
- Portfolio export is authenticated and bounded to the current user:
  - `src/app/api/portfolio/export/route.ts:11-67`

## Findings

### AF-01: Cron auth is not normalized across handlers

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `src/app/api/cron/refresh-matches/route.ts:21-27` allows execution if `CRON_SECRET` is absent
  - `src/app/api/cron/account-deletion-workflow/route.ts:19-30` fails closed on missing secret
  - `src/app/api/cron/decision-reminders/route.ts:28-43` fails closed on missing secret
  - `src/app/api/cron/refresh-matches-worker/route.ts:44-59` uses `requireInternalApiRequest`
- Why it matters:
  - Automation reliability depends on predictable auth and failure behavior.
  - Today the cron estate has multiple auth contracts and at least one unsafe variant.
- Next action:
  - Move every cron route onto one shared auth helper with fail-closed behavior.

### AF-02: Account deletion automation still exists as a scheduled concept even though the product is now immediate-deletion

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `src/app/api/user/account/route.ts:24-30` declares immediate, irreversible deletion
  - `src/app/api/cron/account-deletion-workflow/route.ts:8-13` says scheduled deletion/reminder processing is intentionally disabled
  - `src/app/api/cron/process-deletions/route.ts` and `src/app/api/cron/send-deletion-reminders/route.ts` still exist as compatibility surfaces
  - `README.md:279-283` and `docs/CRON_SETUP.md` still document the older scheduled model
- Why it matters:
  - Privacy flows are high-stakes. Retaining old scheduled semantics in routes and docs raises the chance of mistaken operational behavior and broken user expectations.
- Next action:
  - Collapse deletion automation to one documented model and mark legacy endpoints as deprecated compatibility stubs if they must remain.

### AF-03: Only part of the cron estate is actually scheduled

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `vercel.json:9-26` schedules 4 jobs
  - cron route inventory contains 13 handlers
  - `README.md:295-304` documents additional optional cron routes
- Why it matters:
  - The existence of a handler does not mean the workflow is alive.
  - This makes it difficult to answer simple operational questions like "what actually runs every day?"
- Next action:
  - Add a scheduler inventory doc or generated report that lists each handler as active, optional, deprecated, or manual-only.

### AF-04: `decision-reminders` is doing three jobs to conserve cron slots

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `src/app/api/cron/decision-reminders/route.ts:6-11` explicitly combines:
    - decision reminders
    - performance health checks
    - weekly digest orchestration
  - `src/app/api/cron/decision-reminders/route.ts:45-140` implements all three phases
- Why it matters:
  - Combining jobs saves scheduler slots, but it also couples unrelated background responsibilities into one failure domain.
- Next action:
  - Keep the consolidation only if scheduler limits require it; otherwise separate notification, health, and digest work into independently observable jobs.

### AF-05: Auth and onboarding routing logic is implemented and coherent

- Status: Fact
- Severity: P3
- Type: Cross-cutting
- Evidence:
  - `src/app/auth/callback/route.ts:82-86` resolves role-based destination after session exchange
  - `src/app/onboarding/page.tsx` redirects unauthenticated users to `/login` and routes authenticated users into org or individual homes
  - warm prod browser pass confirmed `/onboarding` redirects unauthenticated traffic to `/login`
- Why it matters:
  - This is one of the healthier connected flows in the repo and should not be destabilized by unrelated cleanup.
- Next action:
  - Preserve the current auth/onboarding gate and use it as the reference pattern when rationalizing other flows.

### AF-06: Privacy export and deletion flows are implemented, but only deletion has been clearly product-rationalized

- Status: Strong inference
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `src/app/api/portfolio/export/route.ts:11-67` provides authenticated PDF export
  - `src/app/api/user/account/route.ts:113-150` performs immediate deletion and anonymization
  - privacy suites passed on `2026-03-05`
- Why it matters:
  - The privacy APIs are present and partially verified, but the surrounding documentation and user-flow mapping are much clearer for deletion than for export.
- Next action:
  - Document the export journey, retention expectations, and failure handling with the same rigor already applied to deletion.

### AF-07: Admin and moderation surfaces exist, but were not fully runtime-verified in this audit pass

- Status: Unverified runtime
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - extensive admin route surface exists under `src/app/admin/*` and `src/app/api/admin/*`
  - no authenticated browser pass was run for admin-only flows during this audit
- Why it matters:
  - The system clearly supports admin workflows, but current state has only been established statically.
- Next action:
  - Run an authenticated admin smoke pass before making any release claim about moderation or verification operations.
