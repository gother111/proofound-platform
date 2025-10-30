# Proofound — Core User Flows v1.0

*A concise, thorough blueprint for MVP software documentation. Forty (40) flows: 20 for Individuals and 20 for Organizations. Each flow uses the same mini-spec template to support design, product, and engineering.*

---

## Legend — Mini‑Spec Template
- **Purpose**: The user’s intent and outcome.
- **Entry**: Preconditions & triggers.
- **Steps**: Happy‑path sequence (what the user does).
- **Inputs/Data**: Data required or produced.
- **Needs & Feelings**: What the user needs emotionally/cognitively; common sentiments.
- **System Support**: Key UI, guidance, validations, and automation.
- **Done**: Definition of success / exit criteria.
- **Metrics**: Leading indicators of success.
- **Edge Cases**: Notable exceptions & recovery.

---

# Individuals (I‑01 → I‑20)

## I‑01 Authenticate (Sign up / Sign in / Recovery)
**Purpose**: Access Proofound securely without friction.
**Entry**: User lands on login; deep link to protected page; session expired.
**Steps**:
1) Choose **Sign up** or **Sign in** (Email or Google SSO). 2) Enter email; verify via magic link or password. 3) (Optional) 2FA. 4) If new, proceed to onboarding; if returning, route to last context.
**Inputs/Data**: Email, name (from SSO), minimal device info; session token.
**Needs & Feelings**: Wants trust and speed; anxiety about lockouts.
**System Support**: Clear errors; rate‑limit; suspicious login alerts; remember last org/role.
**Done**: Authenticated session; redirected appropriately.
**Metrics**: Conversion to authenticated; time‑to‑first session; recovery success rate.
**Edge Cases**: Expired links; blocked SSO domain; passwordless fallback.

## I‑02 Consent & Policies
**Purpose**: Understand and accept ToS, Privacy, and Verification policy.
**Entry**: First login or when policies change.
**Steps**: Read summaries → expand details → check required boxes → continue.
**Inputs/Data**: Consent timestamps and version.
**Needs & Feelings**: Clarity, transparency, control.
**System Support**: Human‑readable summaries; links to full docs; downloadable PDF.
**Done**: All required consents recorded.
**Metrics**: Drop‑off at consent; time on page.
**Edge Cases**: Underage/ineligible; jurisdiction‑specific terms.

## I‑03 Guided Onboarding
**Purpose**: Capture goals, causes, availability, comp, and location mode to personalize.
**Entry**: Post‑signup or when profile is incomplete.
**Steps**: 1) Goals & causes → 2) Availability & location → 3) Compensation → 4) Languages/timezone → 5) Review.
**Inputs/Data**: Goals, tags, availability window, comp range, location mode.
**Needs & Feelings**: Wants relevance fast; cognitive load should be low.
**System Support**: Progress bar; smart defaults; skip/“decide later”.
**Done**: Personalization baseline set; recommendations unlocked.
**Metrics**: Completion rate; time to complete; subsequent CTR on recommendations.
**Edge Cases**: Unknown comp; non‑standard availability.

## I‑04 Profile Basics
**Purpose**: Create a credible public‑facing profile foundation.
**Entry**: From onboarding or profile prompt.
**Steps**: Fill bio/headline → location/timezone → languages → profile photo → preview.
**Inputs/Data**: Text fields; avatar image.
**Needs & Feelings**: Wants to look professional; fear of oversharing.
**System Support**: Character guidance; image cropper; visibility toggles.
**Done**: Basics saved and preview renders correctly.
**Metrics**: Completion rate; profile view‑through.
**Edge Cases**: Offensive content filter; missing avatar allowed.

## I‑05 Experience & Education
**Purpose**: Document career history to improve match quality.
**Entry**: From profile editor or nudge when empty.
**Steps**: Add role → org → dates → highlights → impact metrics → save; repeat; add education.
**Inputs/Data**: Roles, dates, bullets, attachments.
**Needs & Feelings**: Wants easy import; worries about accuracy.
**System Support**: CV/LinkedIn import; date validators; achievements templates.
**Done**: At least one role (and optional education) saved.
**Metrics**: Avg roles per user; import usage.
**Edge Cases**: Overlapping roles; non‑Gregorian dates.

