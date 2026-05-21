> Doc Class: `active`
> Last Verified: `2026-05-21`

# Proofound MVP Launch Master Checklist

This is the full ready-to-launch checklist for the locked Proofound MVP.

It consolidates the launch authority stack, the generated launch checklist bundle, the production and release checklists, the merge verification checklist, and the pilot ops requirements into one operator-facing launch document.

Use this checklist for the final launch review. Do not treat older partial checklists or stale verdict memos as stronger than the freshest dated launch bundle.

## Authority And Decision Rule

- Launch authority order:
  - [Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md](../Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md)
  - [PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md](../PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md)
  - [PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md](../PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md)
  - [LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md](../LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md)
  - [Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md](../Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md)
  - fresh repo-grounded audits and evidence
- Reference-only context:
  - [Proofound_Project_Specification_2026-03-11.md](../Proofound_Project_Specification_2026-03-11.md)
- Supporting launch surfaces:
  - [agent/checklists/verification.md](../agent/checklists/verification.md)
  - [docs/production-readiness-checklist.md](./production-readiness-checklist.md)
  - [docs/release-checklist.md](./release-checklist.md)
  - [docs/full-launch-signoff-memo-template.md](./full-launch-signoff-memo-template.md)
  - Current example bundle:
    - [final-launch-checklist-status.md](../.artifacts/launch-validation-2026-04-15/final-launch-checklist-status.md)
    - [full-launch-execution-checklist.md](../.artifacts/launch-validation-2026-04-15/full-launch-execution-checklist.md)
- Freshness rule:
  - If [launch-readiness-summary.md](../.artifacts/launch-readiness-summary.md) disagrees with the freshest dated full-launch checklist bundle, follow the freshest dated bundle and regenerate evidence before deciding.
- Decision rule:
  - Treat every item below as launch-blocking unless it is explicitly marked as a follow-up.
  - Do not mark launch `GO` until a fresh evidence bundle exists and the signoff memo is completed.

## 1. Scope And Corridor Truth

- [ ] The shipped product still matches the locked MVP corridor and has not widened into a broader platform.
- [ ] Proof Packs remain the product center, with the public portfolio treated as a derived surface rather than the whole product.
- [ ] The core promise still reads as proof-backed assignment review, not generic recruiting, ATS replacement, or social profile theater.
- [ ] The first corridor is still proof-first assignment review for individuals and organizations, not a broadened marketplace or enterprise suite.
- [ ] No excluded ATS, HRIS, payroll, contract-signing, marketplace, public directory, social feed, or enterprise admin scope is active in the launch UI or API surface.
- [ ] No vanity counters, fake density, or misleading popularity surfaces are active anywhere in the launch-visible experience.
- [ ] The route surface is reduced to the launch allowlist, with non-MVP routes archived, removed, or hard-gated.
- [ ] The canonical 3-role model and locked org-role constraints are still the active truth across code, DB, and API.
- [ ] Internal admin and operator tools are not exposed to public or standard user navigation.
- [ ] Launch docs, code, and evidence do not contradict each other on what the MVP includes and excludes.

## 2. Product Readiness And User-Value Gates

### Individual Corridor

- [ ] A new individual can create a safe shell account.
- [ ] A new individual can add private work context.
- [ ] A new individual can add private volunteering context.
- [ ] A new individual can add private education or learning context.
- [ ] A new individual can create at least one Proof Pack with real proof items.
- [ ] Proof Pack creation stays proof-first and does not collapse into generic profile completion.
- [ ] Skills and outcomes can be mapped to proof without breaking the proof-first model.
- [ ] Verification or attestation can be requested where useful.
- [ ] A public proof-based portfolio can be published cleanly.
- [ ] The product clearly shows what remains before the user becomes match-visible or intro-eligible.
- [ ] Export works for the individual corridor.
- [ ] Delete account works safely for the individual corridor.

### Organization Corridor

