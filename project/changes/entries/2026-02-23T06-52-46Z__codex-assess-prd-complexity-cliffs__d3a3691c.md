# Project Change Entry

- Date/time (UTC): 2026-02-23T06:52:46Z
- Branch: codex-assess-prd-complexity-cliffs
- Base commit: d3a3691c
  What changed:
- Updated `PRD_for_a_web_platform_MVP.md` to align Draft v0.1 acceptance and feature sections with implemented MVP behavior:
  - Tiered individual activation (Lite and Strong).
  - Assignment builder modes (Basic default, Advanced strict path retained).
  - Privacy visibility normalization to public/network-only/match-only/private.
  - Added explicit "What others can see" summary requirement.
  - Added overlap-only compensation default in matching.
  - Added always-on sample match previews (real near-matches, mock fallback).
  - Added attestation CTA placement and SLA preset support.
  - Updated MVP acceptance checklist and smoke playbook to match the new rules.

Why:

- Keep the PRD consistent with shipped product behavior and avoid drift between implementation, QA, and stakeholder expectations.

How to verify:

- Review the updated sections in `PRD_for_a_web_platform_MVP.md`:
  - Feature definitions (F3, F4, F6, F7, O7, O12)
  - Operational specs (F3 processing rules, F6 outputs, O7 I/O/events)
  - Part 12 functional acceptance and smoke test playbook
  - Addendum A3, A5, A7, A8, A9
- Run `npm run docs:freshness` (warning-only mode currently).

Open risks / TODO:

- Existing PRD text outside updated sections still contains some historical references (for example earlier narrative mentions of 5-step-only language).
- `docs:freshness` reports non-blocking repository warnings unrelated to this PRD update.