## I‑06 Mission / Vision / Values
**Purpose**: Express purpose alignment to power values‑based matching.
**Entry**: From profile; nudge before first apply.
**Steps**: Write statements → select value tags → reorder priority.
**Inputs/Data**: Free‑text + tag selections.
**Needs & Feelings**: Wants authentic expression; avoids fluff.
**System Support**: Examples; tag suggestions; word count guardrails.
**Done**: Statements saved and tags prioritized.
**Metrics**: Tag coverage; correlation with match uplift.
**Edge Cases**: Empty allowed; later edits re‑score matches.

## I‑07 Build Expertise Atlas
**Purpose**: Declare skills/levels for matching.
**Entry**: From profile or onboarding.
**Steps**: Browse domains → pick skills → set level (0–5) & months experience → save.
**Inputs/Data**: Skill IDs, levels, experience months.
**Needs & Feelings**: Wants clarity on level definitions; fears over/under‑rating.
**System Support**: Level rubric tooltips; bulk add; suggested skills from roles.
**Done**: Minimum skill set reached (e.g., ≥5 L4/L3 skills).
**Metrics**: Skills per user; level distribution; match coverage.
**Edge Cases**: Duplicate skills; deprecated taxonomy entries.

## I‑08 Attach Proofs
**Purpose**: Back claims with evidence to gain trust.
**Entry**: From skills or experiences; after prompt to improve credibility.
**Steps**: Choose artifact type (link/file) → attach → map to skill/experience → add context → submit.
**Inputs/Data**: URLs/files; description; visibility.
**Needs & Feelings**: Sensitive about privacy/IP; wants ease.
**System Support**: Redaction tips; virus scan; link unfurl; private vs public mapping.
**Done**: ≥1 proof attached to at least one key skill/experience.
**Metrics**: Proofs per user; proof‑to‑verification rate.
**Edge Cases**: Expired links; large files; NDA restrictions.

## I‑09 Request Verification
**Purpose**: Get third‑party validation to boost match rank.
**Entry**: After adding proofs or finishing an engagement.
**Steps**: Select verifier (peer/org/auto) → send request with context → track status → receive result.
**Inputs/Data**: Verifier contact; scope of claim; evidence package.
**Needs & Feelings**: Wants fairness; anxiety about rejection.
**System Support**: Transparent criteria; templates; reminders; appeal path.
**Done**: Verification outcome recorded (approved/declined/expired).
**Metrics**: Approval rate; time‑to‑verification; impact on match score.
**Edge Cases**: Conflict of interest; unreachable verifier; partial verifications.

## I‑10 Matching Preferences
**Purpose**: Control what the engine prioritizes.
**Entry**: From settings or nudges when matches are weak.
**Steps**: Adjust values/causes/roles/location/availability/comp sliders → preview impact → save.
**Inputs/Data**: Weighting parameters; hard constraints.
**Needs & Feelings**: Seeks agency and clarity; avoids black box.
**System Support**: “Why this matters” copy; live preview of sample matches.
**Done**: Preferences persisted; feed recalculated.
**Metrics**: Preference edit frequency; uplift in click‑through.
**Edge Cases**: Conflicting hard constraints → show zero‑result warning.

## I‑11 Recommended Feed
**Purpose**: Discover best‑fit opportunities.
**Entry**: Home/dashboard.
**Steps**: Scroll ranked list → inspect match chips → open details or save.
**Inputs/Data**: Match score & subscores; personalization data.
**Needs & Feelings**: Wants relevance and transparency; low noise.
**System Support**: Sort by score/newness; dismiss/“not for me” to refine.
**Done**: User opens detail, saves, or applies to at least one.
**Metrics**: CTR; save/apply rate; dwell time.
**Edge Cases**: Cold start; stale postings.