- [ ] A new organization can create an org account.
- [ ] A new organization can publish a minimal org trust page.
- [ ] Allowed collaborators can be invited with the canonical role model.
- [ ] An assignment draft can be created.
- [ ] Assignment edit works.
- [ ] Assignment publish works.
- [ ] The assignment builder enforces why, work, proof, and constraints before publish.
- [ ] The organization can review privacy-safe proof-backed submissions.
- [ ] Blind-by-default review stays active during early review stages.
- [ ] Intro request works.
- [ ] Reveal request works.
- [ ] Interview scheduling works.
- [ ] Interview rescheduling works.
- [ ] Decision recording works, including explicit `hire`.
- [ ] Engagement verification can be recorded and remains distinct from `hire`.

### Corridor Integrity

- [ ] Portfolio-ready and intro-eligible remain clearly distinct states.
- [ ] Public portfolio value remains useful even when intro eligibility is not yet met.
- [ ] Public org trust remains calm, minimal, and live.
- [ ] Review queue remains reason-coded and privacy-safe.
- [ ] Structured feedback remains available where launch policy expects it.
- [ ] Matching, browse, or shortlist behavior never overrides privacy ceilings.

## 3. Privacy, Trust, Verification, And Safety

- [ ] Blind-by-default review is enforced in production.
- [ ] Reveal requires explicit proof-review participant consent for identity-bearing access.
- [ ] Reveal stages and state transitions remain canonical and auditable.
- [ ] Public portfolio rendering does not leak private or review-only information.
- [ ] File metadata and original filenames do not leak across public, review, queue, or email surfaces.
- [ ] Workflow emails do not expose private or pre-reveal information in subjects or summaries.
- [ ] Verification language remains scoped, honest, and freshness-aware.
- [ ] Stale, disputed, contradicted, or revoked verification cannot silently keep lifting trust.
- [ ] Privacy-safe fallback states preserve caution instead of overstating certainty.
- [ ] Export returns only the caller-safe visibility shape.
- [ ] Delete or unpublish removes the public projection and prevents public rendering.
- [ ] Sensitive queue actions leave audit evidence.
- [ ] Reveal and privacy disputes have a manual handling path.
- [ ] Risky or identity-bearing uploads have a manual handling path.
- [ ] RLS and authz behavior match the current schema and policy state.
- [ ] Privacy and trust protections are treated as launch gates, not post-launch cleanup.

## 4. Engineering Verification Gates

