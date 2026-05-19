> Doc Class: `active`
> Last Verified: `2026-05-19`

# Phase Exit Checklist

Use this checklist together with [`../verification-checklist.md`](../verification-checklist.md) and the fresh `.artifacts/` evidence files. A phase is not complete until both the checklist and the linked evidence agree.

## Phase 0 exit

- [x] Route counts are reconciled to the 2026-05-19 route-policy baseline, and earlier March `149 / 117` and `138 / 106` counts are historical only.
- [x] `npm run test:launch:routes`
- [x] [`../verification-checklist.md`](../verification-checklist.md) row `no non-MVP launch surface` is `PASS`.
- [ ] `npm run build` if code that can affect compilation changed after the latest build evidence.
- [ ] `BASE_URL=https://proofound.io npm run test:launch:smoke` before a production launch candidate.
- [ ] `npm run monitor:launch` before a production launch candidate.

## Phase 1 exit

- [x] `npm run test -- tests/ui/individual-setup-proof-first.test.tsx`
- [x] `npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-proof-pack-projection.test.ts`
- [x] `npm run test -- tests/api/public-portfolio-summary-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts tests/api/portfolio-org-export-route.test.ts tests/api/org-audit-export-routes.test.ts tests/api/cron-account-deletion-workflow-route.test.ts`
- [x] Run any focused test needed for `src/app/api/user/account/cancel-deletion/route.ts` if it changes during this phase. No route edit was made in the current sweep; cancel-deletion behavior is covered by the 2026-05-19 export/delete/auditability evidence.
- [x] [`../verification-checklist.md`](../verification-checklist.md) rows `proof-first onboarding`, `Proof Pack anchor integrity`, and `export / delete and auditability` are all `PASS`.

## Phase 2 exit

- [x] Remaining compatibility branches have an explicit retain, archive, or removal decision.
- [x] `npm run test -- tests/api/verification-status-route.test.ts tests/ui/verification-status-options.test.tsx tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/engagement-verifications-route.test.ts tests/lib/authz-policy.test.ts tests/lib/workflow-decision-record.test.ts`
- [x] `npm run test:privacy`
- [x] `npm run test:privacy:extended`
- [x] No active launch client still depends on compatibility-only verification transport or fields.

## Phase 3 exit

- [x] `npm run test -- tests/api/assignments-publish-route.test.ts tests/lib/launch-assignment-publish-smoke.test.ts`
- [x] `npm run test:e2e:org:strict`
- [x] `BASE_URL=https://proofound.io npm run test:launch:smoke`
- [x] Focused decision, engagement verification, and authz reruns are green after any corridor hardening changes.
- [ ] Assignment publish latency is within the acceptable launch threshold, or the threshold and rationale are intentionally updated with evidence.

## Phase 4 exit

- [ ] `npm run db:backup:checkpoint`
- [ ] `npm run db:restore:verify -- --checkpoint <dir>`
- [x] Backup/restore fingerprint table coverage matches the active MVP corridor and excludes retired compatibility tables.
- [x] `npm run test:launch:smoke` against local `http://localhost:33180` with the full launch-smoke artifact.
- [x] `npm run monitor:launch` against local `http://localhost:33180` with persistence disabled.
- [ ] `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`
- [x] Internal-only verification queue, dispute, revocation, and ops ownership docs are current and match the kept admin surfaces.
- [x] `npm run docs:freshness`

## Phase 5 exit

- [x] Public copy, metadata, sitemap, crawl files, and README all describe the locked MVP corridor only.
- [x] If landing-sensitive files changed, rerun `npm run test:e2e:landing` and `npm run test:e2e:landing:visual`.
- [x] The backlog index points to the current evidence files and names the active phase plus the next phase-gated action.
- [x] Non-blocking watch items are recorded separately from launch-blocking work.
