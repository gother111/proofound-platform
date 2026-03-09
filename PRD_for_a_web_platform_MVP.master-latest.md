> Doc Class: `reference-spec`
> Last Verified: `2026-03-10`

# Proofound MVP PRD

**Canonical handoff source:** This file is the single source of truth for the Proofound MVP PRD.  
**Derivative docs:** `PRD_for_a_web_platform_MVP.md` is a compatibility mirror. `Proofound_PRD_MVP.md` is an executive summary only.  
**Audience:** Product, design, engineering, analytics, QA.

---

## 1. Product Frame

### 1.1 Category and Promise

Proofound is a proof-first credibility and connection platform for individuals and lean organizations. It replaces low-signal CV-first workflows with structured evidence of real work, privacy-safe matching, and qualified introductions.

### 1.2 MVP Promise

Proofound MVP guarantees a day-1 win:

- individuals can publish and share a public portfolio link immediately after onboarding
- organizations can publish a public trust profile and one high-signal assignment path immediately after onboarding
- both sides can move through a blind-by-default matching corridor toward qualified intros without turning the product into an analytics surface, open people index, or content feed

### 1.3 Primary Outcome

The north-star outcome is **TTSC**: Time-to-Signed-Contract.

Supporting MVP metrics:

- **TTFQI**: Time-to-First Qualified Intro
- **TTV**: Time-to-Value
- **PAC**: Purpose-Alignment Contribution
- **SUS**: System Usability Scale
- **Fairness note status**: release-level privacy-safe fairness reporting state

### 1.4 MVP Boundary

Proofound MVP is a privacy-first, calm workflow for:

- individuals to build trust, publish a proof-first portfolio, become Match-visible, and move toward qualified intros
- lean organizations to publish a trust profile, publish assignments, review privacy-safe matches, and coordinate intros and interviews

MVP excludes:

- public candidate directories or searchable public people indexes
- enterprise admin suites, org operating-system surfaces, or BI-style analytics surfaces
- ATS, HRIS, or marketplace integrations
- payments, contracting, milestone billing, or employer-of-record workflows
- government deployment branches
- gamified profile maintenance, public counters, leaderboards, or streak mechanics
- Zen Hub expansion beyond optional private check-ins and reflections

---

## 2. Canonical Vocabulary

### 2.1 Core Entities

- **Proof Pack**
  - The canonical evidence object across profile, matching, org review, export, and BYOC.
- **Artifact**
  - One atomic evidence item attached to a Proof Pack, such as a file, link, image, credential, assessment, or reference.
- **Proof**
  - The claim and trust judgment about real work, including provenance, freshness, verification, and outcome credibility.
- **Proof Card**
  - A submission-safe presentation of one selected Proof Pack for invite, assignment, intro, or review flows.

### 2.2 Trust and Eligibility Terms

- **Profile readiness tiers**
  - `Discoverable`
  - `Match-visible`
  - `Intro-eligible`
  - `Strongly trusted`
- **User trust tier**
  - `unverified`
  - `workplace_verified`
  - `identity_verified`
- **Proof Pack verification status**
  - `unverified`
  - `partially_verified`
  - `verified`
  - `disputed`
- **Proof freshness state**
  - `fresh`
  - `review_soon`
  - `stale`
  - `expired`

### 2.3 Matching Privacy Model

Proofound matching is **blind-by-default** and uses **progressive reveal**.

Canonical reveal stages:

- `stage0_anonymous`
- `stage1_capability_and_proof`
- `stage2_contextual_reveal`
- `stage3_intro_approved`
- `stage4_interview_coordination`

**Redaction** is not a competing privacy model. It is an owner-facing visibility control used in previews, published surfaces, and allowed reveal surfaces.

### 2.4 Public Distribution Model

- MVP includes a **public portfolio** for individuals and organizations.
- MVP includes **portfolio indexing** as a controlled distribution state.
- Direct-link sharing is in scope.
- Indexing is off by default and must be explicitly enabled when safety rules pass.
- A searchable people index or open browse index is out of scope.

### 2.5 Workflow Objects

- **match**
  - A ranked connection candidate between an individual and an assignment.
- **intro**
  - A consented introduction created after qualification and reveal rules pass.
- **interview**
  - A scheduled or completed interview tied to a match or intro.
- **feedback follow-up**
  - The 48-hour post-interview decision and feedback process.
- **Zen Hub**
  - Optional private check-ins and reflections stored in a private partition and excluded from ranking, reveal, org review, fairness workflows, and public rendering.

---

## 3. Users and Core Journeys

### 3.1 Individuals

Primary MVP user groups:

- new graduates
- career switchers
- immigrants in new markets
- mid-career movers
- senior experts and advisors

Canonical individual journey:

1. Sign up and complete onboarding.
2. Publish a public portfolio link.
3. Build a profile using skills, preferences, and Proof Packs.
4. Reach `Discoverable`, then `Match-visible`.
5. Browse matching surfaces without being hard-blocked if not yet `Intro-eligible`.
6. Become `Intro-eligible` through stronger proof coverage, freshness, and trust signals.
7. Move through blind-by-default review, intro, interview, and feedback follow-up.
8. Optionally use Zen Hub privately without affecting any ranking or review surface.

### 3.2 Organizations

Primary MVP org groups:

- NGOs
- startups
- SMEs
- larger hiring teams using the same lean owner-plus-reviewer workflow

Canonical organization journey:

1. Sign up and create an organization.
2. Publish a public organization trust profile.
3. Create one assignment with outcomes, constraints, must-have skills, and optional verification gates.
4. Review privacy-safe matches in an Assignments and Matches queue.
5. Shortlist, pass, or request intros without early identity reveal.
6. Coordinate intros, interviews, and 48-hour feedback follow-up.

### 3.3 Experience Rules

- The individual product surface is a **Home snapshot**, not an analytics product.
- The organization product surface is an **Assignments and Matches queue**, not a BI-style analytics surface.
- Matching is consent-based and proof-first, not application-first.
- Published public portfolios never weaken blind-by-default matching behavior.

---

## 4. MVP Product Requirements

## 4.1 Shared Requirements

- Auth supports email and password plus Google and LinkedIn OAuth.
- Required consent is captured inside auth and onboarding.
- Privacy controls are field-level and must apply consistently across profile, public portfolio, matching, and reveal stages.
- Export and delete flows are part of MVP.
- Government ID verification is not exposed in the self-serve MVP UI.

## 4.2 Individual Product Surfaces

### A. Onboarding and Public Portfolio

- Onboarding is portfolio-first.
- Individual onboarding collects display name, handle, headline, bio, and location.
- Onboarding ends with a dedicated **Public portfolio ready** step.
- Public individual URL: `/portfolio/{handle}`
- Public portfolio defaults to a minimal safe allowlist:
  - header on
  - proof bar on
  - work email off
  - contact off
  - skills off
  - bio off
- Search indexing is disabled by default.

### B. Profile, Skills, and Proof Packs

- The profile is proof-first and uses Proof Packs as the canonical evidence object.
- Skills and profile credibility must point to linked Proof Packs, not loose artifact counts.
- Artifacts may appear only as child evidence units inside a Proof Pack.
- A Proof Pack may be:
  - owner-only
  - link-only
  - matched-org visible
  - public
- Child artifact permissions may narrow exposure but never widen it.

### C. Matching Readiness and Matching

- Readiness is expressed through the profile readiness tiers:
  - `Discoverable`
  - `Match-visible`
  - `Intro-eligible`
  - `Strongly trusted`
- Product access is not hard-blocked before `Intro-eligible`.
- Private browse may be available before org-visible matching.
- Org-visible matching starts at `Match-visible`.
- Qualified intros start only at `Intro-eligible`.
- Matching explanations may reference:
  - skill fit
  - proof strength
  - constraints fit
  - verification readiness
  - purpose fit
  - fairness or policy limitations when relevant
- Matching explanations must never expose hidden identity-bearing information.

### D. Intros, Interviews, and Feedback Follow-up

- Intro creation requires qualification and reveal-stage rules to pass.
- Interview scheduling supports Google Meet and manual links.
- Zoom may be shown only as fallback guidance, not as a guaranteed live integration.
- Both sides participate in a **48-hour feedback follow-up** after interview completion.
- Personalized feedback is in scope when an assignment closes and policy requires it.

### E. Zen Hub

- Zen Hub is optional.
- Zen data is visible only to the user.
- Zen data is excluded from ranking, reveal, org review, fairness workflows, public rendering, and user-facing analytics.
- Zen supports export and delete.

### F. Settings, Export, and Delete

- Export supports versioned JSON.
- Delete is immediate and irreversible with explicit confirmation.
- Visibility controls must provide a clear “what others can see” summary.

## 4.3 Organization Product Surfaces

### A. Onboarding and Public Portfolio

- Organization onboarding is portfolio-first.
- The organization setup creates:
  - organization record
  - active owner membership
  - public organization portfolio route
- Public org URL: `/portfolio/org/{slug}`
- Onboarding ends with an **Organization portfolio ready** step that emphasizes copy and share actions.

### B. Organization Trust Profile

- Organization trust profile includes:
  - mission
  - why-join statement
  - values
  - proof highlights
  - lightweight work norms
- This is the minimum org trust surface required for matching credibility in MVP.

### C. Assignment Publishing

- MVP supports one basic assignment path.
- Assignment fields include:
  - role
  - outcomes
  - must-have skills
  - practical constraints
  - optional trust requirements
  - masked budget handling where used
- Assignment publishing is designed for speed and clarity, not analytics depth.

### D. Match Review and Intro Workflow

- Orgs review privacy-safe matches in an Assignments and Matches queue.
- Allowed org review actions:
  - shortlist
  - pass
  - request intro
  - request reveal where policy allows
- Public portfolio links, direct identity, and contact details must stay hidden in blind stages.

### E. Minimal Org Access

- MVP org collaboration includes:
  - one owner
  - optional reviewer access
- Multi-layer admin suites, templates, org maps, donor reporting, and heavy operations tooling are out of scope.

### F. BYOC Candidate Invites

- Organizations may invite a known candidate by email.
- The candidate claims the invite using the matching email.
- Submission uses a Proof Card derived from a selected Proof Pack.
- Proof Card remains a render surface, not a separate stored entity.

### G. Organization Trust Tiers and Sensitive-Domain Safety (MVP-lite / post-MVP corridor)

- Proofound uses a lightweight organization trust-tier model to decide how far an organization can move through publishing, intro, and sensitive-domain workflows.
- This is an MVP safety and gating layer, not full KYC, not compliance certification, and not an enterprise trust-and-safety suite.
- Organization trust tier is a separate org-level state model. It does not replace user trust tier, Proof Pack verification status, or moderation and suspension states.

#### Organization trust tiers

- `Unreviewed`
  - default for newly created organizations
  - standard public trust profile may exist
  - standard non-sensitive assignments may publish
  - sensitive-domain publishing and stronger verification-path requests stay queued or unavailable until more trust signals exist
- `Basic trusted`
  - standard assignment publishing works normally
  - standard intro corridor access works normally
  - stronger verification-path requests or sensitive-domain requests may still queue for review
- `Reviewed`
  - Proofound completed a scoped product-safety review for the organization
  - sensitive-domain publishing may proceed when the specific organization and assignment pass review
  - certain stronger verification-path requests may be accepted, still with case-by-case review
- `Restricted`
  - assignment publishing, intro requests, or visibility may be paused, limited, or hidden pending review
  - this is an operational safety state, not a public accusation and not a permanent status by default

#### Early-version inputs that influence org trust tier

- verified work email or verified domain control
- org profile completeness
- manual admin review
- issue and dispute history

#### What org trust tier affects

- visibility of organization assignments inside matching surfaces
- whether an assignment can publish normally, queue for review, or pause
- whether the organization can move a candidate into intro request flow
- whether the organization can request certain stronger verification or sensitive review paths

#### Sensitive-domain and child-safety guardrails

Sensitive categories that require additional review in MVP-lite:

- child-facing work, youth programs, schools, tutoring, and mentoring
- healthcare, mental health, therapy, care, and safeguarding
- housing, shelter, crisis support, domestic-violence support, or similar vulnerable-population support
- legal aid, immigration support, or similar high-vulnerability support contexts
- roles involving direct access to minors, vulnerable adults, or sensitive personal data

Queued for review:

