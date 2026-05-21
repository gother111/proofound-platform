# Proofound Design Contract

> Doc Class: `working-design`
> Last Verified: `2026-05-21`
> Last Updated: `2026-05-21`
> Purpose: Give humans and agents one repo-native visual source of truth for UI work without overriding the locked MVP product authority.

## 1. How to use this document

This file is a practical design contract for building and editing Proofound UI.

Use it when:

- creating or refining pages, components, flows, and UI copy-adjacent presentation
- deciding between multiple visual directions
- reviewing whether a new interface fits Proofound
- guiding agents so they do not invent a generic SaaS aesthetic
- checking whether an active MVP surface makes its primary object, primary next action, privacy state, trust state, proof state, and readiness state clear

Do not use this file to widen product scope. Product behavior and MVP boundaries still come from:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
6. Fresh repo-grounded audits and evidence

This document translates that scope into visual and interaction guidance.

## 2. Product feeling

Proofound should feel:

- calm
- trustworthy
- editorial
- human
- inspectable
- selective rather than noisy

Proofound should not feel:

- hype-driven
- gamified
- over-automated
- dashboard-heavy
- neon, glossy, or trend-chasing
- like an ATS, social network, or AI content farm

The core emotional target is: "I can see real work clearly, and I can trust what I am seeing."

## 3. Core visual thesis

Proofound is a proof-first, privacy-first assignment review corridor. The design should communicate that before the user reads detailed copy.

That means:

- evidence should look grounded and reviewable
- private or blind-by-default flows should feel safe, not hidden in a shady way
- public portfolio surfaces should feel calm and composed, not self-promotional
- organization surfaces should feel credible and structured, not corporate or bloated
- product UI should privilege clarity, sequence, and trust over density
- every active surface should make the primary object obvious: Proof Pack, assignment, proof-submission review, reveal request, interview, decision, verification, export, or deletion
- every active surface should make the primary next action obvious and safe

Design rule:

- prefer interfaces that reduce uncertainty over interfaces that maximize stimulation

## 4. Brand foundations

### Color direction

Use the existing token system as the source of truth:

- `src/design/brand-tokens.json`
- `tailwind.config.ts`

Primary palette intent:

- forest green for trust, calm direction, and confirmation
- parchment and warm neutrals for breathable surfaces
- terracotta/clay for emphasis, warmth, and proof-oriented accents
- charcoal and muted neutrals for readable structure

Color behavior:

- keep most large surfaces light, warm, and low-noise
- use green as a directional brand color, not as paint everywhere
- use terracotta sparingly to highlight actions, proof, and important emphasis
- prefer soft contrast layers over hard boxed segmentation

Avoid:

- saturated blue enterprise UI unless functionally necessary
- purple AI gradients
- black-heavy luxury themes
- candy-color accents
- rainbow semantic systems that overpower content

### Typography

Typography comes from the existing brand tokens:

- display: `Crimson Pro`
- UI/body: `Inter`

Hierarchy rules:

- use serif display typography for major statements, section headlines, and proof-led emphasis
- use sans-serif for controls, body text, metadata, labels, and tables
- headlines should feel literary and deliberate, not marketing-shouty
- body text should feel quiet and easy to scan

Avoid:

- all-caps overload
- compressed hero copy that reads like startup slogans
- highly technical dashboard typography styles on public-facing pages

### Shape, spacing, and surface

Proofound uses rounded forms, warm spacing, and soft depth.

Prefer:

- generous whitespace
- soft but restrained radii
- layered surfaces
- light borders
- restrained shadows

Cards should feel like quiet containers for evidence and meaning, not generic widgets. Avoid nested
card stacks and generic dashboard mosaics unless the surface is explicitly internal operations.

## 5. Motion principles

Motion source of truth:

- `src/design/motion-tokens.json`

Motion should be:

- calm
- purposeful
- low-friction
- respectful of reading flow

Use motion to:

- guide attention
- reveal hierarchy
- soften transitions
- support comprehension of sequence

Do not use motion to:

- decorate empty interactions
- simulate productivity
- make serious review flows feel playful

Defaults:

- favor short to medium durations
- use fade, rise, and gentle translate shifts
- avoid bounce-heavy, springy, or novelty transitions except in very small moments
- honor `prefers-reduced-motion`

## 6. Composition rules

### General layout

Across surfaces, layout should emphasize rhythm over density.

Prefer:

- clear vertical storytelling
- strong sectional pacing
- readable max-widths
- visible grouping of context, proof, and action
- one dominant idea per region

Avoid:

- cluttered dashboards as the default answer
- too many cards of equal weight
- overuse of multi-column density on first view
- hiding core actions in tertiary menus

### Proof presentation

Proof is the center of the product. Proof should look:

- tangible
- inspectable
- contextualized
- connected to outcomes

When showing proof:

- pair claims with artifacts, outcomes, or attestations
- show enough framing for a reviewer to understand relevance
- use labels and metadata to support interpretation, not to replace substance
- preserve calm visual hierarchy around evidence
- show proof state, anchor/context state, readiness state, and verification state where they affect the next action

Avoid:

- vanity metric walls
- badge overload
- decorative charts where raw evidence would be stronger
- CV-like bullet dumps presented as proof
- score-first, rank-first, or automated-verdict presentation

### Privacy and trust states

