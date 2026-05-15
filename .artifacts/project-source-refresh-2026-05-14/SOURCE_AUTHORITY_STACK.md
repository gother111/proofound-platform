# Source Authority Stack

Generated: 2026-05-14T11:40:35.796Z

## Docs Claiming Source Authority

- `AGENTS.md` and `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md` both state the active MVP authority order.
- `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md` claims active supporting PRD status beneath the locked MVP.
- `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md` claims active technical contract status beneath the locked MVP and aligned PRD.
- `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md` claims active launch runbook status beneath the locked MVP stack.
- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md` claims GTM authority for narrow pilot framing.
- `docs/CURRENT_TRUTH.md` is current repo-grounded status evidence, not product authority.

## Active Authority

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
6. Fresh repo-grounded evidence in this package.

## Advisory Only

- `README.md`, `project/Prompt.md`, `project/Architecture.md`, and audit docs are reference-only per `AGENTS.md`.
- `DESIGN.md` is active for visual/UI work but does not override the locked product authority.
- `docs/ai/**` addenda are advisory/conditional where they stay subordinate to the locked MVP.

## Historical Or Superseded

- `PRD_for_a_web_platform_MVP.master-latest.md` self-identifies as superseded/historical.
- `Proofound_Project_Specification_2026-03-11.md` is preserved reference context only.
- Root historical stubs and `docs/archive/**` are provenance, not current source of truth.
- Older `.artifacts/launch-validation-*`, readiness audits, route inventories, and implementation snapshots are historical unless reproduced in this package.

## Contradictions And Mismatches

- `metrics.md` contains historical text saying the locked MVP was marked superseded; current `AGENTS.md` and the locked MVP file reverse that and must win.
- `docs/CURRENT_TRUTH.md` says repo status was pilot-ready after a previous pass; this package reproduces many green gates but also records an explicit local launch-smoke failure for the full org corridor.
- `launch:validate` reports GO when `BASE_URL` is absent because launch smoke is not applicable, while the explicit local launch smoke command fails one scenario. Use both artifacts together.

## External Sources Likely Needing Replacement

- Any external route inventory should be replaced with `ROUTE_INVENTORY_CURRENT.md` and `route-inventory-current.json`.
- Any external API reference should be refreshed from `CURRENT_TECHNICAL_REFERENCES/API_REFERENCE.regenerated.md` and `docs/API_REFERENCE.md`.
- Any external launch-readiness report should be updated with `CURRENT_TEST_AND_LAUNCH_EVIDENCE.md`, `COMMAND_RESULTS.md`, and `launch-validation-current/`.
- Any external broad-platform PRD/architecture/AI/GCP material should receive a supersession banner or archive treatment unless it is explicitly post-MVP.