- sensitive-domain organizations
- sensitive-domain assignments
- requests for stronger verification paths
- orgs with incomplete trust signals or unresolved review context

Blocked or paused:

- `Restricted` organizations
- assignments that imply unsafe direct child contact outside a verified institutional context
- exploitative unpaid work patterns inside sensitive domains
- repeat abuse or dispute patterns that indicate elevated risk

#### Abuse prevention signals

- suspicious assignment patterns, including repeated reposting with shifting expectations, identity evasiveness, or inconsistent org details
- exploitative unpaid work patterns, especially when responsibilities are high-risk or operationally significant
- repeated dispute triggers across assignments, intro requests, or verification-related workflows

#### Audit and admin tooling

- an internal admin queue with reason codes for review, escalation, restriction, and release
- an append-only trust tier change log with actor, timestamp, prior tier, new tier, and reason code
- moderation notes visible only to internal admins and authorized reviewers
- org-facing product surfaces show only coarse status and next step, never internal moderation rationale

#### Analytics

- trust tier distribution across organizations
- escalation rates from `Unreviewed` or `Basic trusted` into manual review
- abuse flags and repeated safety-trigger counts

#### MVP-lite vs post-MVP corridor

MVP-lite:

- manual review
- coarse heuristics
- limited sensitive-domain categories
- internal notes and reason codes
- simple queue, gating, and restriction actions

Post-MVP corridor:

- richer verification-path requests
- a stronger review rubric for sensitive-domain organizations
- limited appeal and re-review workflows
- stronger domain-authorization proofs for high-risk contexts
- better queue tooling and operator triage support

#### Facts & Decisions

- Organizations use four product trust tiers:
  - `Unreviewed`
  - `Basic trusted`
  - `Reviewed`
  - `Restricted`
- MVP-lite trust tiering is a lightweight operational safety model for publishing, intros, and sensitive-domain access.
- Sensitive-domain guardrails focus on a short list of higher-risk contexts and keep review manual by default.
- Org trust tier remains separate from:
  - user trust tier
  - Proof Pack verification status
  - moderation, suspension, or account-ban states
- `Reviewed` means Proofound completed a scoped product-safety review. It does not mean legal certification, enterprise compliance approval, or blanket endorsement.
- `Restricted` is reversible and operational.

#### Open Questions

- Whether some sensitive-domain categories need narrower sub-rules before launch, especially around child-facing volunteer work
- Whether post-MVP should require stronger org authorization proofs for certain healthcare, education, or care contexts
- Whether repeated dispute thresholds should differ for publishing restrictions versus intro restrictions

#### Out of Scope

- full KYC
- sanctions screening
- background checks
- payroll verification
- enterprise trust-and-safety case management
- public display of moderation notes or detailed internal risk scoring

#### Acceptance Criteria

- Scenario: a new organization completes onboarding with a standard profile and a verified work email.
  - Result: it starts as `Unreviewed`, may publish a standard non-sensitive assignment, and cannot bypass sensitive-domain review automatically.
- Scenario: an organization has sufficient trust signals and no meaningful issue history.
  - Result: it may become `Basic trusted`, publish normal assignments, and use the standard intro corridor.
- Scenario: an organization operates in a sensitive domain and passes scoped admin review.
  - Result: it may become `Reviewed` and publish the reviewed sensitive-domain assignment path without implying full compliance approval.
- Scenario: an organization shows repeat dispute or abuse signals.
  - Result: it may move to `Restricted`, and publishing or intro actions may pause or hide pending review.
- Scenario: an internal reviewer adds moderation notes.
  - Result: internal admins and authorized reviewers can see the notes, while org-facing surfaces receive only coarse status and next step.
- Scenario: analytics reporting is generated for org trust and safety.
  - Result: trust tier distribution, escalation rates, and abuse flags are available internally only and do not create a user-facing analytics product.

## 4.4 Public Portfolio Trust Layer, Share Metadata, and Indexing Rules (MVP)

### Purpose of public portfolio pages in MVP

- Public portfolio pages give individuals and organizations one clean, shareable trust surface on day 1.
- The page helps a public viewer quickly understand who this person or organization is, what public proof exists, and how current that proof is.
- The page is not a public marketplace listing, not a social feed, and not a directory page.

### Public page types

- Individual portfolio page at the canonical portfolio route.
- Organization portfolio page at the canonical organization portfolio route.
- Optional proof detail surface, implemented either as a public proof detail page or a proof modal contract.

Rules for the optional proof detail surface:

- It shows only data that is already public on the parent portfolio.
- It must not introduce private metadata, reviewer notes, raw artifacts, or identity-bearing hidden fields.
- If it is a standalone route, it inherits the same visibility, noindex, withdrawal, and preview-safety rules as the parent portfolio.
- If it is implemented as a modal, copied links must still resolve safely and must not expose hidden proof content.

### Exact MVP rules for public trust information

Allowed public trust information:

- Proof counts reflect only currently public proofs.
- Verification badges may use scoped labels already defined in the PRD, such as Proof Pack verification status or user trust tier labels.
- Freshness appears as one simple plain-language state derived from the current proof freshness model.
- Proof summary appears as short, public-safe summaries of the most relevant visible proofs.

Hard exclusions:

- No private reviewer notes.
- No verifier identity details.
- No raw uploaded documents unless they were already approved as public-safe proof media.
- No hidden contact data, private links, match-only evidence, reveal-gated data, or internal moderation context.
- No derived trust claim that overstates what has actually been checked.
- No blanket page-level claim such as "fully verified" unless the scope is explicitly accurate and visible on page.

### Structured metadata requirements

Canonical URL:

- Only the stable portfolio route is canonical for an individual or organization.
- Snippet, tokenized, embed, preview, and admin-owner views are never canonical.
- Old handles or slugs may redirect to the new canonical route only while the page remains public.

Page title rules:

- Individual page title: `{Public Name or Handle} | Proofound`
- Organization page title: `{Public Organization Name or Slug} | Proofound`
- Optional public proof detail title: `{Public Proof Title} | {Portfolio Name} | Proofound`
- A title may append one short public-safe descriptor only if that same descriptor is already visible on page.

Meta description rules:

- Use one concise public-safe summary from the page's visible summary or proof summary.
- Fall back to a generic Proofound-branded description when the page is link-only, sparse, or safety-limited.
- Never include private fields, unverifiable superlatives, or hidden organizations or clients.

OG and Twitter preview rules:

- Include title, description, canonical URL, preview image, and site name.
- Link-only and noindex pages use a generic branded preview if a page-specific preview could expose hidden information.
- Indexable pages may use public-safe page-specific preview copy and image.

Structured data rules:

- If included, keep it minimal: `WebPage` plus `Person` or `Organization`.
- `CreativeWork` is optional only for a standalone public proof detail page.
- Review, rating, job, directory, and collection schema are out of scope for MVP public pages.

### Indexing rules

Safe default behavior:

- A newly public page is shareable by direct link but not indexable.

Indexable state:

- A page may become indexable only when the owner explicitly enables indexing and the current page content passes public-safety checks.

Noindex states:

- Unpublished pages.
- Link-only pages.
- Pages with redaction or hidden-content blockers.
- Withdrawn or moderated pages.
- Tokenized snippet or embed surfaces.

Owner controls:

- The owner can enable or disable indexing separately from publication.
- The owner can depublish the page entirely.

Withdrawal and depublish behavior:

- Depublish removes public access and moves the page to noindex.
- Withdrawn proofs are removed from public rendering immediately.
- Public pages that fall below safety requirements downgrade to noindex or unavailable, depending on severity.

### Share safety

- Copied links always respect the current visibility state at open time.
- If a proof becomes private, withdrawn, deleted, or blocked, public pages and proof detail surfaces stop showing it immediately.
- Public snippets and previews must not keep exposing withdrawn or private proof text or thumbnails.
- Cache invalidation is required on publish and depublish, indexing toggle, proof withdrawal or deletion, handle or slug rename, and proof summary or public preview image changes.
- Stale external caches may persist briefly, but Proofound-controlled page responses, metadata, and preview generation must update immediately after the state change.

### Public verification summary behavior

- A signed-out viewer should understand in a few seconds whose portfolio this is, what kind of proof is present, whether some proof has been checked, and how recent the visible proof is.
- The page must not show reviewer notes, internal decision rationale, moderation notes, or workflow-specific reveal context.
- The page must not use misleading page-level "verified" claims.
- Preferred scoped language includes:
  - "contains verified proofs"
  - "workplace verified account"
  - "fresh proof updated recently"
- Absence of a badge is not a negative fraud claim.

### PDF and text export relationship to public visibility

- Owner exports remain separate private product behavior.
- If MVP exposes public PDF or text export from a public portfolio, that export must render only the current public-safe page state.
- Public export must not include hidden fields, withdrawn proofs, reviewer notes, or richer owner-only export data.
- If the page is depublished or the proof is withdrawn, public export links must stop resolving or regenerate without the removed content.

### Public analytics

Internal-only MVP instrumentation may include:

- Views.
- Shares or share-link copies.
- Proof detail opens.
- Outbound contact clicks or contact-request clicks.

Boundaries:

- These metrics support product health, debugging, and abuse monitoring.
- They are not public counters.
- They are not a public ranking mechanism.
- They do not turn the portfolio into a growth dashboard in MVP.

### Edge cases

- Renamed handle:
  - the old canonical URL redirects only while the new page remains public; otherwise the old URL resolves unavailable
- Deleted proof:
  - the proof disappears from the public page, metadata, proof counts, and previews immediately
- Hidden proof still linked somewhere:
  - the old deep link resolves to unavailable or a safe fallback that exposes no hidden content
- Public page with zero proofs:
  - the page may remain public as a minimal identity shell if other minimum public-safe content exists
  - it must not make strong trust claims
  - it remains noindex by default until stronger public-safe proof exists

### Facts & Decisions

- Public portfolio is a day-1 share surface.
- One clean template is the MVP default across individual and organization pages.
- Direct-link sharing is the primary distribution mode.
- Indexing is separate and opt-in only.
- Public trust language must stay scoped and honest.
- Private, withdrawn, and reveal-gated content never leaks into public pages, metadata, previews, or exports.
- Proofound does not ship a public directory or SEO-farm surface in MVP.

### Open Questions

- Should the optional proof detail surface launch first as modal-only or route-based?
- Should owners later get a minimal private summary of public traffic without turning MVP into an analytics product?
- What minimum quality bar, if any, should be required before a zero-proof page may opt into indexing?

### Acceptance Criteria

- A public viewer can understand identity, proof presence, proof freshness, and scoped verification quickly.
- No private reviewer notes or reveal-only fields appear on any public surface.
- Copied links always resolve according to current visibility.
- Noindex and depublish behavior works for pages that are link-only, withdrawn, or blocked.
- Deleted or withdrawn proofs disappear from page body, previews, counts, and proof detail surfaces.
- Metadata is canonical, minimal, and privacy-safe.
- Structured data, if present, stays limited to page-level schema and avoids directory or review schema.
- Public analytics exist only as internal instrumentation.
- Public export never exceeds current public visibility.
- The MVP still has no public directory behavior.

### Launch Checklist

- Canonical metadata implemented for individual and organization portfolios.
- Generic fallback preview copy and image exist for noindex or sparse pages.
- Proof withdrawal invalidates public page fragments and previews.
- Noindex and sitemap behavior tested for each publication state.
- Old handle or slug redirects tested.
- Public proof-detail fallback tested for hidden or deleted proof.
- No private notes or verifier identities present in page source, metadata, previews, or export.

---

## 5. Canonical Lifecycle Models

## 5.1 Profile Readiness

Profile readiness is a product-readiness model, not a legal status model.

- `Discoverable`
  - public basics, one target role or focus area, one recent L4 skill, one qualifying Proof Pack linked to that skill, and one practical preference
- `Match-visible`
  - `Discoverable` plus broader role, work-mode, location, availability, and stronger Proof Pack coverage
- `Intro-eligible`
  - `Match-visible` plus stronger role-relevant Proof Pack coverage, fresh qualifying proof, and complete intro preferences
- `Strongly trusted`
  - `Intro-eligible` plus deeper proof coverage across contexts and at least two active trust anchors

## 5.2 User Trust Tier

User trust tier is user-level and derived from trust signals.

- `unverified`
- `workplace_verified`
- `identity_verified`

Rules:

