# Bugs and Risks Audit

Audit snapshot: `2026-03-05`

## Category Scores

### Bug Risk: 2/5

The repo has real product behavior and meaningful safeguards, but there are confirmed failures and several high-value drift points that can turn into production defects quickly.

### Security Hygiene: 3/5

Security posture is better than the average startup repo because CSRF, auth guards, rate limiting, and CSP are present. The gaps are in consistency, not total absence.

### Performance: 2/5

The app builds and serves successfully, but bundle size, cold-start behavior in dev, and permissive perf budgets indicate weak current performance discipline.

## Strengths to Preserve

- `src/middleware.ts:152-199` enforces CSRF for API traffic and consistently emits request IDs.
- `src/app/auth/callback/route.ts:68-86` rejects off-origin `next` redirects.
- `src/app/api/cron/refresh-matches-worker/route.ts:44-59` uses a stronger shared secret helper than some sibling cron routes.
- Privacy verification is not theoretical. `npm run test:privacy` and `npm run test:privacy:extended` both passed on `2026-03-05`.

## Findings

### BR-01: The current baseline has a confirmed unit test failure in the CV import suggestion fallback

- Status: Fact
- Severity: P1
- Type: Code-only
- Evidence:
  - `npm run test` failed on `2026-03-05`
  - failing assertion is in `tests/lib/cv-import-suggest.test.ts:168-172`
  - the test expects a fuzzy fallback suggestion when semantic scoring fails
- Why it matters:
  - This is not a flaky infra failure. It is a correctness gap in a production-facing recommendation flow.
- Next action:
  - Fix the fallback behavior or the test contract, then rerun the full unit suite before treating matching/CV import as release-ready.

### BR-02: `refresh-matches` becomes publicly callable when `CRON_SECRET` is missing

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `src/app/api/cron/refresh-matches/route.ts:21-27` only rejects unauthorized requests when `cronSecret` is truthy
  - `src/app/api/cron/account-deletion-workflow/route.ts:19-30` and `src/app/api/cron/decision-reminders/route.ts:28-43` fail closed when `CRON_SECRET` is missing
  - `src/app/api/cron/refresh-matches-worker/route.ts:44-59` also fails closed through `requireInternalApiRequest`
- Why it matters:
  - A missing secret should disable the route, not expose it.
  - This is both an automation reliability gap and a security issue because the job can enqueue internal work from an unauthenticated request.
- Next action:
  - Normalize all cron handlers to one fail-closed auth helper and add a focused regression test for missing-secret behavior.

### BR-03: Browser security header warnings are already visible in warm production runtime

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - warm Playwright runs on `/` and `/login` emitted warnings:
    - `ambient-light-sensor`
    - `battery`
  - `src/middleware.ts:47-50` sets a broad `Permissions-Policy` list including unsupported features
  - `next.config.js:73-76` sets a different, narrower `Permissions-Policy`
- Why it matters:
  - Browser console noise is an early signal of policy drift and makes it harder to notice real runtime issues.
  - It also weakens confidence that the declared hardening policy is actually intentional and tested.
- Next action:
  - Reduce `Permissions-Policy` to supported directives and keep one canonical definition.

### BR-04: OAuth popup callback and interview join flows use browser APIs with weaker isolation than the rest of the app

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `src/lib/integrations/oauth-helpers.ts:41-47` posts to `window.opener` with `'*'`
  - `src/components/interviews/InterviewCard.tsx:58-60` opens a meeting URL with `window.open(interview.meetingLink, '_blank')`
  - `src/components/interviews/InterviewConfirmation.tsx:166-170` does the same
  - `src/components/matching/VerificationGatesWarning.tsx:53-56` opens a verification link in a new tab without `noopener,noreferrer`
- Why it matters:
  - These are not catastrophic on their own, but they are weaker than the surrounding app posture.
  - `window.opener` and uncontrolled new-tab behavior are classic places where security regressions accumulate.
- Next action:
  - Constrain popup messaging to an explicit origin and normalize new-tab opens to `noopener,noreferrer`.

