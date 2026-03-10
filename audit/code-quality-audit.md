# Code Quality Audit

Audit snapshot: `2026-03-05`

## Category Score

### Code Quality: 3/5

The codebase is serviceable and has several strong primitives, but maintainability is trending downward. The main pressure comes from breadth: many features, many route families, and several fallback or compatibility layers that now carry meaningful complexity.

## Strengths to Preserve

- Shared auth and internal API helpers exist:
  - `src/lib/auth.ts`
  - `src/lib/api/auth.ts`
  - `src/app/auth/callback/route.ts`
- Middleware centralizes several cross-cutting concerns in one place:
  - CSRF
  - rate limiting
  - scanner rejection
  - request ID attachment
- The repo has meaningful verification tooling instead of only unit tests:
  - privacy suites
  - landing Playwright contract
  - accessibility suites
  - build and drift checks

## Findings

### CQ-01: Namespace drift is now a maintainability problem

- Status: Fact
- Severity: P1
- Type: Code-only
- Evidence:
  - Matching logic is spread across route families found during audit:
    - `/api/match/*`
    - `/api/matching/*`
    - `/api/matching-profile`
    - `/api/core/matching/*`
  - App surfaces mirror that spread across `/app/i/matching`, `/app/o/[slug]/matching`, and related admin/analytics pages
- Why it matters:
  - New work has no obvious canonical extension point.
  - This increases duplicate implementations and makes deprecation harder because multiple partially overlapping paths remain active.
- Next action:
  - Publish canonical namespaces for matching, analytics, and admin flows, then deprecate aliases in stages.

### CQ-02: Fallback-heavy runtime behavior obscures true system state

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `src/db/index.ts:31-82` swaps to an in-memory DB when `DATABASE_URL` is missing
  - test runs emitted repeated schema/fallback warnings during unit execution
  - `src/app/api/monitoring/perf-status/route.ts:66-114` falls back from analytics history to active probes when no events exist
- Why it matters:
  - Defensive fallback code is useful, but too much fallback behavior makes it hard to tell whether the platform is actually healthy or simply compensating.
  - That increases debugging time and weakens release confidence.
- Next action:
  - Distinguish between expected degraded modes and exceptional recovery paths, then reduce the number of silent compatibility branches.

### CQ-03: Environment handling is disciplined in some scripts and inconsistent in others

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `package.json` requires Node `>=20.20.0 <21`
  - `scripts/playwright-node20.mjs:1-62` and `scripts/next-dev-node20.mjs:1-61` explicitly re-exec under Node 20
  - `build` and `start` scripts in `package.json` do not use the wrapper path
  - Earlier audit runs showed materially different build/start results before switching to Node 20
- Why it matters:
  - The repo has already encoded that local shells can be on the wrong Node version.
  - Partial wrapper coverage means engineers can still hit inconsistent behavior depending on which command they run.
- Next action:
  - Make Node 20 enforcement consistent across the commands used for local verification and release qualification.

### CQ-04: Landing implementation includes avoidable frontend quality debt

- Status: Fact
- Severity: P2
- Type: UX-only
- Evidence:
  - `src/components/ProofoundLanding.tsx:228-237` uses raw `<img>` for a critical logo
  - `src/components/landing/sections/FooterSection.tsx:53-62` uses raw `<img>` again
  - `npm run lint` surfaced both lines via `@next/next/no-img-element`
- Why it matters:
  - This is not catastrophic, but it signals that the most visible surface is carrying known optimization debt and avoidable lint noise.
- Next action:
  - Replace the raw landing images with the project’s chosen image strategy and clear the warnings.

### CQ-05: Animated duplicate text in footer links is a code smell, not just a visual trick

- Status: Fact
- Severity: P2
- Type: UX-only
- Evidence:
  - `src/components/landing/sections/FooterSection.tsx:96-106` renders each label twice for hover animation
  - Warm prod Playwright snapshot exposed duplicate accessible names such as `How it Works How it Works`
- Why it matters:
  - This creates avoidable accessibility and semantics issues while also making the component harder to reason about.
- Next action:
  - Keep the motion intent, but move the duplicate decorative text out of the accessibility tree.

### CQ-06: Large route count and large page bundles point to feature accretion without enough modular pruning

- Status: Strong inference
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - route inventory: `294` API handlers, `92` page files
  - build output on `2026-03-05` reported large first-load bundles:
    - `/` `315 kB`
    - `/app/i/profile` `430 kB`
    - `/app/i/zen` `479 kB`
    - shared first-load JS `219 kB`
- Why it matters:
  - The repo is paying both organizational and runtime cost for feature growth.
- Next action:
  - Add subsystem-level bundle review and route ownership review before adding more surface area.

## Top Refactor Candidates

1. Centralize header and CSP policy so `next.config.js` and `src/middleware.ts` stop competing.
2. Collapse matching route aliases behind one canonical namespace.
3. Replace implicit mock DB fallback with explicit environment modes.
4. Normalize cron auth and scheduling through shared helpers and one schedule registry.
5. Simplify landing/footer animation markup to preserve visual design without duplicate semantics.