- Work email verification may elevate a user to `workplace_verified`.
- LinkedIn verification may elevate a user to `workplace_verified` or `identity_verified` depending on signal strength.
- Attestations can strengthen trust reasoning but do not replace the canonical user trust tier model.

## 5.3 Proof Pack Lifecycle

Proof Pack lifecycle is separate from profile readiness and user trust tier.

- `draft`
- `ready`
- `published`
- `submitted`
- `withdrawn`
- `superseded`
- `archived`

Rules:

- `draft -> ready` only when publish-eligible fields are complete.
- `ready -> published` only when visibility and eligibility rules pass.
- `published -> submitted` when attached to an assignment, invite, intro, or review flow.
- `withdrawn` and `superseded` stop contributing positive trust lift immediately but remain exportable and auditable to the owner.

## 5.4 Proof Pack Verification and Freshness

### Proof Pack verification status

- `unverified`
- `partially_verified`
- `verified`
- `disputed`

### Proof freshness state

- `fresh`
- `review_soon`
- `stale`
- `expired`

Rules:

- Proof Pack verification status is pack-level.
- `disputed` suppresses positive trust language and trust lift until resolved.
- `stale` lowers confidence and current-trust contribution but does not erase historical evidence.

## 5.4A Proof Pack Canonical Schema & Portability (MVP)

### Facts & Decisions

- The Proof Pack is the canonical portable proof object for profile credibility, public portfolio rendering, matching summaries, org review, and owner export.
- MVP portability must increase trust and reuse without introducing standards complexity. The export format is versioned JSON with a JSON-LD shape, deterministic hashing, explicit provenance, and explicit freshness.
- MVP does not promise blockchain, wallets, decentralized credential exchange, or third-party signature networks.
- MVP supports two export scopes only:
  - `owner_full` for owner-visible export and trusted re-import
  - `public_safe` for public portfolio sharing and machine-readable public portability
- The canonical export contract is stable even if MVP persistence uses a mix of first-class columns and canonical metadata fields internally.

### Canonical Object Model

Every Proof Pack must resolve to one canonical object with these top-level fields:

- `proof_pack_id`
  - Stable UUID for the pack.
- `owner_user_id`
  - UUID of the owning individual profile. Present in `owner_full`. Omitted from `public_safe` unless separately public-safe by future policy.
- `source_artifact_id`
  - Nullable UUID. Must be set when the pack is directly derived from one canonical source artifact.
- `source_submission_id`
  - Nullable UUID. Must be set when the pack is directly derived from one canonical submission or delivery event.
- `title`
  - Required short label for the pack.
- `summary`
  - Required concise narrative of what the proof shows and why it matters.
- `capability_tags`
  - Required array of normalized capability or taxonomy tags.
- `l4_links`
  - Required array of linked L4 skill or taxonomy references. Empty array allowed.
- `tools_used`
  - Required array of user-visible tools, systems, or methods used in the work.
- `context`
  - Required object with:
    - `subject_type`: `role`, `assignment`, `capability`, `domain`, or `general`
    - `subject_id`: string or `null`
    - `role_label`: string or `null`
    - `organization_label`: string or `null`
    - `timeframe_label`: string or `null`
    - `brief`: string or `null`
    - `owner_confirmed_refreshed_at`: ISO timestamp or `null`
- `evidence[]`
  - Required ordered array. Each item contains:
    - `evidence_id`
    - `artifact_id`
    - `type`: `file`, `link`, `image`, `video`, `credential`, `reference`, `assessment`, or `other`
    - `title`
    - `summary`
    - `url`
    - `issued_at`
    - `updated_at`
    - `expires_at`
    - `visibility`
    - `withheld`
    - `withheld_reason`
- `outcomes[]`
  - Required ordered array. Each item contains:
    - `outcome_id`
    - `label`
    - `summary`
    - `metric_label`
    - `metric_value`
    - `metric_unit`
    - `evidence_ids[]`
- `links[]`
  - Required ordered array. Each item contains:
    - `link_id`
    - `label`
    - `url`
    - `link_kind`
- `created_at`
  - Required ISO timestamp.
- `updated_at`
  - Required ISO timestamp.
- `freshness_score`
  - Required deterministic integer: `100`, `70`, `40`, or `10`.
- `freshness_updated_at`
  - Required ISO timestamp for the latest freshness recalculation.
- `provenance`
  - Required object defined below.
- `verifier_records`
  - Required ordered array defined below.
- `visibility`
  - Required pack-level maximum visibility: `owner_only`, `matched_org`, `link_only`, or `public`.
- `export_schema_version`
  - Required export contract version. MVP starts at `1.0.0`.
- `portability_hash`
  - Required SHA-256 hash of the canonical export payload for the selected export scope.
- `signature_status`
  - Required MVP enum: `unsigned`, `hash_verified`, or `invalid`.

Additional canonical object rules:

- `source_artifact_id` and `source_submission_id` are both nullable.
- If a pack is derived from an existing artifact, `source_artifact_id` must be set.
- If a pack is derived from a submission or assignment delivery, `source_submission_id` must be set.
- If a pack is composed directly by the owner without one upstream source object, both source pointers may be `null`, but `provenance.origin_type` must be `manual_pack_builder`.
- `evidence[]`, `outcomes[]`, `links[]`, and `verifier_records` must be emitted in stable order. When explicit product order exists, that order is canonical. Otherwise, sort by stable ID ascending.

`provenance` is a required object with:

- `origin_type`: `upload`, `assignment_delivery`, `org_verification`, `human_review`, `auto_check`, `manual_pack_builder`, or `import`
- `origin_ref_id`
- `captured_at`
- `captured_by_actor_type`: `candidate`, `organization_member`, `platform_admin`, `system`, `service_account`, or `verifier`
- `captured_by_actor_id`
- `capture_surface`
- `review_reference_ids[]`
- `auto_check_ids[]`
- `completeness_state`: `complete`, `partial`, or `missing_references`

`verifier_records` is a required array. Each item contains:

- `verifier_record_id`
- `verification_kind`
- `status`
- `verifier_class`
- `verified_at`
- `expires_at`
- `last_refreshed_at`
- `source`
- `issue_state`

### JSON-LD Export Model

- MVP export uses a JSON-LD-shaped document with an inline `@context`.
- MVP export must not depend on a hosted context URL, wallet runtime, or external credential registry.
- `@type` is always `ProofPack`.
- JSON-LD in MVP exists for machine-readable portability and public interoperability only.

Canonical export shape:

```json
{
  "@context": {
    "proof_pack_id": "https://proofound.io/ns/proof-pack-id",
    "owner_user_id": "https://proofound.io/ns/owner-user-id",
    "capability_tags": "https://proofound.io/ns/capability-tags",
    "l4_links": "https://proofound.io/ns/l4-links",
    "tools_used": "https://proofound.io/ns/tools-used",
    "freshness_score": "https://proofound.io/ns/freshness-score",
    "provenance": "https://proofound.io/ns/provenance",
    "verifier_records": "https://proofound.io/ns/verifier-records"
  },
  "@type": "ProofPack",
  "proof_pack_id": "uuid",
  "owner_user_id": "uuid",
  "source_artifact_id": null,
  "source_submission_id": null,
  "title": "Migration delivery for regional civic platform",
  "summary": "Led delivery and left auditable evidence of scope, launch, and measurable outcome.",
  "capability_tags": ["service-design", "delivery-management"],
  "l4_links": ["l4:service-design", "l4:delivery-management"],
  "tools_used": ["Notion", "Figma", "PostgreSQL"],
  "context": {
    "subject_type": "assignment",
    "subject_id": "uuid",
    "role_label": "Delivery Lead",
    "organization_label": "Proofound",
    "timeframe_label": "Q4 2025",
    "brief": "Delivered MVP launch corridor",
    "owner_confirmed_refreshed_at": "2026-03-01T00:00:00Z"
  },
  "evidence": [],
  "outcomes": [],
  "links": [],
  "created_at": "2026-02-01T10:00:00Z",
  "updated_at": "2026-03-01T10:00:00Z",
  "freshness_score": 70,
  "freshness_updated_at": "2026-03-09T00:00:00Z",
  "provenance": {
    "origin_type": "assignment_delivery",
    "origin_ref_id": "uuid",
    "captured_at": "2026-02-01T10:00:00Z",
    "captured_by_actor_type": "candidate",
    "captured_by_actor_id": "uuid",
    "capture_surface": "assignment_submit_flow",
    "review_reference_ids": [],
    "auto_check_ids": [],
    "completeness_state": "complete"
  },
  "verifier_records": [],
  "visibility": "public",
  "export_schema_version": "1.0.0",
  "portability_hash": "sha256-hex",
  "signature_status": "hash_verified"
}
```

### Portability Hash & Signature Rules

- `export_schema_version` starts at `1.0.0` for Proof Pack exports.
- `portability_hash` is SHA-256 over the canonical JSON serialization of the selected export payload.
- Canonical serialization rules for MVP:
  - UTF-8 encoding
  - recursive key sorting
  - arrays preserved in canonical emitted order
  - ISO timestamps normalized to UTC `Z` form
  - no pretty-printing assumptions
  - `null` and empty arrays must be emitted explicitly when the field is part of the canonical object for that scope
- What is hashed now:
  - the full JSON-LD-shaped Proof Pack payload for the selected scope after visibility filtering
- What is excluded from the hash now:
  - download metadata
  - request metadata
  - audit metadata
  - transport wrapper fields
  - any future detached signature blob
- Scope affects the hash:
  - `owner_full` and `public_safe` exports of the same pack produce different hashes when their payloads differ
- What is signed now:
  - no detached cryptographic signature is required in MVP
  - the system stores the deterministic `portability_hash` and any export checksum in server records
  - `signature_status = hash_verified` only means the exported or imported payload re-hashed to the stored `portability_hash`
- `signature_status = unsigned` means no verification has been performed yet for that payload instance.
- `signature_status = invalid` means a supplied or stored payload failed hash verification against the declared `portability_hash`.
- Deferred post-MVP:
  - detached Ed25519 signatures
  - signer identity metadata
  - key rotation
  - countersigning
  - third-party verification workflows

### Freshness Rules

- Proof Pack freshness reuses the MVP repo thresholds already used for proof freshness reasoning.
- Pack freshness uses only:
  - child evidence timestamps
  - verifier refresh timestamps
  - explicit evidence expiries
  - `context.owner_confirmed_refreshed_at`
- For each qualifying evidence item, compute a freshness basis timestamp as the most recent of:
  - `evidence.updated_at`
  - `evidence.issued_at`
  - related verifier `last_refreshed_at`
  - `context.owner_confirmed_refreshed_at`, when the owner explicitly confirms the evidence is still current
- Pack freshness is determined by the oldest qualifying evidence basis across the pack, with explicit expiry taking precedence.
- Freshness states:
  - `fresh`: no qualifying evidence older than 90 days
  - `review_soon`: oldest qualifying evidence 91 to 180 days old
  - `stale`: oldest qualifying evidence 181 to 365 days old
  - `expired`: any required qualifying evidence explicitly expired, or oldest qualifying evidence older than 365 days
- `freshness_score` maps deterministically:
  - `fresh` -> `100`
  - `review_soon` -> `70`
  - `stale` -> `40`
  - `expired` -> `10`
- Freshness decays daily.
- Refresh nudges trigger:
  - once when a pack enters `review_soon`
  - once when a pack enters `stale`
  - every 30 days while the pack remains `stale` or `expired`
- Product treatment:
  - owner surfaces show the current freshness state, the last refresh date, and a clear refresh action
  - org review surfaces show muted stale treatment and stop counting the pack as fresh proof
  - public portfolio surfaces may still show the pack historically, but must label `stale` or `expired` clearly and remove any fresh-proof lift

### Provenance Rules

- Every pack must store where it came from and how it entered the system.
- One primary `provenance.origin_type` is required per pack:
  - `upload`
  - `assignment_delivery`
  - `org_verification`
  - `human_review`
  - `auto_check`
  - `manual_pack_builder`
  - `import`
- Provenance must capture:
  - source reference ID
  - capture timestamp
  - capture actor type and actor ID
  - capture surface
  - linked review references
  - linked auto-check references
  - completeness state
