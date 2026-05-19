> Doc Class: `active`
> Last Verified: `2026-05-19`

# Proofound 0-5 Execution Backlog

This backlog pack turns the MVP recovery and launch hardening work into a concrete execution order for the current repo.

## Authority and evidence

Use the locked MVP stack first:

1. [`../../Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`](../../Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md)
2. [`../../PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`](../../PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md), [`../../Proofound_Project_Specification_2026-03-11.md`](../../Proofound_Project_Specification_2026-03-11.md), and [`../../PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`](../../PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md) where they do not conflict with the locked MVP
3. [`../../LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`](../../LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md) for operating guidance only
4. Current-state evidence under [`../../.artifacts/`](../../.artifacts/)

Treat [`../../audit/prioritized-roadmap.md`](../../audit/prioritized-roadmap.md) as stale evidence only. It is useful for historical context, but it does not set scope, phase order, or launch truth.

## Execution crosswalk

- `Phase 0` is a pre-feature launch gate. It enforces the locked MVP scope boundary and retires stale route-count truth before any further implementation prioritization.
- `Phase 1` maps to authoritative MVP `Phase 1 — Foundation`.
- `Phase 2` maps to authoritative MVP `Phase 2 — Trust and review`.
- `Phase 3` maps to authoritative MVP `Phase 3 — Hiring corridor`.
- `Phase 4` maps to authoritative MVP `Phase 4 — Pilot hardening`.
- `Phase 5` is launch packaging and governance cleanup that stays downstream of the locked MVP feature phases.

## Current phase-status summary

- Current phase being executed: post-`Phase 0` launch polish and evidence cleanup.
- Current top blocker: no active blocker is tracked in this backlog. The 2026-05-19 surface sweep, route inventory reruns, and verification checklist now supersede the March route-breadth blocker.
- Current route-surface truth: [`../verification-checklist.md`](../verification-checklist.md) marks `no non-MVP launch surface` as `PASS` using `npm run test:launch:routes`. Source inventory currently reports 140 compiled API route handlers and 51 compiled pages; route policy classifies 110 APIs and 48 pages as active launch paths, 16 APIs and 3 pages as internal-only launch ops, and 14 API handlers as archived compatibility responses.
- Historical route-count truth: the 2026-03-25 `149 / 117` and `138 / 106` route counts are retained only as historical March baselines. Do not use them as current implementation truth.
- Completed before backlog execution:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - focused launch, verification, and decision packs
  - `npm run test:privacy`
  - `npm run test:privacy:extended`
  - isolated and full strict org corridor reruns
  - landing and landing-visual suites
  - launch smoke refresh and live synthetic monitor refresh
- Completed during the 2026-05-19 MVP sweep:
  - `npm run test:launch:routes`
  - Browser public individual and organization fixture checks with mock mode enabled
  - route-policy, archived-handler, middleware archive, public portfolio, proof-first onboarding, and Proof Pack anchor evidence refreshes
- Still blocked:
  - none in this backlog. Treat any future blocker as fresh evidence only after rerunning the relevant checks.
- Next recommended phase-gated action:
  - continue post-Phase-0 launch polish against the locked MVP corridor
  - keep stale docs/tests from re-promoting archived Expertise Atlas, Zen, broad marketplace, fairness analytics, or generic dashboard behavior into the launch signal

## Backlog index

- [`phase-0-scope-lock.md`](phase-0-scope-lock.md)
- [`phase-1-foundation.md`](phase-1-foundation.md)
- [`phase-2-trust-review.md`](phase-2-trust-review.md)
- [`phase-3-hiring-corridor.md`](phase-3-hiring-corridor.md)
- [`phase-4-pilot-hardening.md`](phase-4-pilot-hardening.md)
- [`phase-5-launch-packaging.md`](phase-5-launch-packaging.md)
- [`dependency-map.md`](dependency-map.md)
- [`phase-exit-checklist.md`](phase-exit-checklist.md)

## Working rules for this backlog

- Do not schedule implementation from later phases while an earlier phase still contains open launch-blocking tasks.
- Do not widen scope to preserve older modules, marketing pages, compatibility flows, or org-suite surfaces just because they are already in the repo.
- Treat the public portfolio as a derived trust surface, not the center of the product.
- Separate non-blocking watch items from launch-binding tasks so the release path stays honest.
