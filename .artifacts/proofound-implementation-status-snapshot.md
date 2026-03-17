# Proofound Implementation Status Snapshot

Date: 2026-03-16  
Workspace: `/Users/yuriibakurov/proofound`

## 1. Executive summary

- Locked MVP intent is clear, but current implementation status is only partially clear because repo evidence splits into three buckets: strong unit and service correctness, broad compiled surface drift, and stale launch-readiness evidence.
- The clearest implemented corridor today is Proof Pack-centered public portfolio plus public org trust, privacy-safe shortlist review, canonical decision plus distinct engagement verification, and upload privacy review.
- The strongest current contradiction to the latest audit is `/api/verify/[token]`: current code and tests point to canonical-only token resolution through `verification_records`, not mixed legacy request-table fallback.
- The strongest current contradiction to the locked MVP is still route surface breadth: the compiled API tree remains far wider than the narrow launch corridor.
- The latest audit docs are useful, but some route-surface claims are explicitly stale in the 2026-03-16 rerun itself and should not be treated as current workspace truth.
- Launch-readiness truth is not reliable right now. The latest smoke artifact exists, but it is stale by its own expiry window and recorded a failing organization corridor even before it went stale.
- `/api/monitoring/launch-status` is structurally conservative: it depends on persisted monitor rows plus smoke artifact freshness, and stale smoke evidence can keep readiness blocked.
- Public org trust is clearly implemented and backed by code, tests, a fixture, and smoke evidence.
- Blind-by-default review and progressive reveal are enforced in core review and reveal code, but the authenticated org corridor is still only partially proven at runtime because the strict org smoke failed and some broader compatibility routes remain active.
- Org role semantics are canonical in TypeScript authz code, but repo policy and schema sources are mixed because legacy role names still exist in schema, policies, and at least one active team API.
- Hire and engagement verification are clearly distinct in canonical workflow code and tests.
- Privacy around uploads is materially improved and backend-enforced, but retained `original_filename` storage means downstream exposure still depends on every consuming surface staying disciplined.

## 2. Documents reviewed