## I‑12 Search & Filter
**Purpose**: Intentional discovery beyond the feed.
**Entry**: From nav or empty feed.
**Steps**: Enter query → apply filters (tags, comp, mode, hours) → paginate → save search.
**Inputs/Data**: Query string; filter selections.
**Needs & Feelings**: Precision; control; speed.
**System Support**: Typeahead; filter pills; zero‑result guidance.
**Done**: Finds viable assignments; saves search/alert.
**Metrics**: Searches per session; zero‑result rate; refinement depth.
**Edge Cases**: Over‑filtering; ambiguous terms.

## I‑13 Assignment Detail
**Purpose**: Decide fit quickly and confidently.
**Entry**: From feed/search.
**Steps**: Review role, must‑haves/nice‑to‑haves, match subscores, values alignment → view org profile → decide.
**Inputs/Data**: Assignment JSON; match vector.
**Needs & Feelings**: Wants transparency; no surprises.
**System Support**: “Why you match/Don’t match” explainer; red flags; verification gates.
**Done**: Apply / save / dismiss action taken.
**Metrics**: View‑to‑apply conversion; time on page.
**Edge Cases**: Hidden comp; conflicting requirements.

## I‑14 Apply / Express Interest
**Purpose**: Submit a targeted, low‑friction application.
**Entry**: From assignment detail.
**Steps**: Answer gating questions; attach tailored proofs; confirm profile sections; consent to share; submit.
**Inputs/Data**: Short answers; attachments.
**Needs & Feelings**: Wants speed; fears black hole.
**System Support**: Autofill; character limits; submission receipt; next‑steps timeline.
**Done**: Application created and acknowledged.
**Metrics**: Submission success rate; time‑to‑submit; dropout at questions.
**Edge Cases**: Missing mandatory proof; eligibility gate fails.

## I‑15 Messaging
**Purpose**: Communicate securely with the org.
**Entry**: After apply or inbound outreach.
**Steps**: Open thread → send message/file → read receipts → follow‑ups.
**Inputs/Data**: Messages, files; audit metadata.
**Needs & Feelings**: Wants responsiveness and clarity.
**System Support**: Templates; typing indicators; attachment previews; moderation.
**Done**: Next step scheduled or question resolved.
**Metrics**: Response time; messages to decision.
**Edge Cases**: Spam; harassment → report/block.

## I‑16 Schedule Interview
**Purpose**: Align on a time without timezone pain.
**Entry**: Invite from org or suggestion from system.
**Steps**: Propose slots → see org availability → confirm → calendar sync.
**Inputs/Data**: Timezone, calendar permissions (optional).
**Needs & Feelings**: Low friction; clarity.
**System Support**: Timezone auto‑convert; reminders; reschedule flow.
**Done**: Confirmed calendar event.
**Metrics**: Time from invite to confirmation; reschedule rate.
**Edge Cases**: Calendar conflicts; daylight savings shifts.

## I‑17 Accept Offer
**Purpose**: Formalize scope and terms.
**Entry**: Post‑interview; offer available.
**Steps**: Review scope/milestones/rate/benefits → accept or negotiate → e‑sign.
**Inputs/Data**: Identity/signature; banking (if paid).
**Needs & Feelings**: Confidence; fairness; legal clarity.
**System Support**: Summary highlights; change log; e‑signature.
**Done**: Offer accepted; engagement created.
**Metrics**: Offer accept rate; time‑to‑accept.
**Edge Cases**: Conditional offers; background/verification pending.

## I‑18 Deliverables & Milestones
**Purpose**: Execute and demonstrate progress.
**Entry**: Engagement active.
**Steps**: View milestone plan → upload deliverables → mark complete → request review.
**Inputs/Data**: Files/links; status updates; notes.
**Needs & Feelings**: Alignment; visibility; recognition.
**System Support**: Due date reminders; versioning; comment threads.
**Done**: All milestones accepted by org.
**Metrics**: On‑time rate; revision cycles; acceptance latency.
**Edge Cases**: Scope creep; blocked dependencies.

## I‑19 Post‑Engagement Verification & Review
**Purpose**: Convert outcomes into verified credibility.
**Entry**: Upon milestone or project completion.
**Steps**: Trigger verification request → collect org attestation → publish badge → leave org review.
**Inputs/Data**: Outcome summary; verifier identity.
**Needs & Feelings**: Recognition; fairness.
**System Support**: One‑click request; testimonial template; dispute/appeal.
**Done**: Verification badge lives on profile; review posted.
**Metrics**: Verification uptake; testimonial rate.
**Edge Cases**: Negative reviews; partial success.

