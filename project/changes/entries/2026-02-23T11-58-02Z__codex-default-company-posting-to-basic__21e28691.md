# Project Change Entry

- Date/time (UTC): 2026-02-23T11:58:02Z
- Branch: codex-default-company-posting-to-basic
- Base commit: 21e28691
  What changed:
- Updated `PRD_for_a_web_platform_MVP.md` to make assignment mode entry behavior explicit:
  - Basic is the default entry path.
  - Advanced is explicit opt-in (not shown by default).
  - Advanced-recommended templates do not auto-switch mode unless Advanced is already enabled.
- Synced this rule in all duplicated O7/O12 and A7 acceptance sections to avoid doc drift.

Why:

- Keep PRD behavior consistent with the implemented assignment builder UX in PR #224.

How to verify:

- Search the PRD for O7/O12/A7 sections and confirm explicit opt-in wording:
  - `O7 — Assignment Creation (Basic + Advanced)`
  - `O12 — Assignment Templates`
  - `A7 Activation Thresholds`
- `npm run docs:freshness`

Open risks / TODO:

- `docs:freshness` reports existing non-blocking repository warnings unrelated to this PRD update.
