> Doc Class: `active`
> Last Verified: `2026-03-25`

# Block 9: Launch-Safe Operations, Fallback, Flags, and Structured Feedback

> Canonical scope note: `Proofound_Project_Specification_2026-03-11.md` defines launch product scope first. `PRD_TECHNICAL_REQUIREMENTS.md` and `PRD_for_a_web_platform_MVP.master-latest.md` provide supporting technical and product detail. This operations note is background material only and must not widen launch scope.

> Superseded note: for current pilot manual procedures, use [internal-ops/index.md](./internal-ops/index.md). This document remains background operating guidance only.

## A. Operational fallback model

- Main launch-risk scenarios:
  - `low candidate supply`: active assignments exist, but not enough candidates clear readiness, proof, trust, or logistics gates.
  - `low assignment supply`: candidate portfolios are ready, but active assignment demand is too thin to sustain qualified intros.
  - `weak proof coverage`: portfolio exists, but proof coverage is too thin or too concentrated to support qualified intros.
  - `incomplete verification`: trust signals are pending, expired, disputed, contradicted, or absent.
  - `fairness suppression mode`: exact ranking would overstate precision or violate fairness thresholds.
  - `intro corridor failure`: the system cannot produce enough qualified intros inside the intro target window.
- System-driven fallback:
  - `portfolio_ready` remains independently useful even when browse or intro readiness is not met.
  - Matching degrades from exact shortlist or intro output to browse-safe discovery, rank bands, and portfolio or proof guidance.
  - Private browse can stay live before org-visible matching or intro eligibility; the system must not collapse those thresholds together.
  - Verification never upgrades trust labels optimistically. Pending or stale verification keeps stronger trust actions paused.
  - Fairness suppression replaces exact ordering with shortlist-safe banding and may pause new intros for the assignment.
  - Intro corridor failure enters an explicit hold state instead of emitting weak or empty intros as if they were qualified.
- Operator-assisted fallback:
  - Operators can review verification disputes, fairness remediation, intro-hold assignments, and thin-market assignments.
  - Allowed operator actions are limited to:
    - approve hold
    - extend wait window
    - request more proof
    - reopen browse-only state
    - mark assignment as supply-thin and close it with structured feedback
- Canonical fallback modes:
  - `browse_only_low_candidate_supply`
  - `browse_only_low_assignment_supply`
  - `proof_building_weak_coverage`
  - `trust_pending_verification`
  - `fairness_suppressed_ranking`
  - `intro_hold_insufficient_qualified_intros`
- Scenario contract:
  - `low candidate supply`
    - System: keep assignment review browse-safe, suppress intros, log fallback, emit `fallback_entered`.
    - Operator: triage assignment scope, recommend scope edits, optionally extend intro wait window.
  - `low assignment supply`
    - System: keep candidate portfolio public or shareable, keep browse open, show assignment-thin state.
    - Operator: seed review of active assignments, close stale assignments, avoid pretending demand exists.
  - `weak proof coverage`
    - System: keep portfolio shareable, downgrade intro readiness, show proof-building next actions.
    - Operator: request stronger artifacts only when the user is otherwise close to intro readiness.
  - `incomplete verification`
    - System: keep trust labels conservative, block stronger intro actions, retain pending state visibly.
    - Operator: review verification queue, resolve disputes, re-request expiring trust evidence.
  - `fairness suppression mode`
    - System: hide exact rank, show rank-band or unordered shortlist, preserve review history.
    - Operator: review fairness queue, acknowledge, re-run, or keep suppression active.
  - `intro corridor failure`
    - System: create explicit intro hold, persist hold reason and target counts, keep browse-safe review live.
    - Operator: decide whether to wait, broaden assignment, or close with structured feedback.

## B. User-facing fallback experience

- Individuals see:
  - current state
  - why stronger actions are paused
  - exactly three next actions:
    - improve portfolio or proof
    - complete trust signals or constraints
    - keep browsing or share portfolio
- Org users see:
  - whether the blocker is supply, proof, trust, or fairness
  - whether shortlist review is still live
  - exactly three next actions:
    - broaden assignment
    - request more evidence
    - keep reviewing blind profiles
- Copy and CTA rules:
  - replace empty shortlist or empty intro states with calm fallback panels
  - never say candidates or assignments are “available now” unless they actually satisfy the live corridor
  - never hide a paused intro corridor behind a generic loading state
- Canonical replacement copy:
  - “Your portfolio is still live and shareable.”
  - “Private browse stays open while org-visible matching and introductions are protected.”
  - “Verification is still in progress, so stronger trust actions stay paused.”
  - “Exact ranking is temporarily hidden to protect shortlist quality.”
  - “There are not enough qualified introductions yet for this assignment.”
- Product behavior:
  - public portfolio, browse-safe review, exports, and deletion remain available in fallback
  - next best action points to portfolio, proof, trust, or assignment edits, not false urgency

## C. Operator runbook

