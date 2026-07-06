# Connected Provider Setup Reference

> Doc Class: `reference-spec`
> Last Verified: `2026-05-21`

This document is a retained provider setup reference. It is not a launch gate.

Locked MVP posture:

- Manual-link interview scheduling is the default launch path.
- Connected calendar or meeting providers are target-scoped enhancements only when an intended launch target explicitly enables them.
- Zoom-native meeting creation is not required for MVP launch and should stay archived or disabled unless a later post-MVP target restores it.
- Do not add provider secrets to docs, tickets, screenshots, or shared logs.

Use the authority stack in `AGENTS.md`, `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, and `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md` before treating any provider integration as current launch scope.

## Launch Decision

For the current MVP, operators should verify that interview scheduling works with:

- assignment context visible to the organization reviewer
- proof-review participant consent preserved before reveal
- a clear interview time or manual meeting link
- decision and engagement-verification follow-up intact

Do not block launch on native Zoom setup, Zoom app review, Zoom OAuth credentials, or a Zoom-specific E2E path.

Google Calendar or Google Meet setup may be used only when the intended target intentionally enables it. In that case, validate the connected-provider path as an extra target-specific check, not as a replacement for the manual-link corridor.

## Optional Google Calendar / Meet Reference

Only use this section when a launch target explicitly needs Google Calendar or Google Meet.

1. Create or select the Google Cloud project for Proofound.
2. Enable the Google Calendar API.
3. Configure the OAuth consent screen for the intended environment.
4. Create a web OAuth client.
5. Add the callback URL for the exact target domain:
   - production: `https://<target-domain>/api/integrations/google/callback`
   - local: `http://localhost:3000/api/integrations/google/callback`
6. Store credentials only in the target environment manager.
7. Test the flow from the active integrations surface if that surface is intentionally enabled for the target.
8. Record evidence in the launch artifact with target URL, date, account role, pass/fail result, and any provider-side verification caveats.

Relative callback paths may be used by the app where supported, but the provider console should still include the exact domain callback for the environment being tested.

## Archived Zoom Reference

The former Zoom-native OAuth and meeting-creation path is retained in archive code only. For current MVP launch:

- do not configure Zoom credentials as required production variables
- do not require a Zoom marketplace review
- do not require a Zoom-specific interview scheduling smoke test
- do not expose a Zoom-first CTA on active MVP surfaces

If Zoom is restored in a later post-MVP target, first re-open scope through the locked authority stack, then restore active route policy, provider checks, UI affordances, tests, and docs together.

## Evidence To Capture When A Provider Is Enabled

When a connected provider is intentionally enabled, save the evidence in the current launch artifact:

- target environment and URL
- provider and account used, without secrets
- OAuth consent status or provider review caveat
- route tested
- expected and actual callback result
- scheduling result, including whether a manual fallback remains available
- privacy review: no private proof content, proof-review participant contact details, or hidden proof-review participant identity leaked before consent

## Current Launch Checks

For launch readiness, use these instead of provider-specific setup checklists:

- `docs/production-readiness-checklist.md`
- `docs/release-checklist.md`
- `docs/backlog/phase-exit-checklist.md`
- `docs/testing-strategy.md`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`

The final production-candidate decision still needs current target evidence for backup checkpoint, restore rehearsal, authenticated launch monitoring, assignment performance, and go/no-go checks.
