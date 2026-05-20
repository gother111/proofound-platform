# Proofound Ubiquitous Language

> Doc Class: `active`
> Last Verified: `2026-05-19`

Scope: shared vocabulary for implementation and maintenance. This document is guidance only. It does not imply a broad rename and does not override the locked MVP authority stack in `AGENTS.md`.

## Core People And Surfaces

- Individual: a person using Proofound to build, verify, control, and share their proof-first profile.
- Organization: a review-side account that creates assignments, reviews proof-first matches, and manages team access.
- Profile: private individual workspace data. Profile helpers should not be assumed to be public-safe.
- Portfolio: a public or shareable projection of selected profile and proof data. Portfolio helpers should preserve visibility, publication, and noindex rules.
- Public projection: the intentionally exposed shape of profile, organization, proof, and trust data for public or shareable routes.
- Primary object: the object a surface is about, such as a Proof Pack, assignment, proof review, reveal request, interview, decision, verification, export, or deletion.
- Primary next action: the safest next user action on a surface. It should be visible without implying a broader platform or public directory.

## Proof And Evidence

- Proof Pack: the aggregate that groups proof items, artifacts, anchor context, verification references, and export or projection metadata.
- Proof item: a child item inside a Proof Pack that represents a specific claim, example, or evidence unit.
- Artifact: stored evidence material such as a document, upload, submission artifact, or generated proof asset.
- Evidence: the product-language umbrella for material that supports a claim. In code, prefer the more precise term when the stored shape is known.
- Submission: an assignment or verification-related response that may include artifacts and proof material.
- Anchor: the structural subject a Proof Pack is tied to, such as an experience, education entry, volunteering entry, individual profile, or organization.
- Quarantine: a safety state that excludes proof or upload material from export or publication until it satisfies required safety or anchor rules.

## Verification

- Verification: the umbrella for trust-building checks, status policy, request flows, and proof validation.
- Attestation: human-observed or third-party-confirmed evidence. Use this term only when the source is an attesting person or organization.
- Verification bundle: a Proof Pack kind anchored to concrete context such as experience, education, or volunteering.
- Verification record: a persisted record of a verification event, request, status, or outcome.
- Verification gate: a rule that determines whether evidence is complete enough for a next step.
- Trust state: the visible status of a proof, verification, organization, or review claim. Trust state must not overstate certainty.

## Matching And Review

- Assignment: the organization-defined work or role context for matching and review. Prefer this over job or opportunity in new code unless the existing surface requires older wording.
- Match: a generated relationship between an individual and an assignment or organization review context.
- Reason code: a plain-language explanation for why a match or review item appears. Reason codes must stay explainable and must not become automated hiring recommendations.
- Review: the organization-side action state for evaluating a match.
- Shortlist: a curated organization-side collection of matches for closer review.
- Decision: a post-review outcome or state change, such as proceeding, declining, or completing an interview outcome.
- Engagement verification: a post-decision proof checkpoint. Keep it distinct from interview scheduling.
- Manual-link interview: the locked MVP interview scheduling default. Connected calendar/provider behavior is target-scoped and must not be presented as required by default.

## Privacy, Reveal, And Export

- Visibility: the policy that decides who may see a field, proof item, artifact, portfolio element, or review detail.
- Public-safe: data that is allowed to leave private/authenticated contexts and appear in public or shareable surfaces.
- Review-safe: data that may be shown to an organization during the review flow before full identity reveal.
- Privacy stage: the current reveal/visibility boundary for a workflow, especially before and after candidate consent.
- Reveal: the consent workflow through which identity or additional private context becomes visible.
- Unlock: the internal state mutation that grants a wider identity or field scope after reveal rules are satisfied.
- Export: the user-controlled data download surface. Export helpers must preserve quarantine, deletion, visibility, and anchor safety rules.
- Delete: account or data lifecycle removal. Delete flows should stay separate from export projection logic unless a tested lifecycle helper owns the overlap.

## Naming Guidance

- Use `profile` for private workspace data and `portfolio` for public or shareable projection data.
- Use `reveal` for the consent workflow and `unlock` for the internal state change that follows approval.
- Use `assignment` in new code for the organization-defined work context.
- Use `Proof Pack` for the aggregate, `proof item` for the aggregate child, and `artifact` for stored evidence material.
- Use `verification` as the broad trust umbrella and `attestation` only for human or third-party confirmation.
- Use `reason code` for explainable match/review rationale; avoid `score`, `rank`, `fit verdict`, or `recommendation` language unless an existing low-level algorithmic test requires that exact term.
- Use `manual-link interview` for the default MVP interview posture.
- Prefer adding small named helpers around existing behavior before renaming large surfaces.

## Refactor Guardrails

- Do not rename terms broadly just because this glossary exists.
- Do not move privacy, reveal, matching, public portfolio, or export behavior without focused tests first.
- Do not use this glossary to introduce public directory, profile theater, vanity metric, broad marketplace, or broad platform language.
- Prefer semantic tests over file-layout tests.
- If old docs, code, and this glossary disagree, treat code and the locked MVP authority stack as the source of truth and call out the mismatch before changing behavior.