- [ ] Local Node version matches `.nvmrc` and `package.json` engine expectations.
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run test:launch:smoke`
- [ ] `npm run test:e2e:landing`
- [ ] `npm run test:e2e:auth:real`
- [ ] `npm run test:a11y:strict`
- [ ] `npm run test:strict:quality`
- [ ] `npm run test:e2e:individual:strict`
- [ ] `npm run test:e2e:org:strict`
- [ ] `npm run test:e2e:privacy:strict`
- [ ] `npm run test:privacy`
- [ ] `npm run test:privacy:extended`
- [ ] `BASE_URL=<production-candidate-url> npm run perf:budgets`
- [ ] `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch`
- [ ] `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run launch:status`
- [ ] `npm run db:backup:checkpoint`
- [ ] `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`
- [ ] `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go`
- [ ] Protected launch-status and go/no-go commands use a server-only internal secret; examples may
      use `CRON_SECRET=<secret>` or `INTERNAL_API_SECRET=<secret>`.
- [ ] Local `next start` is stable after the build.
- [ ] Local `/api/health` responds with `status:"ok"` and no diagnostics.
- [ ] Local `/api/monitoring/launch-status` responds healthy.
- [ ] Local launch smoke artifact is fresh and visible to the runtime being tested.
- [ ] Public org trust smoke passes against the intended target.
- [ ] Archived-route and launch-surface tests pass.
- [ ] Internal admin surface tests pass.
- [ ] Launch-state, smoke-artifact, and synthetic-monitor logic all agree on current truth.
- [ ] Repo-ready and live launch evidence do not disagree in a way that changes the launch verdict.

## 5. Data, Schema, And Recovery Safety

- [ ] `npm run db:drift-check`
- [ ] `npm run db:audit:migrations`
- [ ] If migrations changed, `npm run db:migrate` has been applied through the production-safe path.
- [ ] `npm run db:push` is not used in the production migration workflow.
- [ ] A backup checkpoint exists before any high-risk DDL or launch-sensitive schema step.
- [ ] `npm run db:backup:checkpoint`
- [ ] A restore rehearsal has been run against an isolated recovery target.
- [ ] `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`
- [ ] The restore drill outcome is recorded with date and owner.
- [ ] Live schema and launch-critical policies reflect the intended release.
- [ ] Launch-critical data safety checks were run against the actual DB target used for launch.
- [ ] Test-pattern residue or seed data does not create user-facing trust, privacy, or launch-verdict confusion.

## 6. Environment, Deploy, And Production Parity

- [ ] Required strict E2E environment variables are set.
- [ ] `PII_HASH_SALT` is configured for auth and signup test paths.
- [ ] `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false` unless connected-provider scheduling is intentionally launch-blocking for this target.
- [ ] Provider OAuth credentials and deterministic provider user credentials are valid only for connected-provider advisory runs.
- [ ] `npm run test:e2e:providers:advisory` has run only if connected-provider scheduling is intentionally in scope for this target.
- [ ] `CRON_SECRET` is configured and cron endpoints are protected.
- [ ] Sentry is configured for runtime and release visibility.
- [ ] `npm run vercel:preflight`
- [ ] `npm run vercel:pull:production`
- [ ] `npm run vercel:build:production`
- [ ] Prebuilt output exists and is valid after the production-equivalent build.
- [ ] If deploying, the intended release path uses the production-first prebuilt workflow.
- [ ] If production had stale queued builds, they were pruned before retrying deploy sync.
- [ ] Required checks are green before production promotion.
- [ ] Release notes are prepared.
- [ ] Rollback strategy is documented.
- [ ] After deployment, `curl -sS https://proofound.io/api/health` returns `status:"ok"` and no diagnostics.
- [ ] After deployment, Vercel deployment metadata matches the intended SHA.
- [ ] After deployment, live `/api/monitoring/launch-status` is healthy and consistent with the bundle verdict.
- [ ] After deployment, no critical Sentry spike or runtime regression appears.

## 7. Launch Operations And Manual Queue Readiness

- [ ] Named humans are assigned for:
  - founder or launch owner
  - incident owner
  - technical owner
  - product or ops owner
  - support or verification owner
- [ ] The internal ops source of truth is reviewed in [docs/internal-ops/index.md](./internal-ops/index.md).
- [ ] Verification review SOP is current and usable.
- [ ] Redaction and risky-upload SOP is current and usable.
- [ ] Reveal and privacy dispute SOP is current and usable.
- [ ] Assignment quality checklist is current and usable.
- [ ] Engagement verification evidence checklist is current and usable.
- [ ] Workflow comms templates are ready for pilot handling.
- [ ] Internal queue and audit views are protected and operational.
- [ ] Manual review queues are staffed enough for launch conditions.
- [ ] Critical alerts are configured for auth, email, uploads, privacy, and workflow failures.
- [ ] Critical alerts have been test-fired or otherwise proven to deliver to the right humans.
- [ ] External uptime monitoring exists for `/` and `/api/health`.
- [ ] Incident classes and rollback triggers are understood by the assigned owners.
- [ ] Daily launch checks are defined and owned.
- [ ] Safe-mode and fallback actions are understood before launch day.
- [ ] Sensitive queue actions require and preserve operator notes and audit evidence.

## 8. Founder, GTM, And External Readiness

