> Doc Class: `active`
> Last Verified: `2026-03-25`

# Proofound Backlog Dependency Map

## Current execution status

- `Phase 0`: active
- `Phase 1`: planned, blocked by Phase 0
- `Phase 2`: planned, blocked by Phase 1
- `Phase 3`: planned, blocked by Phase 2
- `Phase 4`: planned, blocked by Phase 3
- `Phase 5`: planned, blocked by Phase 4

## Phase-level dependency graph

```mermaid
flowchart LR
  P0["Phase 0<br/>Scope lock and route-surface reduction"] --> P1["Phase 1<br/>Foundation and individual corridor integrity"]
  P1 --> P2["Phase 2<br/>Trust and review canonicalization"]
  P2 --> P3["Phase 3<br/>Hiring corridor and assignment runtime hardening"]
  P3 --> P4["Phase 4<br/>Pilot hardening and launch ops"]
  P4 --> P5["Phase 5<br/>Launch packaging and governance cleanup"]
```

## Critical path

1. `P0-1` -> `P0-2` -> `P0-3`
2. `P1-1`, `P1-2`, and `P1-3` may run in parallel after Phase 0 passes; `P1-4` waits for them
3. `P2-1` -> `P2-2` -> `P2-3`
4. `P3-1` -> `P3-2` -> `P3-3`
5. `P4-1` -> `P4-2` and `P4-3`
6. `P5-1` -> `P5-2` -> `P5-3`

## Gate rules

- Do not schedule Phase 2-5 implementation while `P0-3` is still open.
- Do not start Phase 2 until the Phase 1 checklist rows are freshly green.
- Do not refresh launch ops in Phase 4 until the narrowed corridor and assignment runtime are stable in Phase 3.
- Do not treat Phase 5 copy or governance work as a reason to defer route-surface reduction or fresh functional verification.

## Dependency hotspots

- Route-surface reduction unlocks nearly every later task because it sets the kept corridor and determines which evidence still matters.
- Export, delete, auditability, and Proof Pack anchor integrity must be freshly green before verification compatibility cleanup, otherwise Phase 2 risks masking unresolved foundation drift.
- Assignment publish performance should be profiled only on the kept corridor, not on the pre-reduction route surface.
- Runbook evidence should be refreshed only after corridor behavior and scope are stable, otherwise the evidence goes stale during the next narrowing pass.
