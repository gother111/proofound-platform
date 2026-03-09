> Doc Class: `reference-spec`
> Last Verified: `2026-03-09`

# Proofound MVP Executive Summary

**Canonical source of truth:** `PRD_for_a_web_platform_MVP.master-latest.md`  
**Purpose of this file:** Executive summary only. It does not define product behavior independently.

## Product Promise

Proofound MVP is a proof-first credibility and connection platform for individuals and lean organizations. The MVP guarantees a day-1 shareable public portfolio, then moves both sides through privacy-safe, blind-by-default matching toward qualified intros.

## Canonical Vocabulary

- **Proof Pack** is the canonical evidence object.
- **Artifact** is a child evidence item attached to a Proof Pack.
- **Proof** is the trust judgment about real work.
- **Proof Card** is a submission-safe presentation of one selected Proof Pack.
- **Public portfolio** is in scope.
- **Portfolio indexing** is controlled and off by default.
- **Public directory** behavior is out of scope.

## Canonical State Models

### Profile readiness tiers

- `Discoverable`
- `Match-visible`
- `Intro-eligible`
- `Strongly trusted`

### User trust tier

- `unverified`
- `workplace_verified`
- `identity_verified`

### Proof Pack verification status

- `unverified`
- `partially_verified`
- `verified`
- `disputed`

### Matching privacy model

- `blind-by-default`
- `progressive reveal`
- reveal stages:
  - `stage0_anonymous`
  - `stage1_capability_and_proof`
  - `stage2_contextual_reveal`
  - `stage3_intro_approved`
  - `stage4_interview_coordination`

## Included MVP Surfaces

### Individuals

- portfolio-first onboarding
- public portfolio link
- proof-first profile with Proof Packs
- consent-based matching that becomes org-visible at `Match-visible`
- qualified intros starting at `Intro-eligible`
- interviews and 48-hour feedback follow-up
- optional private Zen Hub
- export and delete controls

### Organizations

- portfolio-first onboarding
- public trust profile
- one lean assignment publishing path
- Assignments and Matches queue
- privacy-safe review with staged reveal
- optional reviewer access
- BYOC candidate invites using Proof Cards derived from Proof Packs

## Canonical KPIs

- **TTSC**
- **TTFQI**
- **TTV**
- **PAC**
- **SUS**
- **Fairness note status**

These are the only launch KPIs promised in the PRD.

## Canonical Event Groups

- account and onboarding
- public portfolio distribution
- Proof Pack lifecycle and trust evidence
- matching and reveal
- intro lifecycle
- interview and feedback follow-up
- organization workflow
- Zen Hub private partition

For exact event names and privacy rules, use `PRD_for_a_web_platform_MVP.master-latest.md`.

## MVP Exclusions

- public candidate directory
- deep org analytics or BI-style analytics surfaces
- ATS or HRIS integrations
- payments and contracting
- government ID self-serve verification
- gamified counters, streaks, or badge-led product mechanics
- Zen Hub expansion beyond optional private check-ins and reflections