- Incident classes:
  - `P1`: auth, signup, token redemption broken
  - `P1`: portfolio render, public sharing, export, delete, or unpublish unsafe
  - `P2`: shortlist generation degraded
  - `P2`: intro generation degraded or intro hold queue stuck
  - `P2`: verification queue backlog or dispute resolution stuck
  - `P2`: fairness suppression active with no remediation path
  - `P3`: thin-market fallback volume high while core platform remains safe
- Owners and response windows:
  - engineering on-call
    - P1 acknowledge in 15 minutes
    - P2 acknowledge in 4 hours
  - product or ops owner
    - thin-market triage, feedback quality, and stale holds in 1 business day
  - trust or verification owner
    - verification manual queue and disputes in 1 business day
- Daily launch checks:
  - auth and signup
  - portfolio publish and public portfolio render
  - assignment publish
  - shortlist generation
  - verification request and response path
  - intro creation
  - feedback submission
  - export, delete, and unpublish
  - queue depth for verification, intro hold, fairness remediation, feedback pending
  - fallback state counts and time-in-state
- Manual review queues:
  - `verification_pending_manual`
  - `intro_hold`
  - `fairness_remediation`
  - `thin_assignment_supply`
  - `thin_candidate_supply`
- Manual fallback actions:
  - mark assignment as browse-only
  - pause intros for assignment
  - request proof or verification refresh
  - recommend assignment edits
  - close stale intro corridor with structured feedback
- Safe mode:
  - kill new intros
  - keep portfolio, browse, export, delete, and unpublish live
  - force rank-band mode
  - disable pilot-only features without affecting portfolio or privacy

## D. Synthetic monitors and smoke-test set

- Critical path monitors:
  - signup or auth
  - portfolio creation
  - public portfolio render
  - assignment creation
  - shortlist generation
  - invite email and token redemption
  - verification request and response
  - intro creation
  - feedback submission
  - export
  - delete or unpublish
- Success criteria for each monitor:
  - endpoint returns expected status
  - minimum payload shape matches contract
  - expected state transition is persisted
  - fallback copy or fallback state appears when preconditions are not met
  - no silent partial success
- Alert policy:
  - `P1`: signup, auth, token redemption, public portfolio, export, delete
  - `P2`: shortlist, intro, verification, feedback, fallback-state spike
  - `P3`: individual monitor drift without user-visible breakage
- Acceptable degradation:
  - shortlist may return browse-safe output or fairness-safe rank bands
  - intro creation may enter explicit hold
  - verification may remain pending
  - portfolio, share, export, and delete must still terminate cleanly and visibly
- Synthetic monitor persistence:
  - every check stores `monitor_key`, `status`, `severity`, response timing, expected state, observed state, and failure class

## E. Feature-flag and cutline matrix

- Canonical feature-state taxonomy:
  - `default_on`
  - `hidden_behind_flag`
  - `pilot_only`
  - `admin_operator_only`
  - `post_mvp`
  - `emergency_kill_switch`
- Canonical control classes:
  - `temporary_rollout_control`
  - `durable_scope_control`
- Matrix:
  - portfolio creation, public portfolio, privacy controls, browse readiness, basic assignment publish, structured feedback
    - state: `default_on`
    - control: `durable_scope_control`
  - advanced assignment builder, advanced ranking explanation, non-core dashboard experiments
    - state: `hidden_behind_flag`
    - control: `durable_scope_control`
  - live intro automation beyond the narrow corridor, richer org analytics, fairness deep-dive UI, expanded verification methods
    - state: `pilot_only`
    - control: `temporary_rollout_control`
  - fairness remediation tools, verification overrides, rollout dashboards, queue tooling
    - state: `admin_operator_only`
    - control: `durable_scope_control`
  - ATS, HRIS, marketplace scaling automation, dense-market ranking, richer coaching
    - state: `post_mvp`
    - control: `durable_scope_control`
  - qualified intro corridor, exact rank exposure, automated invites, provider-specific verification paths
    - state: `emergency_kill_switch`
    - control: `temporary_rollout_control`
- Rollout order:
  - portfolio and privacy core
  - browse readiness
  - assignment basic mode
  - shortlist with fairness-safe rank bands
  - verification corridor
  - qualified intro corridor
  - structured feedback enforcement
- Rules:
  - every non-default flag has an owner, reason, control type, and revisit date
  - flags cannot be used to defer core product decisions already marked `durable_scope_control`

## F. Launch scope recommendation

- Must ship:
  - public and private portfolio value
  - proof-building guidance
  - browse-safe matching
  - basic assignment publish
  - fairness-safe shortlist review
  - narrow qualified intro corridor with explicit hold states
  - structured feedback with required reason code, personalized note, and next step
  - operator runbook and synthetic monitoring
- May ship if stable:
  - limited verification-provider automation
  - basic rollout metrics dashboard
  - manual fairness note generation already present in the repo