- Provenance semantics:
  - `upload` means the pack originated from candidate-uploaded evidence
  - `assignment_delivery` means the pack originated from assignment submission or delivery flow
  - `org_verification` means the pack was materially created or enriched by an org verification workflow
  - `human_review` means a platform reviewer materially created or confirmed the pack representation
  - `auto_check` means a system-generated check materially created or enriched the pack
  - `manual_pack_builder` means the owner composed the pack directly without one single upstream source object
  - `import` means the pack originated from a prior portability import
- If pack-level provenance and child evidence provenance differ, child evidence may narrow source detail, but pack-level provenance remains the canonical summary.

### Import / Export Rules

- Export scopes:
  - `owner_full`
    - includes all owner-visible canonical fields
    - importable as a trusted owner pack
  - `public_safe`
    - includes only public-visible fields
    - may include withheld placeholders
    - is not importable as a trusted owner pack
- Schema versioning:
  - imports accept the same major `export_schema_version`
  - imports reject different major versions
  - minor and patch versions within major `1` must remain backwards-compatible
- Dry-run validation is mandatory before apply.
- Dry-run validation must return:
  - `errors[]`
  - `warnings[]`
  - `conflicts[]`
  - `missing_references[]`
- Conflict precedence is deterministic:
  - exact `proof_pack_id`
  - then exact `portability_hash`
  - then source pointer match using `source_artifact_id` or `source_submission_id`
- Conflict handling rules:
  - same `proof_pack_id` and same `portability_hash` -> duplicate, safe no-op
  - same `proof_pack_id` and different `portability_hash` -> reject as `id_conflict`
  - different `proof_pack_id` and same `portability_hash` -> duplicate content, safe no-op
  - source pointer match with different `portability_hash` -> reject as `source_conflict`
- Invalid import behavior:
  - invalid packs are rejected atomically per pack
  - the system must not silently drop invalid fields and continue as trusted import
  - apply may proceed only for packs that pass dry-run validation
- Missing evidence behavior:
  - if an `owner_full` import references required evidence that is missing, reject the pack and report `missing_references`
  - if a `public_safe` export intentionally withholds evidence, the payload must use `withheld = true` and `withheld_reason`, and the pack remains non-importable as trusted owner proof

### Visibility Rules

- Default visibility is private. New packs default to `owner_only` unless explicitly changed by the owner.
- Pack-level visibility is the maximum outward visibility. Child evidence can narrow visibility but never widen it.
- `public_safe` exports and public product surfaces must apply field visibility before serialization.
- Public-safe behavior:
  - include only public-safe top-level fields and public-safe child items
  - withhold hidden evidence rather than leaking private metadata
  - never expose private filenames, hidden URLs, private verifier identity, internal moderation notes, or hidden source references
- Private-by-default behavior:
  - `owner_user_id`, `source_submission_id`, internal provenance references, and non-public verifier detail are owner-only unless a later policy explicitly marks them public-safe
- If a pack is public but a child evidence item is more private, the child item must be withheld from public surfaces and public exports without widening visibility through pack membership.

### Public Portfolio Relationship

- Public portfolio pages render Proof Packs as public-safe portfolio cards derived from the canonical Proof Pack object.
- Public cards may show only:
  - `title`
  - `summary`
  - allowed `capability_tags`
  - visible `outcomes`
  - freshness state
  - active positive trust cues allowed by the verification policy
- Public cards must not expose:
  - private evidence content
  - hidden evidence counts that reveal withheld material
  - hidden source links
  - verifier PII
  - internal provenance or moderation notes
- Hidden or private child evidence is withheld entirely from public portfolio pages. Public pages must not render a broken placeholder, private filename, or direct asset URL for withheld evidence.

### API / Data Model Implications

- Proof Pack read APIs must expose the canonical Proof Pack DTO with the field names defined in this block.
- Export APIs must support:
  - scope selection: `owner_full` or `public_safe`
  - explicit `export_schema_version`
  - deterministic `portability_hash`
  - `signature_status`
- Import APIs must support:
  - dry-run validation
  - conflict reporting
  - per-pack apply results
- MVP storage may continue to compose the canonical object from:
  - `proof_packs`
  - `proof_pack_items`
  - `proof_artifacts`
  - `verification_records`
  - `submissions`
- If MVP persistence does not yet promote all canonical fields to first-class columns, the API contract still must expose them deterministically from canonical metadata or derived fields.
- The canonical data model implications for MVP are:
  - `freshness_score`, `freshness_updated_at`, `provenance`, `export_schema_version`, `portability_hash`, and `signature_status` become required pack-level contract fields
  - `owner_full` and `public_safe` become explicit export scopes
  - pack-level freshness and signature events become required even if current implementation still emits artifact-level freshness events internally

### Event Tracking

- Required Proof Pack lifecycle and portability events:
  - `proof_pack_created`
  - `proof_pack_updated`
  - `proof_pack_exported`
  - `proof_pack_import_validated`
  - `proof_pack_import_completed`
  - `proof_pack_freshness_changed`
  - `proof_pack_signature_status_changed`
- Required minimum payload fields for these events:
  - `proof_pack_id`
  - `owner_user_id`
  - `scope` when export or import applies
  - `export_schema_version`
  - `portability_hash`
  - previous and next freshness or signature state when applicable
  - reason code or validation result
- Current implementation note:
  - the repo currently emits mostly artifact-level freshness events
  - MVP implementation must add pack-level events or a documented pack-level projection so analytics, QA, and product copy stay aligned with this PRD

### Open Questions

- Post-MVP: should public-safe exports include a stable public owner reference, or should owner identity remain omitted unless the portfolio page itself already publishes it?
- Post-MVP: should detached signatures be generated only on owner_full exports, or on both export scopes?
- Post-MVP: should import conflict resolution offer explicit replace or fork actions, or remain reject-or-skip only?

### Acceptance Criteria

- Exporting the same unchanged Proof Pack twice produces the same `portability_hash`.
- Changing any hashed field changes the `portability_hash`.
- Changing excluded transport metadata does not change the `portability_hash`.
- A `public_safe` export never includes private child evidence or verifier PII.
- A `public_safe` export cannot be imported as a trusted owner pack.
- Dry-run validation reports missing evidence, version incompatibility, and ID or hash conflicts deterministically.
- A stale pack remains visible historically but is marked stale and stops satisfying fresh-proof gates.
- A pack with private child evidence still renders publicly using only allowed pack-level and child-level fields.
- Public portfolio cards never leak hidden filenames, URLs, source references, or private verifier detail.
- Event names, acceptance bullets, and API implications remain consistent with the canonical analytics taxonomy in this PRD.

## 5.5 Verification, Provenance, Badges, and Proof Ladder (MVP)

This block defines the MVP evidence-layer trust model. It is narrower than KYC, background checks, sanctions screening, legal identity certification, or compliance certification. It explains how Proofound produces conservative trust cues inside the existing coarse models of profile readiness, user trust tier, and Proof Pack verification status. It does not replace those coarse product-level states.

### 5.5.1 Verification goals

- reduce false signal by keeping every trust cue scoped to a person, claim, artifact, org relationship, or engagement record
- increase explainability by stating what each badge means, what it does not mean, and where it was earned
- preserve user control and privacy by keeping sensitive evidence private by default and only exposing concise public-safe summaries
- keep verification incremental, not blocking all use, so users can publish, browse, and improve trust over time

### 5.5.2 State model

The MVP trust model has three layers that operate together:

- **verification type**
  - `self-claimed`
  - `peer-attested`
  - `org-verified`
  - `human-reviewed`
  - `auto-checks-passed`
- **verification record state**
  - `pending`
  - `active`
  - `stale`
  - `expired`
  - `declined`
  - `contradicted`
  - `revoked`
  - `corrected`
- **proof rung**
  - `Claim`
  - `Proof`
  - `Deep Case`

Interpretation rules:

- Every claim, artifact, or engagement record starts as `self-claimed` with record state `active` once the owner saves it.
- A request for peer, org, human, or automated review creates a separate verification record in `pending`.
- A successful verification completes as `active` under one of the four non-self verification types.
- Freshness moves `active -> stale -> expired` by rule without deleting history.
- Any non-self active record may move to `contradicted`, `revoked`, or `corrected`.
- Corrections append a new record and preserve prior history. Corrections do not overwrite or erase prior verification records.

Coarse-state interaction rules:

- User trust tier remains the coarse user-level summary.
- Proof Pack verification status remains the coarse pack-level summary.
- Badge evidence informs those summaries conservatively:
  - `unverified` user trust tier persists unless active workplace-linked or identity-linked evidence exists under the existing user-trust rules
  - `unverified` Proof Pack verification status applies when a pack has no active scoped non-self verification evidence
  - `partially_verified` applies when some scoped items in the pack have active non-self verification evidence but coverage is incomplete
  - `verified` applies only when the pack meets the pack-level threshold for active scoped verification coverage
  - `disputed` applies when a material contradiction or dispute suppresses active positive pack-level trust
- The badge layer is more granular than the coarse states and must not be flattened into a single public claim of "verified."

### 5.5.3 Verification types and badge semantics

Public rule:

- Public surfaces show only active, positive, privacy-safe badges.
- `self-claimed` is visible to the owner and authorized review surfaces, but it is not shown as a public trust badge.
- `declined`, `contradicted`, `revoked`, `corrected`, `stale`, and `expired` are visible in owner and authorized review surfaces only unless a muted public-safe freshness summary is explicitly needed later.

#### `self-claimed`

- Means:
  - the owner created the claim, artifact, or engagement record directly
  - Proofound has a provenance trail to the submitting account and timestamp
- Does not mean:
  - independent validation
  - proof of authorship, identity, employment, contract completion, or factual accuracy
- Appears in UI:
  - owner profile
  - Proof Pack editor and detail views
  - authorized org review detail views when deeper evidence context is allowed

#### `peer-attested`

- Means:
  - an eligible peer attested to a scoped claim, outcome, role contribution, or engagement fact based on direct knowledge
  - the attestation applies only to the specific item or statement it references
- Does not mean:
  - platform endorsement of the entire profile
  - legal identity confirmation
  - current employment confirmation
  - enterprise-grade reference checking
- Appears in UI:
  - Proof Pack detail
  - matching evidence summaries when the attested item is visible
  - org review trust panels
  - public portfolio only when the attested item is public and the attestation is still active

#### `org-verified`

- Means:
  - a verified organization representative or eligible org-controlled channel confirmed a scoped relationship, role, assignment, or engagement fact
  - acceptable MVP examples include domain-confirmed work email, verified org-admin confirmation, or authorized org attestation on a specific claim
- Does not mean:
  - government registry certification
  - payroll verification
  - compliance clearance
  - proof of every title, duty, or date on the profile
- Appears in UI:
  - owner verification settings
  - Proof Pack header or claim rows when the org-linked fact is in scope
  - org review trust panels
  - public portfolio only as a concise active trust summary

#### `human-reviewed`

- Means:
  - a Proofound internal reviewer manually assessed submitted evidence and marked a scoped item as sufficiently corroborated for MVP trust purposes
  - the review decision is attached to a specific claim, artifact, or engagement record
- Does not mean:
  - legal certification
  - compliance approval
  - a promise that no future contradiction will arise
- Appears in UI:
  - owner verification history
  - org review trust panels
  - public portfolio or matching only as a narrow badge if the reviewed item is active and public-safe

#### `auto-checks-passed`

- Means:
  - Proofound ran machine-verifiable integrity or provenance checks and the item passed those checks
  - acceptable MVP examples include domain control, token proof, link reachability at check time, file integrity consistency, or metadata consistency checks
- Does not mean:
  - truth of the full narrative
  - authorship
  - legal identity
  - hard fraud detection guarantees
- Appears in UI:
  - owner verification detail
  - Proof Pack artifact rows
  - org review trust panels
  - public portfolio only when the check is active and safe to summarize briefly

### 5.5.4 Verification source model

#### Who can verify what

- Owner:
  - can create `self-claimed` items only
- Eligible peers:
  - can create `peer-attested` records for scoped claims, contribution narratives, outcomes, or engagement facts they directly observed
- Verified org representatives:
  - can create `org-verified` records for scoped org-linked facts such as role relationship, assignment participation, or engagement confirmation
- Proofound internal reviewers:
  - can create `human-reviewed` records for scoped claims, artifacts, or engagement evidence
- Platform systems:
  - can create `auto-checks-passed` records for system-verifiable checks only

#### Attestor eligibility rules

- A peer attestor must:
  - have a valid account or secure attestation token
  - attest to a specific claim or engagement fact, not a whole profile
  - provide a relationship basis such as collaborator, manager, client, or teammate