Documents actually read, in order:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
3. `PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_Project_Specification_2026-03-11.md`
6. `docs/proofound-hard-audit-2026-03-16-rerun.md`
7. `docs/proofound-hard-audit-2026-03-15-rerun.md`
8. `Startup MVP Review.txt` not found in this repo
9. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md` not found in this repo

Authority applied:

- Locked MVP document is the source of truth.
- Technical requirements and PRD define implementation expectations unless they conflict with the locked MVP.
- Launch runbook defines launch-gate expectations.
- Latest audit is a runtime lens, but the 2026-03-16 rerun explicitly marks some route-surface findings as stale after subsequent deletions in the same worktree.

## 3. Commands / checks run

Repository and doc inspection:

- `rg --files -g 'AGENTS.md' -g 'package.json' -g 'next.config.*' -g 'tsconfig*.json' -g 'prisma/**' -g 'src/app/api/**' -g 'src/lib/**' -g 'test/**' -g '.artifacts/**'`
- `for f in ...; sed -n '1,220p' "$f"; done` across the required governing docs
- `rg --files | rg 'proofound-hard-audit|Startup MVP Review|Proofound_GTM_and_Initial_Marketing_Plan|Locked_Source_of_Truth|LAUNCH_RUNBOOK|PRD_TECHNICAL_REQUIREMENTS|PRD_for_a_web_platform_MVP|Project_Specification'`
- `find src/app/api -type f | sort`
- `sed -n` on `package.json`, `tsconfig.json`, and `next.config.js`
- `rg -n "launch-status|launch status|blind-by-default|reveal|consent|verify|verification|Proof Pack|engagement verification|hire|org_owner|org_manager|org_reviewer|trust page|public portfolio|route surface|smoke|health|monitoring"` across the reviewed docs
- `find src/app -path '*/page.tsx' -o -path '*/layout.tsx' | sort | rg 'org|portfolio|profiles|public|trust|review|conversation|match|assignment|interview|decision|verification'`
- `rg -n "launch-status|smoke-artifact|synthetic-monitors|public-org-trust-fixture|verify/\[token\]|canonical|legacy|normalizeRole|org_reviewer|org_manager|org_owner|hire|engagement verification|engagement_verification|reveal|consent|filename|metadata|sanitize" src`
- `find .artifacts -maxdepth 2 -type f | sort`
- `python3` route-family inventory over `src/app/api/**`

Targeted file reads:

- `sed -n` on:
  - `src/app/api/monitoring/launch-status/route.ts`
  - `src/lib/launch/smoke-artifact.ts`
  - `src/lib/launch/synthetic-monitors.ts`
  - `src/lib/launch/contracts.ts`
  - `src/app/api/verify/[token]/route.ts`
  - `src/lib/verification/canonical-requests.ts`
  - `src/lib/verification/request-feed.ts`
  - `src/lib/verification/canonical-bundles.ts`
  - `src/actions/org.ts`
  - `src/lib/authz/policy.ts`
  - `src/lib/api/auth.ts`
  - `src/app/api/health/route.ts`
  - `src/app/api/conversations/[conversationId]/reveal/route.ts`
  - `src/lib/engagement-verifications/service.ts`
  - `src/lib/workflow/service.ts`
  - `src/app/portfolio/org/[slug]/page.tsx`
  - `src/app/portfolio/[handle]/page.tsx`
  - `src/lib/privacy/effective-visibility.ts`
  - `src/lib/portfolio/public-organization.ts`
  - `src/lib/uploads/privacy.ts`
  - `src/lib/uploads/lifecycle.ts`
  - `src/lib/upload.ts`
  - `src/lib/email/privacy.ts`
  - `src/lib/email/notifications.ts`
  - `src/lib/launch/surface-policy.ts`
  - `tests/ui/archived-mvp-routes.test.ts`
  - `tests/api/launch-surface-inventory.test.ts`
  - `src/lib/authz/index.ts`
  - `src/lib/authz/membership.ts`
  - `tests/lib/membership-normalization.test.ts`
  - `tests/api/verify-impact-token-route.test.ts`
  - `tests/api/custom-verification-routes.test.ts`
  - `tests/api/expertise-skill-verification-request-route.test.ts`
  - `src/lib/launch/public-org-trust-fixture.ts`
  - `scripts/launch-smoke-runner.ts`
  - `scripts/go-no-go-check.ts`
  - `src/app/api/monitoring/__tests__/launch-status-route.test.ts`
  - `src/app/api/organizations/[orgId]/team/route.ts`
  - `src/app/api/match/decision/route.ts`
  - `src/app/api/verification/status/route.ts`
  - `src/lib/verification/status-contract.ts`
  - `src/db/schema.ts`
  - `src/db/policies.sql`
  - `src/db/migrations/20260310153000_add_canonical_principal_membership_visibility.sql`

Checks run:

- `npm run typecheck`
  - Result: passed
- `npm run test -- src/app/api/monitoring/__tests__/launch-status-route.test.ts tests/lib/canonical-verification-request-token-resolution.test.ts tests/api/conversation-reveal-route.test.ts tests/lib/engagement-verifications.test.ts tests/lib/uploads-privacy.test.ts tests/ui/public-org-portfolio-page.test.tsx`
  - Result: passed, 6 files / 34 tests

Targeted subagent checks also reported:

- `tests/lib/authz-policy.test.ts` passed
- `tests/lib/api-auth.test.ts` passed
- `tests/actions/org-canonical-membership.test.ts` passed
- `tests/api/verify-impact-token-route.test.ts` passed
- `tests/api/linkedin-verification-initiate-route.test.ts` passed
- `tests/privacy/rls-policies.test.ts` was included in one command invocation, but did not appear in the reported Vitest output, so it cannot be counted as executed

## 4. File map by implementation area

### Launch readiness / monitoring

- `src/app/api/monitoring/launch-status/route.ts`
  - Public readiness endpoint, summary logic, persisted-vs-live refresh gate.
- `src/lib/launch/synthetic-monitors.ts`
  - Loads persisted monitor rows, smoke-artifact state, and live revalidation behavior.
- `src/lib/launch/smoke-artifact.ts`
  - Artifact schema, freshness threshold, corridor aggregation, and pass/fail rules.
- `src/lib/launch/contracts.ts`
  - Launch monitor contract and smoke matrix definitions.
- `src/lib/launch/public-org-trust-fixture.ts`
  - Canonical seeded public org trust fixture used by monitoring and smoke.
- `scripts/launch-smoke-runner.ts`
  - Writes `.artifacts/launch-smoke-report.json`.
- `scripts/go-no-go-check.ts`
  - Defines launch-gate conditions and trusts the smoke artifact plus launch-status.
- `.artifacts/launch-smoke-report.json`
  - Current runtime artifact and best direct evidence of launch corridor freshness.

### Route surface / scope

- `src/lib/launch/surface-policy.ts`
  - Explicitly classifies archived, internal-only, and active launch API surfaces.
- `tests/api/launch-surface-inventory.test.ts`
  - Expected route inventory contract.
- `src/app/api/contracts/route.ts`
  - Active compiled surface outside locked MVP scope.
- `src/app/api/projects/route.ts`
  - Active compiled surface outside locked MVP scope.
- `src/app/api/expertise/profile/route.ts`
  - Large expertise family still compiled and materially broad.
- `src/app/api/skill-gaps/route.ts`
  - Dashboard-like skill-gap surface still compiled.
- `src/app/api/integrations/route.ts`
  - Broad integration family still compiled.

### Verification corridor

- `src/app/api/verify/[token]/route.ts`
  - Tokened verification responder for skill and impact requests.
- `src/app/api/verify/custom/[token]/route.ts`
  - Tokened responder for custom verification bundles.
- `src/app/api/verification/requests/skill/route.ts`
  - Canonical skill verification request creation.
- `src/app/api/verification/requests/custom/route.ts`
  - Canonical custom bundle request creation.
- `src/app/api/verification/requests/skill/[requestId]/respond/route.ts`
  - Canonical in-app respond path.
- `src/lib/verification/canonical-requests.ts`
  - Canonical skill verification persistence and token lookup.
- `src/lib/verification/canonical-impact-requests.ts`
  - Canonical impact verification persistence and token lookup.
- `src/lib/verification/canonical-bundles.ts`
  - Canonical bundle transport.
- `src/lib/verification/request-feed.ts`
  - Canonical request feed builder.
- `src/app/api/verification/status/route.ts`
  - User-facing status surface that still reads legacy profile-level fields.
- `src/lib/verification/status-contract.ts`
  - Merges canonical records with legacy profile-level verification state.

### Org workflow / review / reveal / decision

- `src/actions/org.ts`
  - Canonical org member action enforcement and ownership-transfer actions.
- `src/app/api/org/[id]/shortlist/route.ts`
  - Privacy-safe shortlist projection.
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
  - Review, intro, and related org workflow actions.
- `src/app/api/conversations/route.ts`
  - Broader compatibility conversation creation surface.
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
  - Candidate-consented reveal route.
- `src/app/api/conversations/[conversationId]/messages/route.ts`
  - Message masking and PII-safe reveal behavior.
- `src/app/api/interviews/schedule/route.ts`
  - Interview scheduling corridor.
- `src/app/api/decisions/route.ts`
  - Canonical explicit `hire` / `advance` / `hold` / `reject` decision route.
- `src/app/api/match/decision/route.ts`
  - Older accept and decline decision surface still compiled.
- `src/lib/workflow/service.ts`
  - Canonical lifecycle transitions, reveal timeout state, decision transitions.
- `src/lib/engagement-verifications/service.ts`
  - Distinct engagement verification lifecycle after hire.

### Public trust surfaces

- `src/app/portfolio/org/[slug]/page.tsx`
  - Public org trust page.
- `src/app/portfolio/[handle]/page.tsx`
  - Public individual portfolio page.
- `src/lib/portfolio/public-projection.ts`
  - Public-safe projection and redaction logic.
- `src/lib/portfolio/public-organization.ts`
  - Narrow org trust defaults and visibility shaping.
- `src/lib/privacy/effective-visibility.ts`
  - Narrowest-wins visibility ceiling resolution.
- `src/lib/portfolio/public-contract.ts`
  - Accessible public state and indexing rules.

### Privacy / uploads / notifications

- `src/lib/uploads/privacy.ts`
  - Filename sanitization and metadata privacy assessment.
- `src/lib/uploads/lifecycle.ts`
  - Quarantine, public/private storage routing, lifecycle and filename persistence.
- `src/app/api/upload/document/route.ts`
  - Upload ingest path for document-like artifacts.
- `src/lib/email/privacy.ts`
  - Blind-safe verification email copy.
- `src/lib/email/notifications.ts`
  - Broader workflow notification payload builders.

### Auth / role semantics

- `src/lib/authz/policy.ts`
  - Canonical org role matrix.
- `src/lib/authz/membership.ts`
  - Legacy role and state normalization.
- `src/lib/api/auth.ts`
  - Canonical active org membership lookup.
- `src/lib/auth.ts`
  - App-side auth and membership mapping.
- `src/app/api/organizations/[orgId]/team/route.ts`
  - Active legacy role semantics in runtime API response and ordering.
- `src/db/schema.ts`
  - Broader role enum and retained legacy verification tables.
- `src/db/migrations/20260310153000_add_canonical_principal_membership_visibility.sql`
  - Canonicalization migration for org membership semantics.
- `src/db/policies.sql`
  - Legacy role policy drift in checked-in baseline.

### Tests / smoke / fixtures / seeds

- `.artifacts/launch-smoke-report.json`
  - Latest runtime artifact, now stale.
- `e2e/public-org-trust.smoke.spec.ts`
  - Direct smoke for public org trust surface.
- `e2e/strict/org-corridor.strict.spec.ts`
  - Main strict authenticated org corridor evidence.
- `tests/lib/canonical-verification-request-token-resolution.test.ts`
  - Direct proof that token resolution is canonical-only.
- `tests/api/conversation-reveal-route.test.ts`
  - Reveal corridor proof.
- `tests/lib/engagement-verifications.test.ts`
  - Hire versus engagement distinction proof.
- `tests/lib/uploads-privacy.test.ts`
  - Upload privacy proof.
- `tests/ui/public-org-portfolio-page.test.tsx`
  - Public org trust rendering proof.
- `scripts/seed-public-org-trust-fixture.ts`
  - Seeding path for org trust smoke.
- `e2e/helpers/strict-fixtures.ts`
  - Runtime fixture builder for strict E2E.

## 5. Current status matrix

| Area                                      | Status    | Source of truth expectation                                                               | Current repo / runtime evidence                                                                                                                     | Exact files                                                                                                                                              | Notes                                                                       |
| ----------------------------------------- | --------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Launch readiness / monitoring             | NOT READY | Fresh monitors, fresh smoke, reliable readiness truth                                     | Latest smoke artifact exists but is stale and recorded a failing org corridor; launch-status depends on persisted monitor rows plus smoke freshness | `src/app/api/monitoring/launch-status/route.ts`, `src/lib/launch/synthetic-monitors.ts`, `.artifacts/launch-smoke-report.json`                           | Readiness truth is not reliable enough for launch gating                    |
| Route surface / scope                     | NOT READY | Narrow compiled MVP corridor                                                              | Current API tree still ships broad families like `contracts`, `projects`, `expertise`, `skill-gaps`, `integrations`                                 | `src/lib/launch/surface-policy.ts`, `src/app/api/contracts/route.ts`, `src/app/api/projects/route.ts`                                                    | 2026-03-16 audit route claims are partly stale, but breadth problem remains |
| Verification corridor                     | PARTIAL   | Scoped, canonical, auditable transport                                                    | Canonical request creation and token responder are real; status, work-email, and LinkedIn still mix legacy profile fields                           | `src/app/api/verify/[token]/route.ts`, `src/lib/verification/canonical-requests.ts`, `src/lib/verification/status-contract.ts`                           | `/api/verify/[token]` itself now appears canonical-only                     |
| Org workflow / review / reveal / decision | PARTIAL   | Blind review, consented reveal, explicit hire corridor, auditable engagement verification | Core routes and services exist; strict org corridor smoke fails; compatibility routes still active                                                  | `src/app/api/org/[id]/matches/[matchId]/review/route.ts`, `src/app/api/conversations/[conversationId]/reveal/route.ts`, `src/app/api/decisions/route.ts` | Strong code, incomplete runtime confidence                                  |
| Public trust surfaces                     | READY     | Public portfolio and org trust are separate, calm, privacy-safe                           | Public org trust page, public individual portfolio, projection logic, tests, and org trust smoke all exist                                          | `src/app/portfolio/org/[slug]/page.tsx`, `src/app/portfolio/[handle]/page.tsx`, `src/lib/portfolio/public-projection.ts`                                 | Best-proven launch surface                                                  |
| Privacy / uploads / notifications         | PARTIAL   | No leakage via uploads, metadata, filenames, or workflow emails                           | Upload sanitization and quarantine are real; verification email is blind-safe; broader workflow email privacy is less directly proven               | `src/lib/uploads/privacy.ts`, `src/lib/uploads/lifecycle.ts`, `src/lib/email/privacy.ts`                                                                 | `original_filename` retention is a downstream risk                          |
| Auth / role semantics                     | PARTIAL   | Canonical `org_owner`, `org_manager`, `org_reviewer` where it matters                     | TS authz layer is canonical; DB and schema policy sources and one active team API still show legacy names                                           | `src/lib/authz/policy.ts`, `src/lib/authz/membership.ts`, `src/app/api/organizations/[orgId]/team/route.ts`                                              | Migration state matters                                                     |
| Tests / smoke / fixtures / seeds          | PARTIAL   | Fresh launch evidence and corridor-smoke coverage                                         | Focused repo tests pass; latest smoke artifact is stale and records org-corridor failure                                                            | `.artifacts/launch-smoke-report.json`, `e2e/strict/org-corridor.strict.spec.ts`, `e2e/public-org-trust.smoke.spec.ts`                                    | Good assets, not enough fresh green launch evidence                         |

## 6. Highest-confidence “implemented and real” items

- Public org trust page is real and smoke-backed:
  - `src/app/portfolio/org/[slug]/page.tsx`
  - `src/lib/launch/public-org-trust-fixture.ts`
  - `e2e/public-org-trust.smoke.spec.ts`
- Public individual portfolio privacy gating is real:
  - `src/app/portfolio/[handle]/page.tsx`
  - `src/lib/portfolio/public-projection.ts`
  - `tests/ui/public-portfolio-access-consistency.test.tsx`
- Proof Pack anchor enforcement is real:
  - `src/lib/proofs/pack-anchor.ts`
  - `src/db/schema.ts`
  - `tests/lib/proof-pack-anchor.test.ts`
- Canonical verification request creation is real:
  - `src/app/api/verification/requests/skill/route.ts`
  - `src/lib/verification/canonical-requests.ts`
- `/api/verify/[token]` token resolution is currently canonical-only in code and tests:
  - `src/app/api/verify/[token]/route.ts`
  - `tests/lib/canonical-verification-request-token-resolution.test.ts`
- Blind-safe shortlist projection is real:
  - `src/app/api/org/[id]/shortlist/route.ts`
  - `src/lib/matching/review-contract.ts`
- Decision and engagement verification are distinct in canonical workflow:
  - `src/app/api/decisions/route.ts`
  - `src/lib/engagement-verifications/service.ts`
  - `tests/lib/engagement-verifications.test.ts`
- Upload privacy review is backend-enforced:
  - `src/lib/uploads/privacy.ts`
  - `src/lib/uploads/lifecycle.ts`
  - `tests/lib/uploads-privacy.test.ts`
- Launch-status route behavior is unit-tested and consistent with its contract:
  - `src/app/api/monitoring/__tests__/launch-status-route.test.ts`

## 7. Partial / mixed / risky items

- Launch readiness is mixed and currently unusable as launch truth because the latest artifact is stale and failed before expiring:
  - `.artifacts/launch-smoke-report.json`
  - `src/app/api/monitoring/launch-status/route.ts`
- Verification system is mixed above the token responder because status, work-email, and LinkedIn still merge legacy `individual_profiles` fields with canonical records:
  - `src/app/api/verification/status/route.ts`
  - `src/lib/verification/status-contract.ts`
- Org roles are mixed across layers: canonical in TypeScript, legacy in schema, policies, and one active team API:
  - `src/lib/authz/policy.ts`
  - `src/db/policies.sql`
  - `src/app/api/organizations/[orgId]/team/route.ts`
- Reveal flow is mixed operationally because the route supports both DB-triggered and explicit state flip behavior:
  - `src/app/api/conversations/[conversationId]/reveal/route.ts`
- The org corridor has real runtime failure at explainability stage:
  - `.artifacts/launch-smoke-report.json`
  - `e2e/strict/org-corridor.strict.spec.ts`
- Legacy decision semantics remain compiled alongside canonical `hire`:
  - `src/app/api/match/decision/route.ts`
  - `src/app/api/decisions/route.ts`
- Upload privacy still depends on downstream discipline because `original_filename` is retained:
  - `src/lib/uploads/lifecycle.ts`
- Route breadth remains materially wider than a clean locked-MVP corridor:
  - `src/app/api/contracts/**`
  - `src/app/api/projects/**`
  - `src/app/api/expertise/**`
  - `src/app/api/skill-gaps/**`
  - `src/app/api/integrations/**`

## 8. Still-unverified runtime areas

- Live `/api/health` response in the current workspace
  - Missing evidence: current `curl` output against a running app
- Live `/api/monitoring/launch-status` response in the current workspace
  - Missing evidence: current `curl` output after regenerating smoke artifact
- Full authenticated org review -> explainability -> intro -> reveal -> interview -> hire corridor
  - Missing evidence: rerun of `e2e/strict/org-corridor.strict.spec.ts` with current screenshots and logs
- Full authenticated reveal progression in browser
  - Missing evidence: runtime trace showing masked -> consent request -> revealed stages
- DB and RLS parity for canonical org roles after migration
  - Missing evidence: executed `tests/privacy/rls-policies.test.ts` and `tests/privacy/rls-policies-extended.test.ts` against actual DB state
- Workflow email privacy beyond verification-request email
  - Missing evidence: route-to-email integration proof for interview and decision messages under masked-stage scenarios

## 9. Route-surface contradiction report

### Clearly active and out of scope

- `src/app/api/contracts/route.ts`
- `src/app/api/contracts/[id]/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`

### Maybe internal-only but still compiled

- `src/app/api/cron/launch-synthetic-checks/route.ts`
- `src/app/api/internal/python-jobs/route.ts`
- `src/app/api/monitoring/launch-status/route.ts`
- `src/app/api/admin/organizations/[orgId]/verify/route.ts`

### Likely harmless but should be reviewed

- `src/app/api/analytics/events/route.ts`
- `src/app/api/analytics/track/route.ts`
- `src/app/api/performance/track/route.ts`
- `src/app/api/notifications/route.ts`

### Broad user-facing families that still exceed a clean narrow corridor

- `src/app/api/expertise/profile/route.ts`
- `src/app/api/expertise/linkedin-import/route.ts`
- `src/app/api/skill-gaps/route.ts`
- `src/app/api/integrations/route.ts`

Notes:

- The 2026-03-16 audit explicitly says some earlier route-surface findings became stale after same-worktree deletions.
- Even after accounting for that warning, the current compiled route inventory is still materially broader than the locked MVP.

## 10. Verification corridor report

- Request creation is canonical-first through:
  - `src/app/api/verification/requests/skill/route.ts`
  - `src/app/api/verification/requests/custom/route.ts`
  - `src/lib/verification/canonical-requests.ts`
  - `src/lib/verification/canonical-bundles.ts`
- Token resolution is currently canonical-only in `src/app/api/verify/[token]/route.ts`
  - It redeems capability tokens, then loads canonical rows from `verification_records`
  - Token helpers live in:
    - `src/lib/verification/canonical-requests.ts`
    - `src/lib/verification/canonical-impact-requests.ts`
    - `src/lib/security/capability-tokens.ts`
- Response handling is canonical in:
  - `src/app/api/verify/[token]/route.ts`
  - `src/app/api/verify/custom/[token]/route.ts`
  - `src/app/api/verification/requests/skill/[requestId]/respond/route.ts`
- Compatibility paths still exist around status and channel semantics:
  - `src/app/api/verification/status/route.ts`
  - `src/app/api/verification/work-email/send/route.ts`
  - `src/app/api/verification/work-email/verify/route.ts`
  - `src/app/api/verification/linkedin/initiate/route.ts`
  - `src/lib/verification/status-contract.ts`
- Legacy request-table schema is still present in:
  - `src/db/schema.ts`
  - related migrations including canonical backfill and normalization migrations

Blunt state:

- `/api/verify/[token]` is no longer the best example of mixed transport.
- The mixed layer now sits above the token route in status and channel compatibility logic plus retained legacy schema.
- Overall corridor status remains `PARTIAL` because the broader verification system is still not fully legacy-free.

## 11. Org corridor report

- Assignment publish
  - Code-real and policy-gated in `src/app/api/assignments/[id]/publish/route.ts`
  - Status: code-real, runtime-unverified end to end
- Privacy-safe review
  - Code-real in `src/app/api/org/[id]/shortlist/route.ts` and `src/lib/matching/review-contract.ts`
  - Status: code-real, repo-tested
- Intro request
  - Code-real in `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
  - Status: code-real, partial runtime proof
- Reveal with consent
  - Code-real in `src/app/api/conversations/[conversationId]/reveal/route.ts` plus `src/lib/workflow/service.ts`
  - Status: partial because runtime relies on mixed explicit-update and trigger behavior
- Interview
  - Code-real in `src/app/api/interviews/schedule/route.ts`
  - Status: partial because provider and live runtime evidence are weaker
- Decision including hire
  - Clearly code-real in `src/app/api/decisions/route.ts`
  - Status: ready in code, not fully runtime-proven because org strict corridor failed
- Engagement verification
  - Clearly code-real and distinct in:
    - `src/lib/engagement-verifications/service.ts`
    - `src/app/api/engagement-verifications/[id]/route.ts`
  - Status: ready in code and repo-tested

Biggest active org-corridor drift:

- `src/app/api/organizations/[orgId]/team/route.ts`
  - Still exposes legacy role semantics
- `src/app/api/match/decision/route.ts`
  - Still exposes accept and decline semantics alongside canonical `hire`
- `src/app/api/conversations/route.ts`
  - Broader conversation creation surface remains active and older than the strict intro and reveal corridor

## 12. Launch-readiness evidence report

### `/api/health`

- Code exists in `src/app/api/health/route.ts`
- Latest audit docs say it returned healthy on 2026-03-15 and 2026-03-16
- I did not rerun live `curl` in this pass, so current runtime state is unverified

### `/api/monitoring/launch-status`

- Code exists in `src/app/api/monitoring/launch-status/route.ts`
- Focused route tests pass in `src/app/api/monitoring/__tests__/launch-status-route.test.ts`
- Latest audit docs say the live endpoint was blocked due stale persisted evidence and stale smoke evidence
- Current code confirms that smoke-artifact freshness is part of readiness determination

### Smoke artifact freshness

Current artifact:

- `.artifacts/launch-smoke-report.json`
- `generatedAt: 2026-03-16T16:13:39.183Z`
- `expiresAt: 2026-03-16T17:13:39.183Z`
- `overallStatus: fail`

Corridor results in that artifact:

- `individual`: pass
- `organization`: fail
- `trust_privacy`: pass

Organization corridor failure:

- `e2e/strict/org-corridor.strict.spec.ts`
- Failure point: “Why This Match?” explainability heading not found

Public org trust fixture:

- Clearly wired in `src/lib/launch/public-org-trust-fixture.ts`
- Seeded by `scripts/seed-public-org-trust-fixture.ts`
- Public org trust smoke passed in the artifact

Launch-gate evidence from the runbook:

- `scripts/go-no-go-check.ts` requires:
  - passing smoke artifact
  - non-stale artifact freshness
  - perf-status success
  - launch-status ready
  - restore-readiness docs and scripts

Blunt state:

- Readiness truth is not reliable right now.
- The latest artifact is stale and failed before expiring.
- The launch-status route is intentionally conservative enough that stale or failing artifacts directly keep readiness blocked.

## 13. Missing information I should gather next

- A fresh rerun of `npm run test:launch:smoke` or equivalent launch-smoke generation to replace the stale `.artifacts/launch-smoke-report.json`
- Live `curl` outputs for `/api/health` and `/api/monitoring/launch-status` against the current running app
- A rerun of `e2e/strict/org-corridor.strict.spec.ts` with screenshot and error context for the explainability failure
- Executed results for `tests/privacy/rls-policies.test.ts` and `tests/privacy/rls-policies-extended.test.ts`
- One live org member team-route payload from `src/app/api/organizations/[orgId]/team/route.ts` to confirm whether legacy roles still appear in runtime data
- One live verification-status payload from `src/app/api/verification/status/route.ts` to confirm how much legacy profile state still appears in user-facing verification semantics

## 14. Top files I should bring back for planning

### Launch / readiness

- `src/app/api/monitoring/launch-status/route.ts` + readiness truth entrypoint
- `src/lib/launch/synthetic-monitors.ts` + persisted and live monitor logic
- `src/lib/launch/smoke-artifact.ts` + artifact freshness contract
- `src/lib/launch/contracts.ts` + monitor and smoke matrix contract
- `src/lib/launch/public-org-trust-fixture.ts` + seeded trust fixture
- `scripts/launch-smoke-runner.ts` + smoke artifact writer
- `scripts/go-no-go-check.ts` + launch gate logic

### Verification

- `src/app/api/verify/[token]/route.ts` + canonical token responder
- `src/app/api/verification/requests/skill/route.ts` + canonical request creation
- `src/app/api/verification/requests/custom/route.ts` + bundle request creation
- `src/app/api/verification/status/route.ts` + mixed user-facing status surface
- `src/lib/verification/canonical-requests.ts` + canonical request persistence
- `src/lib/verification/status-contract.ts` + legacy and canonical merge
- `src/db/schema.ts` + retained legacy verification tables

### Org corridor

- `src/app/api/org/[id]/matches/[matchId]/review/route.ts` + review, intro, shortlist actions
- `src/app/api/conversations/[conversationId]/reveal/route.ts` + reveal consent flow
- `src/app/api/conversations/route.ts` + broader compatibility conversation creation
- `src/app/api/interviews/schedule/route.ts` + interview corridor
- `src/app/api/decisions/route.ts` + canonical hire corridor
- `src/app/api/match/decision/route.ts` + legacy decision drift
- `src/lib/workflow/service.ts` + lifecycle state machine
- `src/lib/engagement-verifications/service.ts` + distinct engagement verification

### Public / privacy

- `src/app/portfolio/org/[slug]/page.tsx` + public org trust page
- `src/app/portfolio/[handle]/page.tsx` + public individual portfolio
- `src/lib/portfolio/public-projection.ts` + projection and redaction logic
- `src/lib/portfolio/public-organization.ts` + narrow org visibility defaults
- `src/lib/privacy/effective-visibility.ts` + narrowest-wins visibility ceiling
- `src/lib/uploads/privacy.ts` + filename and metadata privacy assessment
- `src/lib/uploads/lifecycle.ts` + retained original filename and quarantine flow
- `src/lib/email/privacy.ts` + blind-safe verification email

### Auth / policy / evidence

- `src/lib/authz/policy.ts` + canonical role matrix
- `src/lib/authz/membership.ts` + legacy role normalization
- `src/lib/api/auth.ts` + active membership boundary
- `src/app/api/organizations/[orgId]/team/route.ts` + active legacy role semantics
- `src/db/migrations/20260310153000_add_canonical_principal_membership_visibility.sql` + canonical migration truth
- `src/db/policies.sql` + checked-in legacy policy drift
- `.artifacts/launch-smoke-report.json` + last-known runtime evidence
- `e2e/strict/org-corridor.strict.spec.ts` + current failing corridor
- `tests/privacy/rls-policies.test.ts` + DB privacy proof gap

## 15. Final blunt assessment

The implementation status is clear enough to plan the next coding blocks at a high level, but not clear enough to trust launch-readiness or end-to-end org-corridor behavior without another round of fresh evidence. The biggest blind spots are live launch-status truth, the failing authenticated org corridor, and whether canonical org-role semantics are fully true at the DB and RLS layer rather than only in TypeScript. The exact next evidence to gather before coding more is a fresh launch smoke artifact, live `/api/health` and `/api/monitoring/launch-status` outputs, a rerun of the strict org corridor with failure context, and executed RLS privacy tests against the real DB state.