## I‑20 Account & Privacy
**Purpose**: Control visibility, notifications, and data.
**Entry**: Settings nav.
**Steps**: Set availability status; tweak notification cadence; export or delete data.
**Inputs/Data**: Preferences; GDPR requests.
**Needs & Feelings**: Safety; autonomy.
**System Support**: Plain‑language settings; irreversible action warnings; export queue.
**Done**: Preferences saved; requests executed.
**Metrics**: Opt‑out rates; data‑export SLAs.
**Edge Cases**: Legal holds; multi‑device session revocation.

---

# Organizations (O‑01 → O‑20)

## O‑01 Authenticate (Org Access)
**Purpose**: Secure entry for org users.
**Entry**: Login page; invite link.
**Steps**: Sign in/up via email/SSO → optional 2FA → route to org setup or dashboard.
**Inputs/Data**: Email, org invite token.
**Needs & Feelings**: Security; speed; clarity of role.
**System Support**: Role‑aware redirects; org switcher.
**Done**: Authenticated in the correct org context.
**Metrics**: Login success; org‑context errors.
**Edge Cases**: Multiple orgs; expired invite.

## O‑02 Org Setup & Team Roles
**Purpose**: Create org entity and delegate access.
**Entry**: First admin login or “create org”.
**Steps**: Name, type, region → invite team → assign roles (Owner/Steward/Recruiter/Viewer).
**Inputs/Data**: Org metadata; user emails; roles.
**Needs & Feelings**: Control; clarity; safety.
**System Support**: Role descriptions; least‑privilege defaults; audit trail.
**Done**: Org created; team invited with roles.
**Metrics**: Time to first assignment; invite acceptance rate.
**Edge Cases**: Duplicate org; domain claim disputes.

## O‑03 Verify Org & Consent
**Purpose**: Establish trust and compliance for postings.
**Entry**: After org creation or before first publish.
**Steps**: Domain email check or registry doc upload → review → approval; accept data processing terms.
**Inputs/Data**: Proof docs; consent versions.
**Needs & Feelings**: Predictable review; privacy.
**System Support**: SLA indication; status tracking; sandbox until verified.
**Done**: Verified badge; posting unlocked.
**Metrics**: Approval rate; time‑to‑verify.
**Edge Cases**: Rejection with reasons; appeal flow.

## O‑04 Org Profile
**Purpose**: Communicate mission and context to candidates.
**Entry**: From setup or prompt on first posting.
**Steps**: Mission/vision/values → sectors/locations → media/case studies → save.
**Inputs/Data**: Text, tags, images.
**Needs & Feelings**: Show authenticity; efficiency.
**System Support**: Examples; brand image helper; preview.
**Done**: Profile visible; linked on assignments.
**Metrics**: Profile completeness; candidate view time.
**Edge Cases**: Sensitive data; brand approvals.

## O‑05 Create Assignment
**Purpose**: Define a role/engagement clearly for matching.
**Entry**: Click “New assignment”.
**Steps**: Title → tags → must/nice skills → hours & mode → comp/budget → start window → gating questions.
**Inputs/Data**: Structured assignment fields.
**Needs & Feelings**: Clarity; speed; quality of matches.
**System Support**: Templates; skill picker with level rubrics; preview of candidate volume.
**Done**: Draft saved and ready to publish.
**Metrics**: Time‑to‑draft; predicted match coverage.
**Edge Cases**: Missing comp; legal wording flags.

## O‑06 Matching Weights & Gates
**Purpose**: Tune what “fit” means for this assignment.
**Entry**: Within assignment setup.
**Steps**: Adjust skill/value weights; set verification gates; set hard vs soft requirements.
**Inputs/Data**: Weights JSON; gate toggles.
**Needs & Feelings**: Control; confidence in signal.
**System Support**: Explain impact; sample candidate preview; warnings for over‑strict gates.
**Done**: Weights saved; scoring configured.
**Metrics**: Shortlist rate; candidate quality score.
**Edge Cases**: Zero candidates → suggest relaxations.