- Must stay off by default:
  - advanced builder mode
  - exact rank exposure
  - dense-market-style automated intro expansion
  - non-core Zen or wellbeing surfaces outside the narrow corridor
- Explicitly post-MVP:
  - ATS, HRIS, CRM integrations
  - automated marketplace scaling operations
  - richer fairness segmentation and public fairness storytelling
  - complex coaching or feedback authoring systems

## G. Structured feedback rubric

- Canonical feedback contract on every closed decision or outcome:
  - one required reason code
  - one required personalized note
  - one required suggested next step
- Required fields:
  - `decision_state`
  - `audience_variant`
  - `reason_code`
  - `personalized_note`
  - `suggested_next_step`
  - `author_role`
  - `timestamp`
  - `rubric_version`
- Optional fields:
  - `rubric_subscores`
  - `reusable_template_id`
  - `operator_override_reason`
  - `internal_note`
- Variants:
  - candidate-facing reason codes:
    - `proof_strength_incomplete`
    - `verification_pending`
    - `constraints_incomplete`
    - `assignment_supply_thin`
    - `shortlist_quality_protected`
    - `focus_alignment_partial`
    - `availability_constraints_mismatch`
  - org-facing reason codes:
    - `candidate_constraints_not_met`
    - `candidate_verification_incomplete`
    - `candidate_proof_coverage_insufficient`
    - `assignment_scope_too_narrow`
    - `candidate_supply_thin`
    - `shortlist_quality_protected`
    - `fairness_protected_band_only`
- Rules:
  - no empty prose
  - no “not a fit”
  - no comparative ranking disclosure
  - no legalistic essay burden
  - one note must be human-readable and specific to the actual corridor or constraint state
- Analytics and audit link:
  - structured feedback is persisted with decision state and author role
  - submission emits `structured_feedback_submitted`
  - overrides emit `operator_override_logged`

## H. Schema / API / analytics / ops impact

- Persisted schema additions:
  - assignment and review fallback mode fields and timestamps
  - intro hold counts and reason
  - feature flag metadata for taxonomy, owner, reason, revisit date, control type
  - structured feedback fields on `feedback_responses`
  - `operator_action_logs`
  - `synthetic_monitor_runs`
- Derived data:
  - thin-market classification
  - queue depth summaries
  - rollout readiness summaries
  - time in fallback state
- API updates:
  - feedback submit accepts or requires structured feedback envelope
  - feedback token lookup returns the structured feedback contract
  - feedback response fetch returns structured feedback fields
  - admin rollout metrics returns fallback-state counts, queue depth, and synthetic monitor health
  - admin feature flag route stores taxonomy metadata and scope-control type
- Analytics events:
  - `fallback_entered`
  - `fallback_resolved`
  - `intro_hold_created`
  - `intro_hold_released`
  - `structured_feedback_submitted`
  - `operator_override_logged`
  - `synthetic_check_failed`
- Backward compatibility:
  - template questions and answer rows continue to work
  - structured feedback is added alongside the existing Q&A model
  - legacy feature flag audience evaluation remains intact

## I. UI and product-language contract

- Approved language:
  - “There are not enough qualified introductions yet. Your portfolio is still doing useful work while we protect quality.”
  - “Your profile remains shareable and searchable. Add proof or trust signals to strengthen intro readiness.”
  - “Verification is still in progress. We will keep trust labels conservative until it completes.”
  - “Shortlist quality is protected right now, so exact ranking is temporarily hidden.”
  - “Best next step”
  - “Reason”
  - “What was strong”
  - “What to strengthen next”
- Language rules:
  - calm, specific, non-comparative
  - no hype, no vanity framing, no fake density
  - no exact comparative ranking language when fairness suppression is active

## J. Acceptance criteria

- Every low-liquidity or low-confidence state maps to one explicit fallback mode.
- Every fallback mode has user-visible status text and a next best action.
- No shortlist, intro, verification, or feedback route ends in a silent empty state.
- Structured feedback requires reason code, personalized note, and next step when the launch flag is on.
- Feature flags expose taxonomy, owner, reason, control type, and revisit date.
- Admin rollout metrics return fallback states, queue depth, and synthetic monitor health.
- Intro corridor can be disabled without breaking portfolio, browse, export, delete, or unpublish.
- Fairness suppression hides exact ranking while leaving shortlist review usable.
- Verification pending or weak proof never upgrades a user into a stronger intro state than policy allows.
- Launch runbook names incident classes, queues, owners, response windows, manual actions, and safe mode.

## K. Risks / tradeoffs

- Biggest risk:
  - flags could hide weak readiness instead of forcing a real cutline
- Ops risk:
  - fallback can become too manual if queue ownership or SLAs stay vague
- Product risk:
  - structured feedback can still drift into generic prose unless reviewed in QA and analytics
- Trust risk:
  - low-liquidity messaging can feel like platform weakness if portfolio value is not clearly preserved
- Safest MVP recommendation:
  - prefer browse-safe continuity, explicit holds, and operator kill switches over automation that overclaims confidence
