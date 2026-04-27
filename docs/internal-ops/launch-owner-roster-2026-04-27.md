# Launch Owner Roster

Doc Class: `operations`
Last Verified: `2026-04-27`
Status: `PASS`

This is the named owner roster for the founder-led MVP production launch. The launch is intentionally single-operator until a second human is formally assigned in a later runbook update.

| Role | Named human | Coverage note |
| --- | --- | --- |
| Founder / launch owner | Yurii Bakurov | Final product and launch decision owner. |
| Incident owner | Yurii Bakurov | Owns production incident triage and rollback decision. |
| Technical owner | Yurii Bakurov | Owns live health, launch-status, smoke evidence, and recovery coordination. |
| Product / ops owner | Yurii Bakurov | Owns assignment quality, review workflow, and pilot partner handling. |
| Support / verification owner | Yurii Bakurov | Owns verification queue, privacy disputes, and engagement verification evidence. |

## Escalation Order

1. Freeze new pilot activity.
2. Check `https://proofound.io/api/health`.
3. Check `https://proofound.io/api/monitoring/launch-status`.
4. Review the latest `.artifacts/launch-validation-YYYY-MM-DD/24_gate_summary.json`.
5. If privacy, reveal, upload, or assignment evidence is involved, follow the matching SOP in `docs/internal-ops/index.md`.
6. If recovery is needed, do not write to production until the restore target and recovery step are explicit.

## Known Constraint

This is acceptable for the limited founder-led MVP pilot. A broader public launch requires at least one named backup incident owner and support owner.