## O‑07 Publish Assignment
**Purpose**: Make the assignment discoverable.
**Entry**: From draft with minimum required fields.
**Steps**: Final review → compliance check → publish.
**Inputs/Data**: Finalized assignment JSON.
**Needs & Feelings**: Certainty; control over visibility.
**System Support**: Validation, duplicate detection, preview.
**Done**: Live posting with ID/URL.
**Metrics**: Time‑to‑first view; impressions; applies.
**Edge Cases**: Scheduled future publish; unpublish edits.

## O‑08 View Ranked Matches
**Purpose**: Quickly see best candidates with reasons.
**Entry**: After publish; on matches tab.
**Steps**: Review ranked list → open subscores/explanations → take action (shortlist/message/dismiss).
**Inputs/Data**: Match vectors; candidate profiles.
**Needs & Feelings**: Trust in the ranking; transparency.
**System Support**: “Why this match”; filters (verified only, etc.).
**Done**: At least one candidate advanced or contacted.
**Metrics**: View‑to‑action rate; time to first outreach.
**Edge Cases**: Sparse matches; false positives.

## O‑09 Candidate Deep‑Dive
**Purpose**: Evaluate an individual thoroughly.
**Entry**: From matches or search.
**Steps**: Inspect profile, proofs, verifications, history → compare to must/nice haves → notes.
**Inputs/Data**: Candidate data; internal notes.
**Needs & Feelings**: Confidence; evidence.
**System Support**: Side‑by‑side with assignment; red‑flag highlights.
**Done**: Decision to shortlist, message, or pass.
**Metrics**: Time spent; decision rate.
**Edge Cases**: Private proofs; request additional evidence.

## O‑10 Shortlist (Stages)
**Purpose**: Move candidates through a clear pipeline.
**Entry**: From matches or deep‑dive.
**Steps**: Move to stage (new → shortlisted → interview → offer → closed) → add notes and owners.
**Inputs/Data**: Stage status; assignees; notes.
**Needs & Feelings**: Organization; collaboration.
**System Support**: Kanban pipeline; stage SLAs; mentions.
**Done**: Candidate in correct stage with owner.
**Metrics**: Stage conversion rates; time‑in‑stage.
**Edge Cases**: Duplicate applications; withdraws.

## O‑11 Messaging
**Purpose**: Communicate securely with candidates.
**Entry**: From candidate card or stage action.
**Steps**: Send message; request files; templates for FAQs; track responses.
**Inputs/Data**: Messages, attachments.
**Needs & Feelings**: Speed; professionalism.
**System Support**: Snippets; read receipts; moderation.
**Done**: Question answered or next step scheduled.
**Metrics**: Response time; message‑to‑interview rate.
**Edge Cases**: Ghosting; inappropriate content → report.

## O‑12 Schedule Interviews
**Purpose**: Coordinate times across time zones.
**Entry**: From stage action or message thread.
**Steps**: Propose slots; accept from candidate; calendar sync; reminders.
**Inputs/Data**: Calendars; timezones.
**Needs & Feelings**: Efficiency; certainty.
**System Support**: Auto‑convert times; conflict detection.
**Done**: Event confirmed.
**Metrics**: Invite‑to‑confirm latency; no‑show rate.
**Edge Cases**: Panel interviews; reschedules.

## O‑13 Interview Feedback & Decision
**Purpose**: Capture structured evaluation and decide next steps.
**Entry**: After interview event.
**Steps**: Submit scorecard; notes; decision (advance/reject/hold); share feedback (optional).
**Inputs/Data**: Ratings; qualitative notes.
**Needs & Feelings**: Fairness; signal quality.
**System Support**: Bias‑aware prompts; calibrated rubrics.
**Done**: Decision recorded; candidate moved stage.
**Metrics**: Feedback completion rate; time‑to‑decision.
**Edge Cases**: Conflicting feedback; late submissions.