- [ ] The ICP is locked for the MVP corridor.
- [ ] The design-partner target list is locked for the current launch wave.
- [ ] The pilot package is documented.
- [ ] Pilot scope is documented.
- [ ] Pilot terms, pricing, and case-study expectations are documented.
- [ ] Founder outbound messaging matches the locked product wedge.
- [ ] Homepage messaging matches the same wedge as outbound messaging.
- [ ] Proof-submission supply-seeding plan exists for the chosen corridor.
- [ ] Org onboarding playbook exists for the pilot motion.
- [ ] Support and escalation expectations are clear for launch partners.
- [ ] There is no hidden dependency on non-launch integrations to make the MVP appear usable.
- [ ] ATS and HRIS remain off at launch unless the authority stack changes explicitly.
- [ ] No extra external platform prerequisite is assumed without explicit proof; founder and ops signoff items are the real external gates.

## 9. Launch Evidence Bundle And Signoff

- [ ] `BASE_URL=<production-candidate-url> INTERNAL_API_SECRET=<secret> npm run launch:validate`
- [ ] `npm run launch:checklist`
- [ ] A fresh dated launch-validation directory exists for the intended release review.
- [ ] The fresh bundle includes:
  - `launch-gate-status.md`
  - `commands.json`
  - redacted per-command logs for every command that ran
- [ ] `final-launch-checklist-status.md` and `final-launch-checklist-status.json` are generated by `npm run launch:checklist` and match each other.
- [ ] The fresh bundle shows no unresolved launch-blocking failures.
- [ ] Any remaining `UNVERIFIED` lines have been converted into dated evidence or explicit `NO-GO`.
- [ ] The current release SHA is recorded in the evidence bundle or signoff memo.
- [ ] The full signoff memo is completed using [docs/full-launch-signoff-memo-template.md](./full-launch-signoff-memo-template.md).
- [ ] The signoff memo names owners, records the verdict, records open risks, and lists immediate next actions.
- [ ] The final launch decision is explicit: `GO` or `NO-GO`.

## 10. Launch Day And Post-Deploy Validation

- [ ] Launch review is run against the exact commit intended for release.
- [ ] The release candidate branch or production SHA is frozen before final signoff.
- [ ] Final smoke is rerun on the exact runtime that users will hit.
- [ ] Live `/api/health` passes after deployment.
- [ ] Live `/api/monitoring/launch-status` passes after deployment.
- [ ] Live launch smoke passes after deployment.
- [ ] Public org trust page still loads after deployment.
- [ ] Individual and organization strict corridors still behave as expected after deployment.
- [ ] Privacy-sensitive review and reveal paths still behave as expected after deployment.
- [ ] No critical monitoring or alert channel is failing immediately after deployment.
- [ ] Support or verification owner is watching the queue during the initial launch window.
- [ ] The final GO or NO-GO outcome is recorded in the signoff memo and shared with the launch owners.

## Practical Command Pack

Run these in the final launch cycle unless a narrower scope or environment constraint is explicitly documented:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:launch:smoke
npm run test:e2e:landing
npm run test:e2e:auth:real
npm run test:a11y:strict
npm run test:strict:quality
npm run test:e2e:individual:strict
npm run test:e2e:org:strict
npm run test:e2e:privacy:strict
npm run test:privacy
npm run test:privacy:extended
npm run db:drift-check
npm run db:audit:migrations
npm run db:backup:checkpoint
npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json
BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch
BASE_URL=<production-candidate-url> npm run perf:budgets
BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go
BASE_URL=<production-candidate-url> INTERNAL_API_SECRET=<secret> npm run launch:validate
npm run launch:checklist
```

## Final Rule

If engineering is green but founder, ops, alerting, backup or signoff evidence is still missing, the correct verdict is still `NO-GO`.

If founder or GTM readiness is green but privacy, reveal, route-surface, build, smoke, or launch-status evidence is still red, the correct verdict is still `NO-GO`.

Launch only when the full corridor, the live runtime, and the human operating model are all ready at the same time.