- An org attestor must:
  - be an authorized representative of the relevant organization or verify control of an approved org channel
  - attest only to facts the organization can reasonably confirm
- Internal reviewers must:
  - act through authenticated reviewer tooling
  - use scoped reason codes rather than free-form public comments

#### Conflict-of-interest rules

- Users cannot verify themselves beyond `self-claimed`.
- Family members, duplicate accounts, or accounts controlled by the same natural person are ineligible as peer attestors.
- An org attestor cannot verify a fact if they are not authorized for the relevant org context.
- Internal reviewers cannot approve their own submitted evidence.

#### Duplicate and contradictory attestation handling

- Duplicate attestations for the same item from the same attestor are merged into the newest active record and older duplicates become superseded history.
- Multiple positive attestations may coexist when they come from distinct eligible attestors.
- Contradictory evidence does not silently average out.
- When contradiction is material, the affected active badge is removed from public and matching surfaces immediately and the record moves to `contradicted` or remains `pending` under review.

#### Revocation and correction flow

- Revocation is used when a prior verification should no longer be trusted.
- Correction is used when the core fact remains valid but the prior verification record needs amendment.
- Both flows append new history, preserve prior records, and emit explicit lifecycle events.

### 5.5.5 Verification flow and transitions

Canonical flow:

1. Owner creates a claim, artifact, or engagement record.
2. The item is stored as `self-claimed(active)`.
3. A peer request, org request, human review request, or automated check creates a new verification record in `pending`.
4. Successful completion creates one of:
   - `peer-attested(active)`
   - `org-verified(active)`
   - `human-reviewed(active)`
   - `auto-checks-passed(active)`
5. Freshness rules move the record to `stale`, then `expired`, if not refreshed.
6. A dispute, contradiction, or policy issue may move the record to `contradicted` or `revoked`.
7. A correction appends a new `corrected` record plus a new current active record when applicable.

Freshness defaults for MVP:

- `peer-attested`: active for 24 months, then `stale`, then `expired`
- `org-verified`: active for 12 months unless refreshed sooner by a newer org-controlled check
- `human-reviewed`: active for 24 months unless underlying evidence changes materially
- `auto-checks-passed`: freshness depends on check class, but it must downgrade at the moment the underlying machine-verifiable signal is no longer valid
- `self-claimed`: no expiry, but it does not count as a positive trust anchor

Material-change rule:

- If the owner edits evidence materially after a non-self verification was earned, the prior non-self record becomes non-current. The item returns to `self-claimed(active)` plus a historical superseded verification trail until refreshed or re-reviewed.

### 5.5.6 Proof Ladder

#### `Claim`

- Qualifies when:
  - a narrative, artifact, or engagement fact exists
  - only `self-claimed` or shallow automated provenance checks exist
- Effect:
  - the item is usable, shareable, and reviewable
  - it does not satisfy stronger verification gates by itself

#### `Proof`

- Qualifies when:
  - at least one scoped non-self verification is active
  - or an acceptable MVP evidence bundle exists, such as a signed agreement upload plus a consistent engagement record
- Effect:
  - the item may satisfy assignment verification gates if the gate asks only for scoped proof
  - matching trust and ranking may improve

#### `Deep Case`

- Qualifies when:
  - the item already qualifies as `Proof`
  - and includes meaningful context, outcome detail, and corroborating evidence strong enough for higher-confidence review
- Effect:
  - the item supports stronger explainability and higher review confidence
  - it does not create a new legal or compliance status

Freshness and nudging rules:

- Stale items remain visible privately and historically auditable.
- Stale items should trigger owner nudges to refresh, deepen, or replace the evidence.
- Freshness affects ranking, gate satisfaction, and public trust summaries before it affects storage or audit retention.

### 5.5.7 Verification gates for matching and intro

#### Hard block

- A required verification gate blocks intro creation when the required item is:
  - missing
  - still `pending`
  - `expired`
  - `contradicted`
  - `revoked`
- Hard blocks apply only when the assignment or workflow explicitly requires that verification type or proof rung.

#### Lowers trust or ranking only

- `self-claimed` only evidence
- `stale` verification
- unverifiable external proof links
- incomplete `Deep Case` context when only `Proof` level exists
- positive but narrow verification that does not cover the exact claim in question

#### Informational only

- reviewer notes
- source mix
- superseded historical records
- prior declines that no longer control the active state

### 5.5.8 Contract and engagement verification

Minimum viable acceptable proofs in MVP:

- mutual attestation from both sides on the same engagement record
- uploaded signed agreement or uploaded sent agreement evidence
- uploaded invoice, statement of work, offer letter, or equivalent engagement artifact
- a matching combination of an org confirmation plus a candidate confirmation on the same engagement fact

Interpretation rules:

- Mutual attestation is acceptable MVP proof for engagement confirmation, but it is not legal contract enforcement.
- Uploaded evidence may strengthen or replace missing mutual attestation if the reviewer or org confirmation path supports it.
- Later integrations such as DocuSign, HRIS, payroll, background checks, and hard identity checks are post-MVP only.

### 5.5.9 Auditability and public trust layer

Auditability rules:

- Verification history is append-only and immutable in practice.
- Each state transition keeps actor class, timestamp, scoped subject, prior state, new state, and reason code.
- History is never deleted just because the current badge is no longer active.

Visibility rules:

- Full verification detail is visible to:
  - the owner
  - authorized org reviewers in the relevant workflow context
  - internal reviewers and admins
- The public sees only:
  - concise active badge summaries
  - scoped public-safe trust language
  - no private notes, reviewer comments, or sensitive evidence text

### 5.5.10 Edge cases

#### Expired attestations

- An expired attestation stops counting as an active trust signal immediately.
- Historical detail remains visible privately.

#### Unverifiable external links

- If a link cannot be reached or no longer resolves to reviewable evidence, any dependent `auto-checks-passed` record expires or is contradicted based on severity.
- The underlying item may remain `self-claimed`.

#### Reviewer disagreement

- Disagreement between reviewers or between review sources removes the public active badge for the affected scope until a current resolution exists.
- Authorized review surfaces show mixed evidence rather than fabricating certainty.

#### Malicious verification attempts

- Suspicious attestation or org-verification attempts move to internal review and do not create a public-positive badge.
- Proven abuse can revoke the affected verification record and invalidate the attestor path.

#### Withdrawn evidence

- If the owner withdraws or deletes the underlying evidence, the related positive badge stops contributing to public trust immediately.
- Audit history remains, but the current item no longer qualifies for active proof.

### 5.5.11 Facts & Decisions

- MVP uses incremental verification, not all-or-nothing account approval.
- Hard verification, KYC, compliance certification, payroll checks, and enterprise reviewer ops are out of scope for MVP.
- Badge names shown to users are exactly:
  - `self-claimed`
  - `peer-attested`
  - `org-verified`
  - `human-reviewed`
  - `auto-checks-passed`
- Existing coarse product states remain unchanged:
  - user trust tier: `unverified`, `workplace_verified`, `identity_verified`
  - Proof Pack verification status: `unverified`, `partially_verified`, `verified`, `disputed`
- Badge evidence informs those coarse states, but does not rename them.
- Public trust remains conservative. Public surfaces show concise active positives only.

### 5.5.12 Open Questions

- Whether some `auto-checks-passed` classes should have shorter freshness windows by check type after launch
- Whether reviewer disagreement needs a dedicated post-MVP reviewer arbitration queue
- Whether certain org-verification paths should require stronger authorization proofs in post-MVP org-admin tooling
- Whether Deep Case should eventually surface a richer private rubric to reviewers without changing public semantics

### 5.5.13 Acceptance Criteria

- Scenario: a user adds a case study with no external verification.
  - Result: the item is `self-claimed(active)`, qualifies for `Claim`, is shareable, and does not satisfy a hard verification gate by itself.
- Scenario: an eligible collaborator confirms one specific outcome.
  - Result: the scoped item earns `peer-attested(active)`, may qualify as `Proof`, and does not silently upgrade unrelated claims.
- Scenario: an org admin confirms the candidate worked on a specific assignment.
  - Result: the scoped item earns `org-verified(active)` and may satisfy an org-required gate if that gate asked for org-linked confirmation.
- Scenario: an internal reviewer checks uploaded agreement evidence.
  - Result: the engagement record earns `human-reviewed(active)` and remains explicitly narrower than legal certification.
- Scenario: a platform provenance check passes on an uploaded artifact.
  - Result: the artifact earns `auto-checks-passed(active)`, but the PRD still states that this does not prove authorship or truth of the entire narrative.
- Scenario: a required verification gate is still pending at intro time.
  - Result: intro is blocked and the system records a verification-gate failure rather than silently lowering rank only.
- Scenario: an attestation becomes stale.
  - Result: it stops boosting trust and gate satisfaction, remains visible privately, and triggers a refresh nudge.
- Scenario: contradictory evidence arrives after a badge was active.
  - Result: the public badge is removed immediately for the affected scope, history remains auditable, and the record moves to `contradicted` or internal review.
- Scenario: evidence is corrected.
  - Result: the correction appends new history rather than overwriting the prior record.
- Scenario: a public portfolio is rendered.
  - Result: only active, positive, privacy-safe badges are shown; private notes and reviewer comments never render publicly.

## 5.6 Match and Reveal Lifecycle

### Match state

- `generated`
- `shortlisted`
- `passed`
- `intro_in_progress`
- `interview_in_progress`
- `closed`

### Side states

- `stale`
- `hidden_due_to_policy`

### Reveal stages

- `stage0_anonymous`
- `stage1_capability_and_proof`
- `stage2_contextual_reveal`
- `stage3_intro_approved`
- `stage4_interview_coordination`

Rules:

- Stage 0 and Stage 1 are the default org review corridor.
- Identity-bearing reveal requires the appropriate stage and consent path.
- Public portfolio publication does not override reveal restrictions.

## 5.7 Intro Lifecycle

- `created`
- `accepted`
- `declined`
- `expired`
- `withdrawn`
- `closed`

Rules:

- Intros are created only after qualification and reveal rules pass.
- Expired or withdrawn intros remain auditable.

## 5.8 Interview Lifecycle

- `scheduled`
- `rescheduled`
- `completed`
- `no_show`
- `cancelled`

Rules:

- A canceled interview may be replaced by a new interview for the same match.
- Schedule, reschedule, and cancel updates are posted into the related thread as user-visible context.

## 5.9 Feedback Follow-up Lifecycle

- `not_due`
- `due`
- `submitted`
- `breached`
- `closed`

Rules:

- Feedback follow-up begins after interview completion.
- The default policy is a **48-hour feedback follow-up**.
- Status must be visible to both relevant participants at the correct scope.

## 5.10 Public Portfolio Distribution Lifecycle

- `disabled`
- `eligible_not_enabled`
- `enabled`
- `blocked_by_safety`
- `depublished`

Rules:

- Public portfolios are shareable by direct link when enabled.
- Indexing is controlled separately from publication and is off by default.
- Safety rules may block or depublish a public surface.
- Public-view data remains internal diagnostics only and never becomes an owner-facing vanity counter.

---

## 6. Matching and Privacy Contract

### 6.1 What Blind-by-Default Means

Early review must not expose:

- full name
- photo
- direct social links
- public portfolio URL
- exact location
- contact details
- employer or school names when those are identity-bearing
- demographic or inferred bias-sensitive signals

### 6.2 What Reviewers May See Early

Stage 0 and Stage 1 may include only:

- anonymized candidate label
- skill clusters and capability summaries
- Proof Pack summaries
- outcome evidence summaries
- broad constraints fit
- coarse verification and trust-safe status language
- rank band or qualitative fit state where allowed

### 6.3 Visibility and Redaction

- Field-level visibility applies everywhere.
- Redaction is a control that affects previews and allowed renders.
- Hidden fields must not leak copy actions, deep links, filenames, metadata, or identity-bearing preview data.
- Manually uploaded artifacts with identifying metadata must render as sanitized, withheld, or requires-review until a later allowed reveal stage.

### 6.4 Public Portfolio Interaction with Matching

- Public portfolios are explicit publication surfaces.
- Matching review must not expose a direct portfolio route, handle, or identity-bearing URL before the allowed reveal stage.
- Sanitized Proof Pack summaries may appear in matching without exposing the public route.