Privacy-safe design should feel deliberate and dignified.

Use:

- muted treatments
- clear labels
- visible status language
- orderly reveal patterns
- gated, archived, disabled, empty, loading, error, and success states that explain what is safe to do next

Do not make privacy states feel:

- alarming
- punitive
- mysterious
- like missing data caused by a bug

## 7. Surface-specific guidance

### Landing pages

Landing experiences should feel editorial, memorable, and composed.

Use the existing landing system as the primary style reference:

- `src/components/landing/**`
- especially `src/components/landing/sections/HeroSection.tsx`

Landing pages should:

- tell a proof-first story
- show inspectable artifact-like visuals
- avoid generic SaaS hero patterns
- feel distinct from admin or app surfaces

Good signals:

- ambient warm backgrounds
- artifact-inspired frames
- strong serif-led statements
- measured motion

### Public portfolios

Public portfolio pages are selected output surfaces, not a social profile feed.

They should feel:

- clean
- credible
- selective
- calm

Prioritize:

- proof quality
- role/context clarity
- visible trust signals
- readable structure

Avoid:

- influencer profile styling
- engagement bait
- dense social metadata
- decorative profile chrome
- public directory behavior or browse/search cues that imply broad people discovery

### Organization trust pages

Org pages should communicate legitimacy and review readiness.

They should feel:

- structured
- respectful
- clear
- restrained

Avoid turning them into:

- culture-marketing microsites
- KPI dashboards
- broad employer-brand showcases outside MVP need
- public employer directory pages

### Product app surfaces

Authenticated product UI should remain simple and confidence-building.

Use:

- progressive disclosure
- clear next steps
- strong empty states
- straightforward form flows
- visible privacy stage, trust state, proof state, readiness state, and role/permission limits where relevant

Avoid:

- operational sprawl
- crowded admin patterns leaking into user-facing flows
- feature-nav expansion that suggests a broader suite than the MVP actually ships

## 8. Component behavior guidelines

### Buttons and CTAs

Buttons should feel deliberate and trustworthy.

Prefer:

- one clear primary action per area
- rounded, substantial CTA shapes
- restrained hover feedback
- calm labels

Avoid:

- multiple competing primary buttons
- aggressive urgency language
- excessive icon usage

### Cards

Cards should be used to group meaning, not because every UI needs cards.

Use cards when they help:

- isolate proof
- frame context
- separate steps
- create readable sections

Avoid equal-weight card grids when one item clearly matters more than the others.

### Forms

Forms should feel safe and paced.

Prefer:

- clear labels
- concise helper text
- obvious visibility/privacy states
- stepwise progression for heavier flows

Avoid:

- overly compact form density
- ambiguous required/optional states
- exposing raw technical model language to end users

### Tables and data views

Use tables only where scanning structured lists truly helps.

If the user is making a trust decision, ask whether a grouped review layout would be clearer than a grid.

Avoid BI-style interfaces unless the task is explicitly operational/admin.

## 9. Content presentation rules

Even when the task is primarily visual, Proofound copy presentation should follow these traits:

- precise
- calm
- human
- low-hype
- credibility-oriented

Prefer:

- "proof", "work", "context", "review", "trust", "visibility", "portfolio"

Avoid overusing:

- "AI-powered"
- "talent marketplace"
- "revolutionary"
- "optimize your funnel"
- "community"
- "dashboard"
- "rank"
- "score"

The UI should speak as if it respects the user's work, time, and uncertainty.

## 10. Do and do not

### Do

- reuse tokens before inventing new colors or spacing scales
- reuse existing landing and public-profile patterns before introducing a new visual language
- keep the strongest proof or action visually dominant
- use whitespace to create trust and composure
- make review flows legible at a glance
- keep interfaces feeling narrow, intentional, and MVP-true

### Do not

- import a generic startup dashboard aesthetic
- add visual systems that imply a social network, ATS, or enterprise suite
- use gradients, glows, and animation as a substitute for hierarchy
- overload surfaces with metrics, pills, and badges
- make every page look like the landing page
- let admin visual density leak into public or participant-facing surfaces

## 11. Agent instructions

When editing UI in this repo:

1. Read this file plus the relevant source component files first.
2. Reuse tokens from `src/design/brand-tokens.json` and `src/design/motion-tokens.json`.
3. Check whether the surface is:
   - landing
   - public portfolio
   - organization trust
   - authenticated app
4. Match the existing visual family for that surface.
5. If a proposed UI feels more like a generic dashboard, social app, or ATS than a proof-first corridor, revise it before implementation.
6. Before major UI edits, write a short visual thesis, content plan, and interaction thesis.
7. After meaningful UI edits, verify representative desktop and mobile behavior with Browser or Playwright, and record route, viewport, role/mode, and finding.

If in doubt, optimize for:

- clarity over novelty
- trust over intensity
- evidence over ornament
- sequence over density
- calm over hype

## 12. Reference files

Use these files as implementation anchors:

- `README.md`
- `project/Prompt.md`
- `project/Architecture.md`
- `src/design/brand-tokens.json`
- `src/design/motion-tokens.json`
- `tailwind.config.ts`
- `src/components/landing/**`
- `src/components/public-profile/**`
- `src/components/brand/Logo.tsx`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`

This file should evolve when the real UI system evolves. It should not become a disconnected style manifesto.
