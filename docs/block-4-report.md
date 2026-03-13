# Block 4 Report

## Objective

Enforce Proof Pack anchoring structurally so orphan packs are no longer possible in active MVP corridors and intro-eligible users cannot rely on readiness-only filtering.

## Commands run

- `git status --short`
- `npm run test -- tests/lib/canonical-skill-proof-write.test.ts`
- `npm run test -- tests/api/expertise-user-skill-proofs-route.test.ts`
- `npm run test -- tests/actions/onboarding.test.ts`
- `npm run test -- tests/lib/individual-readiness-state.test.ts`
- `npm run test -- tests/lib/data-portability-contract.test.ts`
- `npm run test -- tests/lib/portfolio-export-data.test.ts`
- `npm run test -- tests/lib/public-portfolio-projection.test.ts`
- `npm run test -- tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts`
- `npm run db:migrate`
  - first run failed on `MIN(uuid)` in the new migration
  - second run passed after the SQL fix
- `npm run typecheck`
- `npm run lint`
- `npm run test -- tests/lib/canonical-skill-proof-write.test.ts tests/api/expertise-user-skill-proofs-route.test.ts tests/actions/onboarding.test.ts tests/lib/individual-readiness-state.test.ts`
- `npm run test -- tests/lib/data-portability-contract.test.ts tests/lib/portfolio-export-data.test.ts tests/lib/public-portfolio-projection.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts`
- `npm run test -- tests/lib/proof-pack-anchor.test.ts`

## Files changed

- `src/lib/proofs/pack-anchor.ts`
- `src/lib/proofs/canonical-pack.ts`
- `src/lib/canonical/repository.ts`
- `src/actions/onboarding.ts`
- `src/app/api/user/import/route.ts`
- `src/app/api/user/export/route.ts`
- `src/db/schema.ts`
- `src/db/migrations/20260313210500_harden_proof_pack_anchor_contract.sql`
- `tests/lib/proof-pack-anchor.test.ts`
- `docs/codex-progress.md`
- `docs/block-4-report.md`

## Tests run

- `tests/lib/canonical-skill-proof-write.test.ts`
  - PASS
- `tests/api/expertise-user-skill-proofs-route.test.ts`
  - PASS
- `tests/actions/onboarding.test.ts`
  - PASS
- `tests/lib/individual-readiness-state.test.ts`
  - PASS
- `tests/lib/data-portability-contract.test.ts`
  - PASS
- `tests/lib/portfolio-export-data.test.ts`
  - PASS
- `tests/lib/public-portfolio-projection.test.ts`
  - PASS
- `tests/api/public-portfolio-export-route.test.ts`
  - PASS
- `tests/api/portfolio-export-route.test.ts`
  - PASS
- `tests/lib/proof-pack-anchor.test.ts`
  - PASS
- `npm run db:migrate`
  - PASS on rerun, applied `20260313210500_harden_proof_pack_anchor_contract`
- `npm run typecheck`
  - PASS
- `npm run lint`
  - PASS with 2 pre-existing landing `<img>` warnings

## Result

PASS

Proof Pack anchors are now enforced in shared service code and at the database layer. Active proof-bundle writes require real context anchors, export compatibility packs are structurally owner-anchored, invalid imported packs are quarantined instead of persisted, and owner-full exports no longer re-emit quarantined or invalid packs. Post-migration proof, readiness, and export acceptance reruns stayed green.

## Remaining blockers

- Live launch-status and go/no-go still depend on stale smoke evidence because launch smoke was not refreshed in this block.
- Verification semantics drift remains open.
- Non-MVP API surface cleanup remains open.

## Exact next recommended action

Refresh launch smoke and rerun `/api/monitoring/launch-status` plus `npm run go:no-go` with fresh evidence, then start the next narrow block on canonical verification-semantics cleanup.
