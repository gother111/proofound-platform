# Proofound Landing Page — Current Implementation Reference

Date generated: 2026-03-21  
Workspace: `/Users/yuriibakurov/proofound`

> Historical/superseded freshness banner added 2026-05-14:
>
> - Do not treat this March landing reference as current public-page truth without checking newer code, design guidance, and launch evidence first.
> - The locked MVP definition remains `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`; this reference cannot broaden the MVP into an old broad-product or marketplace story.
> - For narrow pilot-readiness and public-surface evidence, prefer `project/changes/entries/2026-04-09__mvp-launch-audit-execution.md` or newer current evidence. That April 9 execution retired the March build/runtime, route breadth, launch smoke, and strict org corridor blockers unless those blockers are reproduced again in a fresh run.
> - For release-clean status, use `audit/full-scale-audit-2026-04-16.md` or newer release evidence; April 16 found the repo structurally healthy but not release-clean.

## Purpose

This document is the code-grounded reference for the current homepage implementation at `/`. It replaces the older March 17 reference, which described a different landing composition.

## Evidence Basis

This pass used:

- code inspection of `src/app/page.tsx` and `src/components/ProofoundLanding.tsx`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

No dedicated landing Playwright suite was rerun in this hardening pass, so this reference is implementation-accurate but not visual-regression-certified for March 21.

## Route Ownership

- Homepage route: `src/app/page.tsx`
- Main landing composition: `src/components/ProofoundLanding.tsx`

`src/app/page.tsx` currently owns:

- homepage metadata
- homepage JSON-LD
- rendering `<ProofoundLanding />`

## Current Homepage Summary

The current homepage is a proof-first assignment-review landing page, not the broader marketing site described in the older reference. The page is organized around the narrow launch wedge:

1. hero
2. translation band
3. day-one individual surfaces
4. review teams section
5. three-step corridor
6. proof object section
7. privacy-safe review section
8. early proof section
9. final CTA
10. footer

The current section imports in `src/components/ProofoundLanding.tsx` are:

- `HeroSection`
- `TranslationBandSection`
- `DayOneSurfacesSection`
- `HiringTeamsSection`
- `ThreeStepCorridorSection`
- `ProofObjectSection`
- `PrivacySafeReviewSection`
- `EarlyProofSection`
- `FinalCTASection`
- `FooterSection`

## Header And Navigation

The header is a fixed, minimal top bar with:

- logo link to `/`
- anchor link to `#how-it-works`
- anchor link to `#individuals`
- anchor link to `#organizations`
- `Sign in` link to `/login`
- primary CTA:
  - desktop label: `Request a pilot`
  - mobile label: `Pilot`
  - action: organization signup flow

The landing still uses `Lenis` smooth scrolling unless reduced motion is enabled.

## Primary User Flows On The Homepage

- Individual CTA goes to `/signup/individual`
- Organization CTA goes to `/signup/organization`
- Sign in goes to `/login`
- In-page navigation scrolls to:
  - `#individuals`
  - `#organizations`
  - `#how-it-works`

## Metadata Snapshot

Current homepage metadata in `src/app/page.tsx`:

- title: `Proofound | Hire through proof, not profile theater`
- description centers on proof-backed, blind-by-default submission review
- Open Graph and Twitter copy both describe clear assignments, anonymized proof-backed review, and consented reveal

## Current Implementation Notes

- `src/components/ProofoundLanding.tsx` still uses a raw `<img>` for the logo.
- That produces the only lint warning left in this pass:
  - raw `<img>` in `src/components/ProofoundLanding.tsx`
- The homepage is currently much closer to the locked MVP corridor than the older March 17 reference implied.

## Mismatch Versus The Older Reference

The older landing reference is now stale because it described a homepage composed from sections such as:

- `ProblemSection`
- `HowItWorksSection`
- `PrinciplesSection`
- `PersonasSection`
- `WhyNowSection`
- `ProofSection`
- `StewardOwnershipSection`
- `ProductsSection`
- `FinalQuoteSection`

Those are not the active homepage composition in the current workspace.

## Practical Reload Order For Homepage Work

1. `src/app/page.tsx`
2. `src/components/ProofoundLanding.tsx`
3. `src/components/landing/sections/HeroSection.tsx`
4. `src/components/landing/sections/TranslationBandSection.tsx`
5. `src/components/landing/sections/DayOneSurfacesSection.tsx`
6. `src/components/landing/sections/HiringTeamsSection.tsx`
7. `src/components/landing/sections/ThreeStepCorridorSection.tsx`
