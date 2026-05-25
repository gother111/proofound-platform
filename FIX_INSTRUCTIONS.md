# Superseded Fix Instructions

> Doc Class: `historical`
> Last Verified: `2026-05-19`

This file used to describe a fix for an empty Expertise Atlas tab in demo data.
That surface is no longer part of the locked MVP launch corridor.

Current status:

- `/app/i/expertise` is archived outside launch scope.
- Broad Expertise Atlas widgets, gap dashboards, and the legacy CV wizard are not
  active launch evidence.
- Demo-data repair instructions for the old Expertise tab must not be used to
  validate the current Proofound MVP.

For current launch-safe setup and verification, use:

- `QUICK_START.md`
- `README.md`
- `agent/runbooks/setup.md`
- `agent/checklists/verification.md`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`

For current proof/skill behavior, verify Proof Packs, proof artifacts,
verification requests, public portfolio publishing, and route-surface policy
instead of the retired Expertise tab.

If the historical Expertise repair is needed for archaeology, use the archived
implementation and historical change logs under `src/archive/**`,
`project/changes/entries/**`, and `agent/scratchpad/entries/**`; do not treat it
as active product guidance.