## O‑14 Send Offer / Confirm Scope
**Purpose**: Formalize engagement terms.
**Entry**: Candidate selected.
**Steps**: Draft scope/milestones/rate/benefits; approvals; send; e‑sign.
**Inputs/Data**: Offer JSON; signatures; dates.
**Needs & Feelings**: Legal clarity; speed.
**System Support**: Templates; versioning; signature.
**Done**: Offer accepted or declined; status updated.
**Metrics**: Offer accept rate; time‑to‑accept.
**Edge Cases**: Conditional offers; counter‑proposals.

## O‑15 Approve Deliverables
**Purpose**: Ensure work meets expectations.
**Entry**: During active engagement.
**Steps**: Review submission → comment/request changes → accept or reject → log decision.
**Inputs/Data**: Deliverable files; decision; comments.
**Needs & Feelings**: Quality signal; accountability.
**System Support**: Diff/versioning; due date alerts.
**Done**: Deliverable accepted; milestone closed.
**Metrics**: Revision cycles; acceptance latency.
**Edge Cases**: Missed deadlines; scope ambiguity.

## O‑16 Issue Verifications
**Purpose**: Convert outcomes into trusted credentials for the talent.
**Entry**: On milestone or project completion.
**Steps**: Select outcome → confirm evidence → choose visibility → issue verification → optional testimonial.
**Inputs/Data**: Evidence references; issuer identity.
**Needs & Feelings**: Fair portrayal; minimal effort.
**System Support**: One‑click issuance; template testimonials; audit log.
**Done**: Verification recorded on candidate profile.
**Metrics**: Verification issuance rate; testimonial coverage.
**Edge Cases**: Disputes; sensitive work (private badge).

## O‑17 Manage Assignments
**Purpose**: Keep postings accurate and tidy.
**Entry**: From assignments list.
**Steps**: Edit; duplicate; close/no‑fit; archive; reopen.
**Inputs/Data**: Assignment metadata.
**Needs & Feelings**: Control; hygiene.
**System Support**: Bulk actions; status filters; change history.
**Done**: Up‑to‑date assignment states.
**Metrics**: Stale posting rate; edit frequency.
**Edge Cases**: Closing with active candidates → notify flows.

## O‑18 Team & Permissions
**Purpose**: Govern access safely.
**Entry**: Settings → Team.
**Steps**: Invite member; set role; transfer ownership; revoke access.
**Inputs/Data**: Emails; roles; permissions.
**Needs & Feelings**: Security; clarity.
**System Support**: Role definitions; activity log.
**Done**: Correct access for all members.
**Metrics**: Permission changes; escalation events.
**Edge Cases**: Departed admin; emergency lockout.

## O‑19 Analytics Snapshot
**Purpose**: Understand pipeline health and match quality.
**Entry**: Analytics tab.
**Steps**: Review KPIs (time‑to‑fill, stage conversion, match quality, diversity/values alignment) → drill into bottlenecks.
**Inputs/Data**: Aggregated pipeline & match data.
**Needs & Feelings**: Insight → action; no vanity.
**System Support**: Benchmarks; alerts; export.
**Done**: Action identified or setting adjusted.
**Metrics**: Time‑to‑fill trend; quality‑of‑hire proxies.
**Edge Cases**: Low data volumes; seasonality.

## O‑20 Org Admin & Compliance
**Purpose**: Keep billing, data, and policies compliant.
**Entry**: Settings → Admin.
**Steps**: Billing entity & payment method → invoices → data export/delete → policy updates.
**Inputs/Data**: Billing info; legal contacts; GDPR requests.
**Needs & Feelings**: Reliability; control; auditability.
**System Support**: Role‑gated actions; irreversible action warnings; export queues.
**Done**: Admin tasks executed; records up to date.
**Metrics**: Billing failures; SLA on data requests.
**Edge Cases**: Legal holds; org mergers/splits.

---

## Notes for Spec Authors
- Turn each flow into a detailed spec by expanding **Steps** into screens & states, adding **Field‑level validation**, **Empty/Error states**, and **API/data contracts**.
- Attach success metrics to OKRs (e.g., "I‑11 view→apply ≥ 30%"; "O‑08 time‑to‑first outreach ≤ 2 days").
- Keep copy tone empathetic and direct; provide in‑product guidance where cognitive load is highest.
