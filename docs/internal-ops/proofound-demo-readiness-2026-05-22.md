> Doc Class: `internal-ops`
> Last Verified: `2026-05-22`

# Proofound Demo Readiness Run

## Scope

This note covers the nine Linear demo-readiness issues:

- PRO-212, PRO-213, PRO-214: structured assignment creation.
- PRO-215, PRO-216, PRO-217: candidate application and Proof Pack submission.
- PRO-218, PRO-219, PRO-220: matching and explainable shortlist review.

The demo remains inside the locked MVP corridor: one organization, one assignment, one candidate Proof Pack, and blind-by-default proof review.

## Audit Summary

### Structured Assignment Creation

- Route tested locally: `/app/o/greenpath-ngo/assignments/new`.
- Working path: the builder supports scratch entry, job-description import, role purpose, outcomes, proof expectations, must-have skills, practical constraints, internal review routing, autosave, and assignment clarity assistance.
- Demo blockers found: none in the core happy path.
- Confusing UX tightened: the first screen now states the start, middle, and finish of the demo path, and the builder states what the demo proves before form entry.
- Minimum viable path: create from scratch or import text, complete four edit steps, then save to internal review before publishing.

### Candidate Proof Pack Submission

- Route tested locally: `/candidate-invite/[token]` plus `/onboarding?next=/candidate-invite/[token]`.
- Working path: the invite page shows assignment context before application, keeps the submission owner-only, requires final visibility confirmation, and separates application proof from public portfolio publishing.
- Demo blockers found: none in the core happy path when a candidate has or creates one Proof Pack.
- Confusing UX tightened: the application section now shows a three-step Proof Pack path and a minimum packet checklist.
- Minimum viable Proof Pack object: one claim or outcome, one evidence artifact or link, one trust or verification signal, and one privacy confirmation.

### Matching And Shortlist

- Routes tested locally: `/app/o/greenpath-ngo/assignments?matching=[assignmentId]` and `/app/o/greenpath-ngo/profile`.
- Working path: organization matching stays assignment-specific, cards use blind review labels, reason-coded fit summaries, strongest proof, trust labels, and shortlist/pass actions.
- Demo blockers found: none for sample or mocked data as long as the selected assignment has match rows.
- Confusing UX tightened: org match cards now fall back to at least three explainability signals when detailed review-card bullets are sparse, and the shortlist page states the three signals it expects.
- Minimum viable shortlist object: assignment, blind candidate label, strongest proof, fit band or score category, reason-coded bullets, trust/privacy labels, and a review action.

## Three-Minute Scripts

### 1. Assignment Creation

**Value moment:** The company turns a vague role into measurable outcomes and proof-based requirements.

1. Start at `/app/o/greenpath-ngo/assignments/new`.
2. Say: "We are not writing another generic job post. We are making the assignment reviewable."
3. Add a title such as `Partner Launch Operations Lead`.
4. Add the role purpose: "Make partner onboarding reliable before pilot expansion."
5. Add two outcomes: "Launch first three partners with clean readiness evidence" and "Reduce manual launch follow-up by half."
6. Add proof expectations: "Comparable rollout ownership, stakeholder coordination, and measured launch outcomes."
7. Add must-have skills, practical constraints, and compensation range.
8. Save to internal review and show that the assignment now has a review destination before publish.

Fallback if save fails: show the completed fields and say the demo proves how Proofound structures the assignment before matching begins.

### 2. Candidate Proof Pack

**Value moment:** The candidate is not submitting another CV. They are submitting relevant proof for this assignment.

1. Start from a candidate invite route or sign in as a demo individual and open the invited assignment.
2. Show the assignment context before the Apply action.
3. Say: "The candidate sees the work, expected proof, practical constraints, and privacy posture first."
4. Create or choose one owner-only Proof Pack.
5. Explain the packet: one claim or outcome, one artifact or link, one trust signal, and one privacy confirmation.
6. Open final review, confirm visibility, and submit the reviewed application.
7. Show that the application remains assignment-specific and does not publish a public page.

Fallback if the candidate has no Proof Pack: use the Create first Proof Pack link and explain the minimum packet checklist.

### 3. Explainable Shortlist

**Value moment:** Proofound explains why candidates are worth review using structured requirements and proof objects.

1. Start at `/app/o/greenpath-ngo/assignments?matching=[assignmentId]` or the assignment-specific matching panel.
2. Select the sample assignment created in the first demo.
3. Show the candidate cards and say: "This is not a black-box recommendation. The reviewer sees proof, fit rationale, and privacy state."
4. Open the strongest proof section, reason-coded fit summary, trust labels, and blind-review badges.
5. Shortlist one candidate or open the shortlist page.
6. End with: "The next pilot step is to test this on one real assignment with 5 to 8 proof-ready candidates."

Fallback if no matches exist: show the empty state and explain the required setup: publish one assignment, invite or seed candidates, then run assignment-specific matching.

## Verification Checklist

- Complete assignment flow on desktop and one narrow viewport.
- Complete candidate invite or candidate profile path with a demo individual account.
- Complete org matching and shortlist review with a demo organization account.
- Confirm the created assignment is visible after submission.
- Confirm Proof Pack submission persists after refresh.
- Confirm shortlist cards have at least three explanation signals.
