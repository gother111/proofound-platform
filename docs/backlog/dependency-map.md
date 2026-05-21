> Doc Class: `active`
> Last Verified: `2026-05-21`

# Proofound Backlog Dependency Map

## Current execution status

- `Phase 0`: resolved for route-surface truth in the 2026-05-19 sweep
- `Phase 1`: resolved for proof-first onboarding, Proof Pack anchor integrity, and export/delete/auditability in the 2026-05-19 sweep; gated narrative-surface disposition remains non-blocking
- `Phase 2`: resolved for current canonical verification token transport, launch-client verification dependence, and trust/review rechecks in the 2026-05-19 sweep
- `Phase 3`: partially resolved in the 2026-05-19 sweep; assignment list duplicate match-count work was removed, corridor/role checks remain green, and live/staging perf-budget proof stays as a non-blocking watch item
- `Phase 4`: partially resolved for internal-only ops queue, local full smoke, and local monitor evidence in the 2026-05-19 sweep; production-candidate backup, restore, and go/no-go proof remains open
- `Phase 5`: partially resolved for public copy and crawl-surface alignment in the 2026-05-19 sweep; final packaging waits for Phase 4 completion

## Phase-level dependency graph

```mermaid
flowchart LR
  P0["Phase 0<br/>Scope lock and route-surface reduction"] --> P1["Phase 1<br/>Foundation and individual corridor integrity"]
  P1 --> P2["Phase 2<br/>Trust and review canonicalization"]
  P2 --> P3["Phase 3<br/>Assignment-review corridor and assignment runtime hardening"]
  P3 --> P4["Phase 4<br/>Pilot hardening and launch ops"]
  P4 --> P5["Phase 5<br/>Launch packaging and governance cleanup"]
```

## Critical path

1. `P0-1` -> `P0-2` -> `P0-3`
2. `P1-1`, `P1-2`, and `P1-3` may run in parallel after Phase 0 passes; `P1-4` waits for them
3. `P2-1`, `P2-2`, and `P2-3` are resolved for the current sweep; reopen Phase 2 only if old request-table transport returns to active launch code
4. `P3-1` is locally hardened but still needs live/staging perf evidence; `P3-2` and `P3-3` are resolved for the current sweep
5. `P4-1` has current local smoke and monitor evidence but still needs backup, restore, and go/no-go proof; `P4-2` internal-only queue behavior is current as of 2026-05-19, and `P4-3` stays open for final docs/evidence reconciliation
6. `P5-1` public copy/crawl alignment is partially current as of 2026-05-19; `P5-2` and `P5-3` wait for Phase 4 completion and final evidence packaging

## Gate rules

- Do not reopen Phase 0 or Phase 1 unless fresh evidence regresses their 2026-05-19 `PASS` rows.
- Do not start compatibility cleanup that can affect trust/review behavior without rerunning the relevant Phase 2 checks.
- Do not mark Phase 4 complete until backup, restore, and go/no-go evidence are rerun against the intended production-candidate target.
- Do not treat Phase 5 copy or governance work as a reason to defer route-surface reduction or fresh functional verification.

## Dependency hotspots

- Route-surface reduction unlocks nearly every later task because it sets the kept corridor and determines which evidence still matters.
- Export, delete, auditability, and Proof Pack anchor integrity must be freshly green before verification compatibility cleanup, otherwise Phase 2 risks masking unresolved foundation drift.
- Assignment publish performance should be profiled only on the kept corridor, not on the pre-reduction route surface.
- Runbook evidence should be refreshed only after corridor behavior and scope are stable, otherwise the evidence goes stale during the next narrowing pass.
