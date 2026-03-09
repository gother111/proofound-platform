> Doc Class: `reference-spec`
> Last Verified: `2026-03-09`

# Proofound MVP PRD Compatibility Mirror

This file is a compatibility mirror for consumers that still open `PRD_for_a_web_platform_MVP.md`.

**Canonical source of truth:** `PRD_for_a_web_platform_MVP.master-latest.md`  
**Mirror policy:** This file must never introduce terms, states, events, or scope that differ from the canonical PRD.

## Canonical MVP Contract

- Proof Pack is the canonical evidence object.
- Artifact is an atomic evidence item inside a Proof Pack.
- Proof is the claim and trust judgment attached to real work.
- Proof Card is a submission-safe render of a selected Proof Pack.
- Matching is blind-by-default and uses progressive reveal.
- Public portfolios are in scope.
- Portfolio indexing is controlled and off by default.
- Public directory behavior is out of scope.
- Profile readiness tiers are:
  - `Discoverable`
  - `Match-visible`
  - `Intro-eligible`
  - `Strongly trusted`
- User trust tier is:
  - `unverified`
  - `workplace_verified`
  - `identity_verified`
- Proof Pack verification status is:
  - `unverified`
  - `partially_verified`
  - `verified`
  - `disputed`
- Workflow objects are:
  - `match`
  - `intro`
  - `interview`
  - `feedback follow-up`
- Zen Hub is optional, private, and excluded from ranking, reveal, org review, fairness workflows, and public rendering.

## Mirror Usage Rules

- Use `PRD_for_a_web_platform_MVP.master-latest.md` for implementation details, analytics taxonomy, lifecycle states, acceptance criteria, and QA handoff.
- Use this mirror only when an older file path is hard-coded into a workflow that still expects `PRD_for_a_web_platform_MVP.md`.
- If this file and the canonical PRD ever differ, the canonical PRD wins immediately.