### 6.5 Explainable Matching Reason Codes, Overrides, and Fairness Ledger (MVP)

This section defines the MVP contract for deterministic shortlist explanations, reviewer overrides, and fairness-audit traceability. It extends the current repo enum style and must not introduce a second naming system.

#### Facts & Decisions

- One canonical explainability record must exist for every shortlist decision, pass decision, intro-eligibility block, reveal denial, assignment closure or expiry effect, and manual snooze or override.
- The canonical explainability record uses these fixed fields:
  - `reason_group`
  - `reason_code`
  - `decision_surface`
  - `decision_state`
  - `source`
- `reason_code` values must stay concise, reusable, and analytics-safe.
- Reasons are append-only in the ledger. Manual actions add to system-generated reasons and must not erase the original system reasons.
- The explanation order is deterministic and fixed:
  1. capability
  2. proof
  3. freshness
  4. verification
  5. availability
  6. timezone or language
  7. compensation
  8. privacy or reveal
  9. assignment state
  10. manual decision
  11. fairness or policy
- Tie scores must resolve deterministically using the canonical tie-break order already stored in the score trace. The same structured inputs must produce the same rank order and the same ordered reason list.

#### Canonical reason-code taxonomy

```ts
type ReasonGroup =
  | 'capability'
  | 'proof'
  | 'freshness'
  | 'verification'
  | 'availability'
  | 'timezone_language'
  | 'compensation'
  | 'privacy_reveal'
  | 'assignment_state'
  | 'manual_decision'
  | 'fairness_policy';

type MatchReasonCode =
  | 'skills_strong'
  | 'skills_gap'
  | 'proof_coverage_insufficient'
  | 'proof_stale'
  | 'proof_expired'
  | 'verification_ready'
  | 'verification_gap'
  | 'availability_mismatch'
  | 'logistics_fit'
  | 'timezone_mismatch'
  | 'language_fit'
  | 'language_mismatch'
  | 'compensation_fit'
  | 'compensation_mismatch'
  | 'reveal_not_granted'
  | 'reveal_shortlist_identity'
  | 'reveal_full_identity'
  | 'assignment_closed'
  | 'assignment_expired'
  | 'shortlist_selected'
  | 'passed_for_now'
  | 'rejected_constraints'
  | 'snoozed_manual'
  | 'override_keep_under_review'
  | 'override_shortlist_manual'
  | 'override_reject_manual'
  | 'fairness_warning_active'
  | 'fairness_ranking_suppressed';
```

- Capability mismatch:
  - `skills_gap`
- Proof insufficiency:
  - `proof_coverage_insufficient`
- Freshness too low:
  - `proof_stale`
  - `proof_expired`
- Verification gate unmet:
  - `verification_gap`
- Availability mismatch:
  - `availability_mismatch`
- Timezone or language mismatch:
  - `timezone_mismatch`
  - `language_mismatch`
- Compensation mismatch:
  - `compensation_mismatch`
- Privacy or reveal not granted:
  - `reveal_not_granted`
- Assignment closed or expired:
  - `assignment_closed`
  - `assignment_expired`
- Manual pass, snooze, or override:
  - `passed_for_now`
  - `snoozed_manual`
  - `override_keep_under_review`
  - `override_shortlist_manual`
  - `override_reject_manual`

The existing positive-fit codes such as `skills_strong`, `verification_ready`, `logistics_fit`, `compensation_fit`, `language_fit`, `purpose_alignment_strong`, `purpose_alignment_partial`, `focus_role`, `focus_industry`, and `focus_org_type` remain valid. MVP uses them to explain why a shortlist exists, while the mismatch and state codes explain why a shortlist, intro, or reveal did not advance.

#### Match outcomes, shortlist decisions, intro eligibility, and pass or rejection states

- Match outcome reasons explain whether the candidate is a strong fit, a partial fit, or a blocked fit.
- Shortlist decision reasons explain why the candidate was shortlisted, passed for now, rejected, or manually snoozed.
- Intro eligibility reasons explain whether the match may proceed into intro creation or remains blocked on proof, freshness, verification, availability, privacy, or assignment state.
- Rejection and pass states must always include at least one canonical blocker code and may include supportive positive codes if they clarify what was strong.

#### Automatic vs manual generation rules

- Generated automatically when the reason is derivable from:
  - structured assignment inputs
  - structured profile inputs
  - proof freshness state
  - verification status
  - reveal policy
  - fairness status
  - assignment lifecycle state
- Selected manually only for:
  - `passed_for_now`
  - `snoozed_manual`
  - `override_keep_under_review`
  - `override_shortlist_manual`
  - `override_reject_manual`
  - explicit reveal or policy exceptions that are not produced by the normal rules path
- Manual selection requires one canonical manual code and an internal justification.
- Manual notes are private. They may be hashed and audited, but they must not be shown to the counterpart.

#### User-facing behavior

- Individuals see:
  - plain-language top reasons only
  - the next best action
  - current reveal or intro status
  - no internal reviewer notes
  - no protected-signal language
- Organizations see:
  - ranked or banded rationale where policy allows
  - blockers and intro-eligibility state
  - no hidden personal notes
  - no protected-class or inferred protected-signal language
  - no hidden field values when the field itself is not revealable
- Admins and auditors see:
  - the full reason ledger
  - source and actor
  - timestamps
  - score, model, and weight versions
  - tie-break trace
  - reveal-stage transitions
  - override counts
  - fairness snapshot references

#### Override system

- Allowed override actors:
  - organization `owner`
  - organization `admin`
  - organization `member`
- Not allowed:
  - organization `viewer`
  - platform admins performing routine shortlist preference changes
- Platform admins remain limited to fairness remediation, policy remediation, and audit surfaces.
- Override is allowed only when:
  - the assignment is still open
  - the match is still live
  - the override does not bypass protected-class boundaries
  - the override does not expose hidden notes or hidden identity outside the allowed reveal corridor
- Mandatory override justification rules:
  - exactly one override reason code
  - non-empty internal justification text
  - actor and role recorded
  - previous state and new state recorded
  - previous reveal scope and new reveal scope recorded
- Audit logging requirements:
  - log to the reason ledger
  - log the private note hash
  - retain the full private note in a private audit surface only
  - emit the existing lifecycle override event
- Overrides affect analytics and fairness notes:
  - override counts are reported separately from system decisions
  - fairness reviews must be able to segment override-heavy assignments
  - override-driven outcomes must not be blended silently into system-only quality claims

#### Fairness ledger requirements

- Each decisionable match must be auditable through a deterministic ledger that includes at minimum:
  - `score_version`
  - `model_version`
  - `weights_version`
  - `inputs_hash`
  - `tie_break_vector`
  - `reason_codes`
  - `decision_surface`
  - `decision_state`
  - `source`
  - `override_count`
  - `reveal_stage`
  - `fairness_status`
  - `fairness_snapshot_id`
- The ledger must support:
  - versioned scoring-weight review
  - reason-code distribution reporting
  - override count reporting
  - reveal-stage transition logging
  - cohort reporting hooks for approved internal fairness audit slices only
- Fairness ledger outputs are internal only and must never expose protected attributes on counterpart-facing surfaces.

#### Privacy boundaries

- No protected-class leakage in explanations, analytics payloads, or counterpart-facing logs.
- No hidden personal notes shown to the other side.
- Hidden fields may influence score only when matching consent and policy allow it, and the explanation must stay generic if the field value itself cannot be revealed.
- Reveal-stage movement must never imply that public portfolio publication overrides blind-by-default review.

#### "Why this match" UX contract

- Explanations must be plain language.
- Explanation ordering must follow the canonical deterministic order above.
- No black-box phrasing such as "the model thinks" or "the algorithm decided."
- No numeric decomposition promise to the user.
- No exact comparative language when fairness suppression is active.
- The explanation should answer:
  - what was strong
  - what is missing or blocked
  - what the next best step is

#### Edge cases

- Empty shortlist:
  - show a calm empty state with explicit blocker reasons
  - log the shortlist decision surface and at least one blocker code
- Tie scores:
  - resolve through the canonical tie-break vector
  - preserve the same explanation order for tied candidates
- Stale proofs:
  - `proof_stale` reduces confidence and must appear before any manual decision reason
- Expired proofs:
  - `proof_expired` blocks stronger intro language until refreshed or replaced
- Hidden fields needed for better scoring:
  - scoring may use them when permitted
  - explanation must refer to a generic stored constraint or requirement rather than exposing the hidden field value

#### Events and analytics mapping

| Requested concept                 | MVP mapping                                                          |
| --------------------------------- | -------------------------------------------------------------------- |
| `match_reason_code_generated`     | `match_generated` plus `match_reason_ledger` insert                  |
| `shortlist_decision_logged`       | `match_shortlisted` or `match_passed` plus review-state ledger write |
| `override_applied`                | `review_override_applied`                                            |
| `override_revoked`                | `review_override_reverted`                                           |
| `reveal_stage_changed`            | `reveal_requested` plus `reveal_granted` or `reveal_denied`          |
| `fairness_audit_snapshot_created` | fairness evaluation snapshot persisted in `fairness_evaluations`     |

#### Example API payloads

```json
{
  "match_id": "9a5c6d63-5a8f-4f2d-b20a-4d67f7d3ef91",
  "assignment_id": "f0fb23a3-d601-40ce-b0c7-4f320d5ef6bb",
  "decision_surface": "org_review_queue",
  "decision_state": "shortlisted",
  "source": "system",
  "reason_codes": ["skills_strong", "verification_ready", "shortlist_selected"],
  "weights_version": "core-rules/v1",
  "inputs_hash": "6df0d3d64b7d1f45c3c4d5a0d88b44f58d40f6a3b1e9185df21d4bbf5d5f928a"
}
```

```json
{
  "match_id": "9a5c6d63-5a8f-4f2d-b20a-4d67f7d3ef91",
  "assignment_id": "f0fb23a3-d601-40ce-b0c7-4f320d5ef6bb",
  "decision_surface": "org_review_queue",
  "decision_state": "shortlisted",
  "source": "reviewer",
  "override_reason_code": "override_shortlist_manual",
  "justification": "Candidate has recent private proof under review that is not yet reflected in the automated score.",
  "previous_state": "blind_review",
  "new_state": "shortlisted",
  "previous_reveal_scope": "blind",
  "new_reveal_scope": "shortlist_identity",
  "fairness_impact_flag": true
}
```

#### Open Questions

- Should `proof_coverage_insufficient` replace older wording such as `proof_strength_incomplete` everywhere later, or can those remain parallel for feedback-only surfaces?
- Should `timezone_mismatch` and `language_mismatch` remain separate codes in live scoring, or collapse into a single `communication_mismatch` if code churn becomes too high?
- Should fairness snapshot creation get its own first-class lifecycle event later, or remain a persisted-table contract only for MVP?

#### Acceptance Criteria

- Every shortlist, pass, rejection, intro block, reveal denial, assignment closure, and manual snooze produces at least one canonical reason code and a ledgered decision record.
- The same structured inputs produce the same reason-code order and tie-break result.
- Overrides cannot be saved without an allowed actor, one override code, and a non-empty internal justification.
- Counterpart-facing surfaces never expose internal notes, protected-class data, or hidden personal notes.
- "Why this match" explanations remain plain-language, deterministic, and non-comparative.
- Fairness review can inspect reason distributions, override counts, reveal transitions, and versioned score or weight metadata without reconstructing raw decision history.
- Empty shortlist, stale proof, tie score, and reveal-blocked states all have explicit user-facing copy and logged reason codes.

---

## 7. Metrics and Analytics Contract

## 7.1 Canonical KPI Definitions

- **TTSC**
  - Median elapsed time from activation to signed contract.
- **TTFQI**
  - Median elapsed time from activation to first qualified intro.
- **TTV**
  - Median elapsed time from activation to first meaningful step such as an interview scheduled or accepted async task.
- **PAC**
  - Purpose-Alignment Contribution inside matching and explanation only.
- **SUS**
  - Launch usability benchmark for activation, assignment publishing, and match review.
- **Fairness note status**
  - Release-level state: `published` or `insufficient_data`

These are the only launch KPIs promised across the PRD.

## 7.2 User-Facing vs Internal Analytics

### User-facing

- Individuals see a Home snapshot with status and next-best actions.
- Organizations see an Assignments and Matches queue with operational follow-up state.
- No user-facing surface includes public view counters, leaderboards, streaks, or BI-style analytics.