### BR-05: Health endpoint exposes useful reconnaissance data to unauthenticated callers

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `src/app/api/health/route.ts:31-51` returns booleans for `hasSupabaseUrl`, `hasDatabaseUrl`, `hasSiteUrl`, and `hasServiceRoleKey`
  - warm prod verification returned the full structure publicly
- Why it matters:
  - The endpoint is operationally useful, but it also gives external callers a clean map of which secrets and dependencies are configured.
- Next action:
  - Keep public health simple and push detailed dependency/config state behind an authenticated admin or internal endpoint.

### BR-06: Mock DB fallback can turn configuration mistakes into misleadingly healthy behavior

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `src/db/index.ts:31-82` creates an in-memory DB when `DATABASE_URL` is absent
  - `src/db/index.ts:56-69` explicitly warns that operations appear to work while data is not persisted
  - `src/app/api/health/route.ts:33-48` encodes this as `usingMockDb`
- Why it matters:
  - This blurs the line between functional verification and degraded fallback mode.
  - Teams can think a feature works when they are only exercising mock persistence.
- Next action:
  - Make mock DB mode explicit, visible, and off by default outside local-only development.

### BR-07: Performance budgets and release gates are permissive relative to the actual bundle shape

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - build output on `2026-03-05` reported:
    - `/` first-load JS `315 kB`
    - `/app/i/profile` `430 kB`
    - `/app/i/zen` `479 kB`
    - shared first-load JS `219 kB`
  - `scripts/perf-budgets.mjs:25-36` allows desktop TTI up to `12000ms` and CLS up to `0.95`
- Why it matters:
  - The current budget policy is closer to "do not catastrophically fail" than "protect user experience".
  - Large routes can ship for a long time without tripping the gate.
- Next action:
  - Reset budgets from measured current-state baselines and add per-surface budget ownership for public landing and the heaviest app routes.

### BR-08: A11y suite failures currently point to test reliability debt more than a reproduced end-user failure

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `npm run test:a11y` failed with 5 navigation timeout cases on `/`, `/login`, and `/signup`
  - cold `next dev` HTML fetches during investigation took about `16s`
  - warm prod Playwright validation loaded `/`, `/login`, `/signup`, and redirected `/onboarding` successfully
- Why it matters:
  - The release signal is still bad because the test is red, but the underlying issue appears to be harness/startup reliability rather than a reproduced broken route.
- Next action:
  - Move the a11y gate to a more deterministic server mode or add explicit warmup before assertions.

### BR-09: Two `sharp` versions are loaded in the local runtime, producing duplicate `libvips` warnings on macOS

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - stopping the warm prod server emitted a macOS runtime warning about duplicate `libvips` libraries
  - `npm ls sharp @xenova/transformers --depth=3` shows:
    - `next@15.5.12 -> sharp@0.34.4`
    - `@xenova/transformers@2.17.2 -> sharp@0.32.6`
  - `package-lock.json` contains both trees
- Why it matters:
  - The warning explicitly mentions possible casting failures and mysterious crashes.
  - Even if this remains a local/macOS issue, it increases developer-environment instability and can complicate image or ML-adjacent runtime debugging.
- Next action:
  - Evaluate whether `@xenova/transformers` can be upgraded, isolated, or replaced so the app does not load two incompatible `sharp`/`libvips` trees.

## Confirmed vs Likely Risks

### Confirmed

- failing CV import suggestion contract
- `refresh-matches` auth gap when secret is missing
- duplicate/invalid permissions-policy behavior
- public health endpoint over-disclosure
- bundle size and permissive perf budgets

### Strong inference

- duplicate security policy definitions will continue to drift
- mock DB fallback can hide environment problems in previews and manual QA
- route sprawl will keep pushing bugs toward naming and ownership boundaries unless reduced

### Unverified runtime

- no authenticated warm-browser pass was performed for deep individual or organization dashboard workflows
- no production Sentry or external scheduler state was inspected from outside the repo