### Internal-only

- TTSC
- TTFQI
- TTV
- PAC
- SUS
- fairness note status
- activation, publish, intro, interview, and feedback follow-up operational health

## 7.3 Canonical Event Taxonomy

### Account and onboarding

- `account_signed_up`
- `individual_onboarding_completed`
- `organization_onboarding_completed`

### Public portfolio distribution

- `portfolio_shared`
- `portfolio_public_viewed`
- `portfolio_indexing_state_changed`

### Proof Packs and trust evidence

- `proof_pack_created`
- `proof_pack_updated`
- `proof_pack_ready`
- `proof_pack_published`
- `proof_pack_submitted`
- `proof_pack_withdrawn`
- `proof_pack_superseded`
- `proof_pack_exported`
- `proof_pack_import_validated`
- `proof_pack_import_completed`
- `proof_pack_verification_requested`
- `proof_pack_verification_completed`
- `proof_pack_verification_expired`
- `proof_pack_verification_downgraded`
- `proof_pack_freshness_changed`
- `proof_pack_signature_status_changed`
- `verification_record_created`
- `verification_request_submitted`
- `verification_auto_check_passed`
- `verification_auto_check_failed`
- `verification_human_review_completed`
- `attestation_requested`
- `attestation_completed`
- `attestation_declined`
- `verification_contradicted`
- `verification_corrected`
- `verification_revoked`
- `proof_ladder_promoted`
- `proof_refresh_nudged`
- `user_trust_tier_changed`

### Matching and reveal

- `match_generated`
- `match_shortlisted`
- `match_passed`
- `match_hidden_due_to_policy`
- `reveal_stage_viewed`
- `reveal_stage_advanced`
- `reveal_requested`
- `reveal_granted`
- `reveal_denied`

### Intro lifecycle

- `intro_created`
- `intro_accepted`
- `intro_declined`
- `intro_expired`
- `intro_withdrawn`
- `intro_blocked_by_verification`

### Interview and feedback follow-up

- `interview_scheduled`
- `interview_rescheduled`
- `interview_completed`
- `interview_cancelled`
- `interview_no_show_marked`
- `feedback_follow_up_due`
- `feedback_follow_up_submitted`
- `feedback_follow_up_breached`

### Organization workflow

- `org_trust_profile_updated`
- `org_trust_tier_changed`
- `assignment_draft_saved`
- `assignment_published`
- `org_sensitive_domain_review_queued`
- `assignment_blocked_by_safety`
- `org_review_queue_viewed`
- `org_flagged_for_abuse`
- `candidate_invite_sent`
- `candidate_invite_claimed`
- `proof_card_submitted`
- `verification_gate_failed`

### Zen Hub private partition

- `zen_opt_in_changed`
- `zen_checkin_submitted`
- `zen_reflection_saved`
- `zen_export_requested`
- `zen_export_completed`
- `zen_delete_completed`

## 7.4 Event Privacy Rules

- No PII in analytics properties.
- No raw message bodies.
- No feedback text.
- No Zen reflection text.
- No direct public viewer identity.
- No precise location.
- No protected attributes in event payloads.
- Zen events stay in a private partition.

## 7.5 Metric to Event Mapping

- **Activation completion**
  - `individual_onboarding_completed`, `organization_onboarding_completed`, readiness transitions to `Match-visible`
- **Share readiness and usage**
  - `portfolio_shared`, `portfolio_indexing_state_changed`
- **TTFQI**
  - `intro_created`
- **TTV**
  - `interview_scheduled` or equivalent meaningful-step event
- **TTSC**
  - contract-attestation or signed-contract event recorded in the operational pipeline that closes the intro or assignment corridor
- **48-hour feedback follow-up compliance**
  - `feedback_follow_up_due`, `feedback_follow_up_submitted`, `feedback_follow_up_breached`
- **Org trust and safety operations**
  - `org_trust_tier_changed`, `org_sensitive_domain_review_queued`, `assignment_blocked_by_safety`, `org_flagged_for_abuse`
- **Fairness note status**
  - derived from release-level event aggregation only when privacy thresholds pass

## 7.6 Trust, Proof Quality, and Verification Lifecycle Analytics (MVP)

### Purpose

- The MVP analytics plan must measure not only speed and workflow movement, but also whether Proofound is producing trustworthy, reusable, verifiable proof.
- Trust and proof-value analytics are internal launch instrumentation, not a license to turn the product into a BI surface.
- This block extends TTSC, TTFQI, TTV, PAC, SUS, and fairness note status with first-class proof quality, verification, freshness, and trust lifecycle metrics.

### Proof Quality Score (MVP)

- MVP uses one compact **Proof Quality Score** from `0-100`.
- The score is intentionally simple and equal-weighted across five understandable dimensions:
  - **evidence completeness**
  - **verifiability**
  - **outcomes clarity**
  - **freshness**
  - **artifact clarity / structure**
- Each dimension is scored as:
  - `0`
    - missing, weak, or unusable
  - `10`
    - partial or acceptable
  - `20`
    - strong or launch-grade
- The Proof Quality Score is the sum of the five dimension scores.
- Score bands:
  - `0-39`
    - weak
  - `40-69`
    - usable but incomplete
  - `70-84`
    - strong
  - `85-100`
    - excellent
- User-facing product surfaces may show only a guidance band, readiness state, or next-best action by default, not a raw numeric score.
- Internal product and ops dashboards may use the exact score, score distribution, and dimension-level breakdown.
- The Proof Quality Score is a trust-quality heuristic only. It is not a ranking override, not a fairness substitute, and must not bypass verification gates, reveal rules, or privacy policy.

### Time-to-Verified

- **Time-to-Verified**
  - Median elapsed time from `proof_pack_created` to the first successful `verification_record_completed` tied to that Proof Pack or its primary artifact.
- Proof Packs without a completed verification remain in funnel drop-off and do not count as completed for this metric.
- Where implementation currently records verification primarily at the artifact or verification-record layer, Time-to-Verified may be derived by joining Proof Pack lifecycle records to `verification_record_completed`.

### Verification Lifecycle Funnel

The canonical MVP verification lifecycle funnel is:

1. proof created
2. evidence attached
3. attestation requested
4. verification completed
5. proof pack exported / shared
6. proof used in match / intro / interview / contract

Canonical stage-to-event mapping:

- **proof created**
  - `proof_pack_created`
- **evidence attached**
  - `proof_artifact_created`
- **attestation requested**
  - `attestation_requested`, `verification_request_created`
- **verification completed**
  - `verification_record_completed`
- **proof pack exported / shared**
  - `proof_pack_exported`, `portfolio_pdf_export_succeeded`, `portfolio_share_link_copied`
- **proof used in match / intro / interview / contract**
  - `proof_pack_submitted`, `candidate_proof_card_submitted`, `intro_created`, `interview_scheduled`, `contract_signed`
  - downstream events should include `proof_pack_id` or `proof_card_id` when available

MVP may derive some later-stage reuse metrics by joining Proof Pack or Proof Card identifiers into downstream workflow records instead of requiring a brand-new event family for every usage surface.

### Metric Catalog

#### User-facing metrics

- proof freshness state
- verification status
- trust or readiness state
- proof quality guidance band or next-best-action hints only
- public portfolio publication and indexability state

User-facing surfaces remain calm workflow guidance, not dashboards.

#### Internal product metrics

- Proof Quality Score average, distribution, and dimension-level weakness trends
- Time-to-Verified
- verification lifecycle funnel conversion and drop-off
- verification completion, expiry, and failure rates
- proof freshness distribution across `fresh`, `review_soon`, `stale`, `expired`
- proof reuse in qualified intros, interviews, and contracts
- reveal event counts and rates for `reveal_requested`, `reveal_granted`, `reveal_denied`
- intro expiry rate
- interview no-show rate
- public portfolio publication, indexing, share, and public view activity

#### Admin-only trust / audit metrics

- review override and operator override usage by reason code
- verifier integrity status and verification failure patterns
- reveal denials by policy or workflow reason
- audit completeness for proof, reveal, verification, and downstream-use trails
- suspicious, policy-sensitive, or operator-assisted trust events

#### Canonical metric definitions

- **Verification completion rate**
  - `verification_record_completed / verification_request_created`
- **Proof freshness distribution**
  - Share of Proof Packs or qualifying proof artifacts in `fresh`, `review_soon`, `stale`, `expired`
- **Proof reuse in successful matches**
  - Share of successful downstream outcomes where a Proof Pack or Proof Card tied to the eventual match, intro, interview, or contract was actually used
- **Reveal events**
  - counts and rates for `reveal_requested`, `reveal_granted`, `reveal_denied`
- **Intro expiry**
  - expired intros as a share of intros created
- **Interview no-show**
  - no-shows as a share of interviews scheduled
- **Override usage**
  - review overrides and operator overrides as counts, rates, and reason-code breakdowns
- **Public portfolio index / share status**
  - publication state, indexing state, share activity, and public view activity

### Dashboards

Launch analytics must support these internal trust-oriented views:

- **Product trust dashboard**
  - Proof Quality Score distribution
  - Time-to-Verified
  - verification lifecycle funnel
  - freshness distribution
  - proof reuse in successful intros, interviews, and contracts
  - reveal and publication / indexing summary
- **Operations dashboard**
  - verification requests pending, completed, expired, failed
  - stale or expiring proof backlog
  - intro expiry rate
  - interview no-show rate
  - override usage trend
  - publication or indexing incidents and share-state health
- **Admin trust / audit dashboard**
  - override reason breakdown
  - reveal denial reason breakdown
  - verification integrity anomalies
  - audit-trail completeness and reconciliation status

At launch, these remain internal or admin-only dashboards. They are not user-facing BI surfaces.

### Event Taxonomy Updates

This block extends the event taxonomy with payload guidance for trust, proof quality, and verification lifecycle reporting. Where the repo already defines a machine-stable event name, that name wins.

#### Proof events

- Canonical events include `proof_pack_created`, `proof_pack_submitted`, and implementation-level artifact events such as `proof_artifact_created`.
- Minimum property groups:
  - `proof_pack_id`
  - `proof_artifact_id` when applicable
  - `owner_type`
  - `subject_type`
  - `artifact_kind`
  - `visibility`
  - `reveal_gate`
  - `actor_type`
  - `source`

#### Verification events

- Canonical machine-stable events include `verification_request_created`, `verification_request_resent`, `verification_request_expired`, `verification_response_recorded`, `verification_record_completed`, `verification_record_failed`.
- Minimum property groups:
  - `verification_record_id`
  - `verification_kind`
  - `subject_type`
  - `subject_id`
  - `proof_artifact_id`
  - `status`
  - `integrity_status`
  - `expires_in_days`
  - `time_to_verified_hours` when completed

#### Reveal events

- Canonical machine-stable events include `reveal_requested`, `reveal_granted`, `reveal_denied`.
- Minimum property groups:
  - `reveal_event_id`
  - `match_id`
  - `assignment_id`
  - `profile_id`
  - `org_id`
  - `requested_scope`
  - `granted_scope`
  - `trigger_type`
  - `reason_code`
  - `source_surface`
  - `outcome`

#### Workflow outcome events

- Canonical events include `intro_created`, `interview_scheduled`, `contract_signed`, plus machine-stable workflow events such as `intro_workflow_expired` and `interview_no_show_recorded`.
- Minimum property groups:
  - `intro_workflow_id` or `interview_id`
  - `assignment_id`
  - `org_id`
  - `proof_pack_id` or `proof_card_id` when available
  - `from_state`
  - `reason_code`
  - `actor_type`
  - `source`

#### Override events

- Canonical machine-stable events include `review_override_applied`, `review_override_reverted`, `operator_override_logged`.
- Minimum property groups:
  - `match_id` or `target_id`
  - `override_reason_code`
  - `previous_stage`
  - `new_stage`
  - `requested_scope`
  - `actor_type`
  - `source`

#### Public portfolio events

- Canonical machine-stable events include `portfolio_publication_state_changed`, `portfolio_indexing_state_changed`, `portfolio_share_link_copied`, `portfolio_public_viewed`.
- Minimum property groups:
  - `subject_type`
  - `subject_id`
  - `publication_state`
  - `indexing_state`
  - `robots_state`
  - `sitemap_state`
  - `reason_code`
  - `trigger`
  - `source`

Naming note:

- The PRD may describe human-readable metrics such as verification completed, intro expiry, interview no-show, or portfolio publication state.
- The canonical machine-stable event names remain concrete and implementation-safe, including `verification_record_completed`, `intro_workflow_expired`, `interview_no_show_recorded`, and `portfolio_publication_state_changed`.

### Privacy Rules

- No PII in analytics events.
- No raw message text, freeform feedback text, or direct public viewer identity.
- Private Zen data is excluded from trust, product, reveal, and public analytics.
- Demographic data is out of scope unless explicitly opt-in and used only in privacy-safe aggregate form.
- No protected-attribute payloads in routine trust or product event streams.
- Trust and proof-value analytics must not widen reveal scope or backdoor access to identity-bearing data.

### Facts & Decisions

- TTSC, TTFQI, TTV, PAC, SUS, and fairness note status remain the canonical launch KPI family.
- Proof quality, freshness, verification, reuse, reveal, override, and publication metrics now become first-class internal trust metrics for MVP.
- User-facing surfaces remain status and guidance surfaces rather than analytics dashboards.
- Existing machine-stable event names defined in the repo take precedence over looser human-readable phrasing.
- Proof reuse may be measured through a combination of direct event emission and join-based attribution in MVP.

### Open Questions

- Which downstream contract outcome should be treated as the canonical proof reuse success anchor when a workflow reaches both interview and contract stages?
- What tolerance threshold should be enforced for event-to-source reconciliation in launch ETL validation?

### Acceptance Criteria

- Launch dashboards exist for:
  - product trust dashboard
  - operations dashboard
  - admin trust / audit dashboard
- Launch-critical trust events validate against required event schemas.
- Sampled launch-critical trust events contain no forbidden payload classes.
- freshness distribution, verification counts, override counts, and publication states reconcile to source-of-truth tables within a documented tolerance.
- ETL validations confirm:
  - duplicate events are deduplicated idempotently
  - lifecycle ordering remains valid across proof -> verification -> downstream use
  - proof-trust snapshots reconcile with raw events
  - Zen and other private-partition data stay excluded from warehouse and dashboard outputs

## 7.7 Explicit Analytics Exclusions

The MVP analytics contract does not require:

- warehouse refresh jobs as a product acceptance criterion
- ML training-label population
- public analytics surfaces
- owner-facing public view analytics

Those may exist operationally later, but they are not part of the MVP product contract.

---

## 8. Acceptance Criteria

## 8.1 Canonical Vocabulary and Scope

- Proof Pack, artifact, proof, and Proof Card are used consistently with non-overlapping meanings.
- `PRD_for_a_web_platform_MVP.master-latest.md` is the canonical handoff PRD.
- Public portfolio and portfolio indexing are explicit.
- Public directory language is absent from the MVP contract.
- Blind-by-default progressive reveal is the only canonical matching privacy model.
- Redaction is documented only as a supporting visibility control.

## 8.2 Individual Product Acceptance

- Individual onboarding ends with a public portfolio-ready step and live shareable URL.
- Individuals can create and publish Proof Packs and control visibility.
- Matching remains explorable before `Intro-eligible` without implying org visibility too early.
- Qualified intros are blocked until `Intro-eligible`.
- Interviews support schedule, reschedule, cancel, and replacement scheduling.
- 48-hour feedback follow-up status is visible and auditable.
- Zen Hub remains private, optional, and excluded from ranking and public rendering.

## 8.3 Organization Product Acceptance

- Org onboarding ends with a public portfolio-ready step and live shareable URL.
- Organization trust profile, assignment publishing, and review queue all align with the lean org MVP scope.
- Org trust tiers and sensitive-domain review gating stay lightweight, operational, and separate from user trust tier, Proof Pack verification status, and moderation-ban states.
- The org review corridor uses privacy-safe matching and staged reveal.
- Optional reviewer access works without introducing enterprise admin scope.
- BYOC candidate invites use Proof Cards derived from Proof Packs.

## 8.4 Lifecycle and State Acceptance

- Profile readiness tiers, user trust tier, Proof Pack verification status, and Proof Pack lifecycle are documented as separate state systems.
- Match, intro, interview, feedback follow-up, and portfolio distribution each have one canonical lifecycle.
- Public portfolio publication does not weaken reveal restrictions in matching.

## 8.5 Analytics and Privacy Acceptance

- KPI names, definitions, and privacy boundaries are consistent across product, analytics, and QA handoff language.
- Every internal metric named in the PRD maps to explicit source events.
- No user-facing product requirement depends on BI-style analytics surfaces.
- Zen Hub analytics rules match Zen Hub privacy rules everywhere in the PRD.
- Org trust-tier distribution, escalation rates, and abuse flags remain internal-only and do not create user-facing trust dashboards or exposure surfaces.
- Launch trust dashboards are defined for product, operations, and admin trust or audit use without changing the calm user-facing product surface.
- Launch-critical trust events pass schema validation and forbidden-payload checks.
- ETL validation covers idempotent deduplication, lifecycle ordering, proof-trust snapshot reconciliation, and exclusion of Zen or private-partition data from warehouse outputs.

---

## 9. QA Handoff Checklist

- Verify individual onboarding creates `/portfolio/{handle}` and ends with a dedicated portfolio-ready step.
- Verify org onboarding creates `/portfolio/org/{slug}` and ends with a dedicated portfolio-ready step.
- Verify blind-by-default stages never surface public portfolio URLs or identity-bearing data too early.
- Verify Proof Pack visibility and artifact visibility interact correctly when a pack is public but a child artifact is more private.
- Verify `Match-visible` and `Intro-eligible` are treated as separate thresholds.
- Verify user trust tier and Proof Pack verification status appear as separate concepts in product copy and QA scenarios.
- Verify 48-hour feedback follow-up appears as a workflow state, not just narrative text.
- Verify Zen Hub export and delete work while Zen data stays absent from ranking and org-facing surfaces.

---

## 10. Out of Scope

- Public candidate directory or search-first people marketplace
- Deep org analytics, fairness tiles, BI-style analytics surfaces, or custom analytics layouts
- ATS or HRIS connectors
- Payments, contracts, milestones, or payroll
- Government ID self-serve verification
- Gamified proof maintenance, vanity counters, badges as separate product objects, or public testimonials as a core MVP mechanic
- Zen content library, coaching product, therapy workflows, or outbound wellbeing experiences

---

## 11. Reviewer Marketplace, Impact Bounties, and Anti-Exploitation Corridor (Post-MVP Alpha)

### Facts & Decisions

- This corridor exists to reduce exploitation, reduce verification bottlenecks, and let sponsored or social-good work scale safely without expanding MVP into a full marketplace.
- This corridor is **Post-MVP Alpha** only and is **not launch-blocking**.
- MVP remains unchanged:
  - no payments
  - no escrow
  - no heavy marketplace mechanics
- The alpha corridor is limited to:
  - reviewer directory alpha
  - manual reviewer assignment flow
  - sponsor-funded bounty support as metadata and state only
  - pro-bono caps and warnings
  - lightweight dispute intake
- Reviewer directory alpha is visible to org owners only, with limited reviewer profile data and no automated marketplace matching.

### Reviewer Marketplace Alpha

Reviewer marketplace alpha is a constrained reviewer-selection layer, not an open two-sided liquidity system.

Reviewer profile fields:

- reviewer name or handle
- headline or review specialty
- expertise domains
- sectors
- geography or timezone
- languages
- review types supported
- availability status
- active capacity
- target SLA window
- conflict disclosures
- trust indicators

Eligibility:

- verified account
- accepted reviewer policy
- completed onboarding for the reviewer role
- at least one qualifying expertise or trust signal
- no active sanctions or unresolved abuse flags

Conflict rules:

- no self-review
- no current employer or reporting-line review
- no direct sponsor conflict on the same bounty without explicit Proofound review approval
- no undisclosed financial or personal conflict

SLA fields:

- target first-response window
- target review-complete window
- capacity status such as `available`, `limited`, `unavailable`

Trust indicators:

- admin-vetted flag
- completed review count band
- SLA adherence band
- dispute-rate band
- recent activity band

### Impact Bounties Alpha

Impact bounties alpha exists to support sponsored or social-good review work as metadata and workflow state, not as a payout or escrow product.

Bounty metadata:

- bounty flag
- sponsor linked or not
- sponsor type or sponsor record reference
- social-good or impact category
- optional bounty amount or range text
- bounty rationale
- visibility setting
- acceptance constraints

Sponsor linkage:

- sponsor linkage is recorded as metadata, not as a payout engine
- sponsor support may unlock review work but does not create escrow, payroll, or invoicing obligations in alpha

Visibility:

- default visibility is limited to the org owner, Proofound ops, and eligible reviewers when assigned or invited
- bounties are not a public opportunity board

Acceptance rules:

- org must meet assignment completeness rules
- reviewer must meet eligibility and conflict checks
- bounty state must be valid before review begins

Anti-abuse constraints:

- no repeated unpaid commercial work beyond the pro-bono cap
- no bait-and-switch after reviewer acceptance
- no splitting one review into multiple unpaid requests to evade caps
- no bounty activation without sponsor linkage or an explicit approved impact exception

Alpha bounty states:

- `none`
- `sponsor_pending`
- `sponsor_confirmed`
- `bounty_active`
- `bounty_paused`
- `bounty_closed`

### Anti-Exploitation Rules

Unpaid scope is blocked when:

- the assignment is clearly commercial or revenue-linked
- turnaround or complexity exceeds free review thresholds
- the org has already consumed its pro-bono cap
- the same org repeatedly requests unpaid review for similar work

A bounty or sponsor unlock is required when:

- the cap is exceeded
- review urgency exceeds the standard alpha SLA
- specialized reviewer expertise is required beyond free corridor thresholds
- Proofound flags exploitation risk based on prior use

Warning language appears at:

- assignment publish or edit
- reviewer request or assignment step
- cap threshold crossing
- sponsor-linked bounty activation

Canonical warning language should remain calm and explicit, for example:

- `This review request exceeds the current pro-bono corridor and requires sponsor-backed or bounty-backed support before it can proceed.`
- `Proofound limits repeated unpaid commercial review requests to reduce reviewer exploitation.`

Enforcement points:

- pre-publish validation
- reviewer assignment validation
- reviewer acceptance validation
- admin or ops override logging

### Dispute Flow

Dispute handling in this corridor is intake-first and lightweight. It is designed to preserve auditability without creating a full legal-resolution system in alpha.

Intake:

- dispute submitted with reason code, summary, optional evidence links, and related reviewer or bounty reference

Review status:

- `submitted`
- `under_review`
- `needs_more_info`

Resolution states:

- `resolved_upheld`
- `resolved_rejected`
- `resolved_adjusted`

Audit log requirements:

- actor
- timestamp
- object reference
- old and new status
- rationale
- linked evidence references
- enforcement action taken

### Metrics

These are internal alpha monitoring metrics only. They are not launch KPIs and are not required for MVP release.

- reviewer SLA adherence
- reviewer assignment turnaround
- bounty usage rate
- sponsor-linked bounty share
- dispute rate by review type
- pro-bono cap trigger frequency
- override frequency for anti-exploitation enforcement

### Open Questions

- exact numeric pro-bono cap thresholds by org type
- whether bounty amount text is always hidden from reviewers until assignment
- minimum completed-review threshold for stronger trust indicators

### Out of Scope

- full marketplace liquidity systems
- complex payouts
- invoicing or payroll
- escrow engine
- legal automation

### Acceptance Criteria

- The section clearly labels itself as Post-MVP Alpha and explicitly states it is not required for MVP launch.
- Reviewer directory alpha is limited to org-owner browsing plus manual assignment, with no automated liquidity mechanics.
- Sponsor-funded bounty support is defined as metadata and state only, without payout or escrow commitments.
- Pro-bono caps, warnings, and enforcement points are clearly defined.
- Dispute intake, statuses, resolution states, and audit log requirements are specified.
- Metrics are defined as internal alpha monitoring only.
- The section does not reintroduce payments, payroll, escrow, or legal automation into MVP.

---

## 12. Final Approval Checklist

- One canonical PRD source exists.
- Canonical vocabulary is stable and unambiguous.
- Proof Pack, verification, matching, public portfolio, and lifecycle states align.
- Acceptance criteria match analytics rules and event names.
- Out-of-scope language matches the included MVP features.
- User journeys do not reintroduce removed scope.
