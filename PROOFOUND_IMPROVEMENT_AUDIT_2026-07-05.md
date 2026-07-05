# Proofound — Improvement Audit

**Date:** 2026-07-05 · **Scope:** full codebase (≈280K LOC TS/TSX, 1,226 source files, 139 API routes, 153 DB tables), frontend/UX, product loops, market context · **Method:** three parallel code audits (backend/architecture, frontend/UX, product-loop/cold-start) + market research; every code claim below was verified against specific files.

> One note up front: this repo has 73 markdown docs at root. This document is meant to _supersede_ the audit-flavored ones, not join them. Recommendation 9.6 is to archive most of them.

---

## 1. Executive summary

Your five fears — weak adoption, manual work per company, not technological enough, unclear product, onboarding not market-ready — are **all confirmed by the code**. But the audit's most important finding is the opposite of demoralizing:

**The biggest problems are not missing capabilities. They are built capabilities that are switched off, orphaned, or gated.** The AI assist layer exists and is flagged off. A better landing page exists and is dead code. The "share your portfolio on day 1" component exists with zero call sites. The org-side private candidate-review loop — the single most viable wedge this product has — is fully functional on the backend and disconnected from the UI. Matching itself is behind an env var that defaults to off.

The deeper strategic problem is architectural: **Proofound is built as a two-sided marketplace, but it can only survive by becoming a single-player tool first.** Every revenue-relevant loop (matching → intro → interview → decision) requires the other side to already exist, and the one artifact designed to be single-player — the public portfolio — is gated behind an external verifier's voluntary, unincentivized, unreminded action.

The market timing, however, is better than it was when you started. AI application spam has made "proof over polish" a mainstream, urgent buyer pain in 2026 — the exact problem Proofound was designed for. The product doesn't need a new thesis. It needs the existing thesis to be _reachable_ by a stranger in 10 minutes without you in the room.

**The one-sentence strategy:** turn off marketplace-first, turn on tool-first — candidates get an instant, shareable, AI-drafted Proof Profile (verification upgrades trust, never gates existence); organizations get a self-serve "Screening Room" that turns _their own_ applicant flow into structured, comparable, blind-reviewable proof (zero liquidity required); the marketplace re-emerges later from the proof graph both tools accumulate.

---

## 2. Market reality check (why the thesis is right and the timing is now)

**The buyer pain Proofound targets became a crisis in the last 18 months.** LinkedIn now processes a reported ~11,000 applications per minute, up ~45% year over year, driven by AI agents mass-applying on candidates' behalf. Recruiters describe a signal-to-noise crisis: every application looks polished, so distinguishing real capability from AI-generated noise is _the_ hiring problem of 2026. HBR ran "AI Has Broken Hiring" in June 2026. Roughly 20% of employers are reportedly considering pay-to-apply fees just to suppress spam. This is precisely the problem a structured, verified Proof Pack solves — you no longer need to convince the market the problem exists.

**Candidates are equally burned:** 53% report being ghosted in the past year (a three-year high per Fortune/iHire), and roughly 30% of postings never result in a hire ("ghost jobs"). Candidates don't want another place to apply; they want to stop being invisible. A shareable artifact that makes them _legible_ — usable in any application channel, not just inside Proofound — matches what they actually need.

**Skills-based hiring is loud talk, thin practice.** ~85% of employers claim skills-based intent while a vanishingly small share of hires actually change practice (Sertifier's "85% vs 0.14% paradox"). That gap is your opportunity and your warning: the winning products make skills-based hiring _operationally easy_ (TestGorilla, CodeSignal at $49–99/mo, <$1/candidate screening), not ideologically pure.

**The category's cautionary tale is Triplebyte** — a vetting marketplace with a strong brand that died because candidate acquisition never became organic (¾ of candidates came from paid ads) and marketplace close rates were structurally low. Lesson: _don't sell access to a pool you don't have; sell a tool that works on the users each side already brings._

**The category's success story is Mercor** (~$500M annualized revenue, $10B valuation reported): AI-interview-based vetting + semantic search over proof artifacts + a data flywheel where every placement improves matching. You cannot and should not copy Mercor's scope solo — but it calibrates what "technological enough" means in 2026: semantic understanding of work evidence, not weighted checkbox sums.

**The playbook for your cold-start is well-established** (Andrew Chen's _The Cold Start Problem_, Chris Dixon's "come for the tool, stay for the network"): give one side a genuinely single-player tool, accumulate the asset (here: the proof graph), and let the network form on top. Proofound currently inverts this — it asks both sides to show up before either gets value.

Sources: [HBR — AI Has Broken Hiring](https://hbr.org/2026/06/ai-has-broken-hiring-heres-how-to-fix-it) · [Shortlistd — 2026 hiring predictions](https://www.shortlistd.io/blog/10-hiring-predictions-for-2026-how-ai-will-transform-recruiting-in-2026) · [Fortune — ghosting three-year high](https://fortune.com/2026/03/20/job-seekers-arent-imagining-things-candidates-ghosted-by-employers-hit-three-year-high/) · [iHire ghosting survey](https://www.ihire.com/resourcecenter/employer/pages/53-percent-of-job-seekers-have-been-ghosted-by-a-potential-employer) · [Built In — ghost jobs](https://builtin.com/articles/ghost-jobs) · [Sertifier — skills-based paradox](https://sertifier.com/blog/skill-based-hiring-2026/) · [Contrary Research — Mercor breakdown](https://research.contrary.com/company/mercor) · [Otherbranch — Why Triplebyte failed](https://www.otherbranch.com/shared/blog/why-triplebyte-failed) · [cdixon — come for the tool](https://cdixon.org/2015/01/31/come-for-the-tool-stay-for-the-network/) · [Hirevire — SME assessment pricing](https://hirevire.com/blog/top-pre-employement-assessment-tools)

---

## 3. What genuinely works (keep these, build on these)

**3.1 The thesis and the trust model.** "Proof instead of profile theater," blind-by-default review, progressive reveal, explainable (non-black-box) scoring. In 2026 — EU AI Act era, AI-noise crisis — _explainable and privacy-first is a feature, not a limitation._ Your deterministic match contract (`src/lib/matching/match-score-contract.ts`, versioned, hash-stable, auditable) is exactly what an EU-market hiring tool needs underneath any AI layer. Most competitors can't produce an explanation artifact; you can.

**3.2 Real engineering discipline in the right places.**

- ~87% RLS coverage (416 policies), a small and auditable 9-route service-role surface, timing-safe cron auth, quarantine-first uploads.
- `src/archive` quarantine with tsconfig exclusion — scope creep was contained, not left half-wired.
- Zero `@ts-ignore` in 280K LOC, `strict: true`, low TODO count, migration drift-check tooling.
- A real design system: Figma-sourced brand tokens (forest/parchment/terracotta, Crimson Pro/Inter), not default shadcn. Dark mode threaded through 131 files. Dedicated a11y test suite.

**3.3 Honest, state-driven empty states.** The individual home dashboard computes a real readiness checklist from the DB instead of faking activity. This is rare and on-brand for a proof-first product.

**3.4 The CV import machinery** (`cv-import/CvImportWizard.tsx`, 3,237 lines + `python_cv/` service): a genuine bulk-onboarding accelerant with taxonomy matching and confidence scores. Currently _doubly_ disabled: the wizard's own API endpoints are archived stubs (`wizard-apply/route.ts` returns "archived outside the locked launch MVP corridor"), and the newer `/api/ai/start-from-cv` path throws `START_FROM_CV_NOT_INVITED` 403 for anyone off a beta allow-list (`start-from-cv.ts:484`). This should be the _front door_ of candidate onboarding; today neither entrance opens.

**3.5 The AI assist layer** — built, safety-hardened, and dark. `/api/ai/proof-pack/suggest` (field-by-field proof improvement, never auto-applies) and `/api/ai/assignments/clarify` (flags vague assignment language, strips protected-trait terms). Both behind `FF_ASSISTIVE_AI_UI: false` (`src/lib/featureFlags.ts:68`).

**3.6 The candidate-invite loop** — your hidden wedge. `POST /api/organizations/[orgId]/candidate-invites` → email → candidate claims → submits a _private_ Proof Pack reviewed only by the inviting org. Fully working backend, zero marketplace dependency. The review UI (`OrgCandidatesWorkspace.tsx`) has **zero importers under `src/app`** — the front door is simply not wired in.

**3.7 The org signup moment.** 60–90 seconds to a live public org page with a copyable URL. That's a real, satisfying first win — the model for what every other flow should feel like.

**3.8 Analytics schema thinking.** ~100 server-side event types, named activation targets already defined in code (`TTV_TARGET_DAYS = 7`, `TTFQI_TARGET_HOURS = 72`). The measurement _design_ exists; only the client-side ingestion is archived.

---

## 4. What doesn't work — your five fears, verified in code

### 4.1 "Adoption will be weak; users can't get value alone" — CONFIRMED (cold-start severity 8/10)

The dependency matrix from the loop audit:

| Feature                                | Class                        | With zero liquidity                                                                                                                            |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Private Proof Wallet / Expertise Atlas | Single-player                | Works — the only universally reachable artifact                                                                                                |
| Public portfolio                       | **Mislabeled single-player** | Unreachable: requires ≥1 accepted external verification (`completion-flow.ts:124` — `hasRequiredVerification = acceptedVerificationCount > 0`) |
| Candidate-invite private review        | Single-player                | Backend works; UI orphaned                                                                                                                     |
| Matching (candidate)                   | Cross-side                   | Has a "near-matches" softener                                                                                                                  |
| Matching (org)                         | Cross-side                   | **No softener** — publishing into an empty pool returns nothing                                                                                |
| Intros / interviews / messages         | Cross-side                   | Dead on arrival                                                                                                                                |

The flagship "day 1 win" — a shareable proof portfolio — is gated on an unincentivized third party clicking an email link, with a 14-day silent expiry (`canonical-requests.ts:295`), **no reminder cron, no admin fallback for ignored requests, and no self-attestation escape hatch**. The median outcome of the current activation path is: a candidate spends ~15 minutes building a private draft, sends a verification email into the void, and leaves with nothing to show anyone.

And nothing brings them back: the only re-engagement email is `NewMatchNotification` (requires liquidity that doesn't exist), and the weekly digest is **hardcoded disabled** (`weekly-digest.ts:11` — `'Weekly digest delivery is temporarily disabled.'`). A candidate with no match has _zero scheduled reasons to ever return_.

### 4.2 "Too much manual work per company" — CONFIRMED, and it's architectural, not incidental

- Verification review, upload/redaction review, and reveal disputes are one-at-a-time human admin queues (`src/app/admin/verification`, `internal-ops/queues`).
- Org trust-tier promotion requires a **break-glass platform admin** action per org (`requireBreakGlassPlatformAdminJson`).
- The landing page's org CTA is literally **"Request a pilot"** — a sales-assist motion — even though self-serve org signup exists and works.
- The GTM doc codifies it: _"Founder reviews candidate fit daily during an active pilot."_
- Matching — the core product — is off unless an env var is set: `MATCHING_ENABLED = process.env.MATCHING_FEATURE_ENABLED === 'true'` (`featureFlags.ts:48`).

You built a concierge pilot corridor and correctly sense that nothing about it compounds. None of the manual gates have automated equivalents waiting; each customer costs founder-hours forever until this changes.

### 4.3 "Not technological enough" — CONFIRMED for the parts that matter

The matching engine is a competently engineered **rules engine from a decade ago**: a linear weighted sum (skills 35%, constraints 25%, proof 20%, verification 20%) with hard-fail gates. Sophistication: ~4/10.

- `purpose_fit` — the thing the brand leads with — is weighted **0** (`match-score-contract.ts:24`).
- `@xenova/transformers` is installed and `embedding-service.ts` fully implements local MiniLM embeddings + cosine similarity — **and no matching route imports it**. `semantic.ts` is an explicit stub: `calculateSemanticSimilarity()` returns zeros; its header comment admits embeddings "were removed from the active individual MVP matching path."
- The `skill_adjacency` table exists in schema and is never consulted — so a Vue expert scores a hard zero against a React requirement.
- No pgvector; the `vector` column is jsonb sub-scores.
- All AI-assist UI: flagged off. OCR: flagged off. CV-import: invite-gated.

So the honest description of today's product is: _a hand-operated rules engine with an unused AI toolkit in the trunk._ Your instinct is right — but note the fix is wiring, not research: the embedding service, the adjacency table, and the Gemini assists already exist.

### 4.4 "The product is unclear" — CONFIRMED, and partly self-inflicted

- **The good landing page is dead code.** `src/components/landing/sections/` holds ~20 polished, on-message components — `HeroSection.tsx` says _"Hire and get hired through verified proof, not CV noise"_ (clear, benefit-led), plus a ComparisonSection (old way vs Proofound) and a 3-step how-it-works. **None are imported anywhere.** The live homepage is a single 4,408-line scroll-jacked `ScrollytellingSection` whose headline is _"Proof behind the claim"_ and whose body asks visitors to sit through 9 forced scroll frames of abstract copy ("It is a compatibility model") before reaching persona CTAs at the very bottom.
- **Insider vocabulary is taught nowhere.** "Corridor" (573 occurrences in source, including the site-wide meta description), "trust anchor," "attestation" (571 occurrences), "match-visible," "intro-eligible," "proof pack" — zero tooltips, zero glossary, zero FAQ, zero how-it-works page in `src/app`. Users see "Portfolio ready / Match visible / Intro eligible" as three adjacent unexplained checklist labels.
- **No pricing page, no social proof, no product screenshots** anywhere on the marketing surface. A visitor has no third-party evidence this is real, no idea what it costs, and never sees the actual product.
- **The shareable artifact undermines sharing.** Every portfolio for every human renders the identical hardcoded OG image (`DEFAULT_OG_IMAGE = '/hero-visual.jpg'`) and generic OG title "Proofound Public Page" — so every link shared to LinkedIn/Slack looks like the same marketing page. No avatars exist (single-letter circles). The "Request introduction" button is a raw `mailto:hello@proofound.io`. The page even shows visitors an internal build note: _"Search engines are off for the MVP."_

### 4.5 "Onboarding is not market-ready" — CONFIRMED

- **Individual:** 2-screen wizard whose second screen is really ~7 required decisions incl. a hard-validated "3–5 skills" rule; ends by routing to `/profile` with hedging copy — **never confirming a shareable link**. The component that delivers the day-1 win (`PublicPortfolioReadyStep.tsx` — "Day 1 win unlocked… copy it, share it") has **zero production call sites**. Realistic time-to-value: 8–15+ min to… a private draft.
- **Organization:** signup promises _"create one assignment and review a shortlist."_ The next screen blocks assignment creation until 3 "trust essentials" are complete — the same fields signup just called _"Optional for launch"_ (a bait-and-switch), followed by a 5-step, ~24-field wizard with hard quality gates, whose one softener (AI clarify) is flagged off. 20–40+ minutes to publish into a pool that, today, contains nobody.
- **Three conflicting tour implementations** (live joyride org tour, hand-rolled individual tour, one fully orphaned file contradicting the others: "20,000+ skills" vs "18,000"). The tour only fires on the home route.

### 4.6 The tax you didn't list: AI-assisted-development sprawl

This codebase shows the classic signature of heavy AI-tool development without consolidation passes:

- **1,296 markdown files** (73 at root), multiple competing PRD rewrites of the same spec.
- **152 DB tables** for a pre-adoption product — including 9 wellbeing/fairness/SUS-survey tables built for a maturity stage that doesn't exist yet.
- **Three migration systems** (`supabase/migrations/` 21 files, `src/db/migrations/` 123 files, a near-empty `drizzle/`).
- **Duplicate IA:** `/app/i/communications?section=messages` and `/app/i/messages` render the identical component in different chrome; `/interviews`, `/verifications`, `/portfolio`, `/expertise` exist as routes but not in nav.
- **Dead dependencies:** `gsap` (one importer, itself never called), `lenis` (zero imports), `@xenova/transformers` (stubbed out of the live path).
- **Micro-level gaps where it counts:** only 47/139 API routes (34%) validate input with zod; rate limiting exists as infrastructure but is applied in ~1 route; ~20 tables lack confirmed RLS enablement; 243 `as any`.

The pattern: _breadth kept getting cheaper, so breadth kept getting bought._ The product doesn't need more surface. It needs ~6 flows to be excellent.

---

## 5. The strategy: from marketplace to tool-first (CEO section)

### 5.1 The core repositioning

Stop selling a corridor between two groups who aren't there yet. Sell two self-contained tools that each solve a burning 2026 problem alone, and let the marketplace _emerge_ from the asset they accumulate (the proof graph):

**For organizations — "The Screening Room" (primary revenue wedge).**
Pitch: _"Drowning in AI-written applications? Stop reading CVs. Send applicants one link; get back structured, comparable, blind-reviewable proof of real work."_
This is your orphaned candidate-invite loop, promoted from hidden feature to hero product. It requires **zero marketplace liquidity** — the org brings its own applicants (from LinkedIn, their careers page, anywhere). It monetizes the signal-to-noise crisis directly. It is the anti-Triplebyte: you never promise a pool you don't have. Every applicant processed becomes a Proofound-structured proof profile — seeding the candidate side for free, exactly the OpenTable playbook.
Pricing anchor: SME screening tools run $39–99/mo self-serve. Start there (e.g., free: 1 active assignment / 10 invites; ~€79/mo: unlimited). Add Stripe; kill "Request a pilot" as the primary CTA.

**For candidates — "Proof Profile in 10 minutes" (growth wedge).**
Pitch: _"Your work, made legible. Import your CV, let AI draft your proof records, get a link that makes you stand out in any application — here or anywhere."_
Mechanics: CV-import becomes the default first step (remove the beta allow-list) → Gemini assist drafts proof records (flip the flag) → **publish immediately** with an honest "Self-reported / Unverified" badge → verification _upgrades_ the badge (Verified ✓) instead of gating existence. Wire in `PublicPortfolioReadyStep` so the flow ends with copy-link-and-share. Per-person OG images (name + headline stat + verification tier) so every shared link is an ad.
This flips your worst gate into your growth loop, and gives candidates the thing the ghosting crisis makes them crave: _legibility and differentiation they can use everywhere._

**The flywheel connecting them:** org invites applicants → applicants build proof profiles → profiles are shareable and attract more candidates → verifiers receive requests, see the product, convert (add "Create your own proof profile" to the verifier completion screen — currently a dead end) → the proof graph grows → matching becomes real → _then_ the corridor you originally envisioned turns on, with liquidity you didn't have to buy.

### 5.2 What "technological enough" means for you (and what to skip)

Do (all feasible solo + AI tools, mostly wiring existing parts):

1. **Semantic proof matching v1:** wire `embedding-service.ts` into the match path — embed proof summaries and assignment descriptions, add a `semantic_fit` component at maybe 15–20% weight, and _reallocate_ `purpose_fit`'s dead 0. Add pgvector (Supabase native) when jsonb cosine gets slow. Keep the deterministic contract as the explanation layer — "here's _why_ this match" is your EU-grade differentiator.
2. **Skill adjacency:** consult the existing `skill_adjacency` table for partial credit instead of hard zeros.
3. **AI verification triage** to kill your admin queue: auto-verify what provenance can prove (GitHub repo ownership, domain-matched employer emails, link liveness/authorship checks), reserve human review for genuine ambiguity. This converts your biggest manual cost into a queue that only sees exceptions.
4. **AI review summaries for orgs** (Screening Room): auto-generate the blind, structured comparison sheet across submitted proof packs. This is the "wow" moment for the paying side.
5. **Verification reminders + incentive:** a 3-touch reminder cron (the infra exists; verification is simply not covered) and a verifier landing that offers them their own profile.

Skip (for now): AI video interviews (Mercor's game, capital-intensive), building an ATS, buying liquidity with ads (Triplebyte's death), enterprise features, multi-language expansion, and any new surface area not on the two wedge paths.

### 5.3 Positioning one-liners (test these)

- Site-wide: **"Hire on proof, not promises."** / candidate flip: **"Be seen for what you've actually done."**
- Org sub: "Turn any applicant list into blind, comparable, verified proof — in one link."
- Retire from all user-facing copy: _corridor, attestation, trust anchor, match-visible, intro-eligible._ (A `UI_VOCAB_PLAIN` flag already exists — extend it and make it the only mode.)

---

## 6. Prioritized roadmap

### P0 — "Turn on what you built" (1–2 weeks, mostly wiring)

| #   | Action                                                                                                                             | Where                                               | Effort   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------- |
| 1   | Flip `ASSISTIVE_AI_UI` → true (proof improve + assignment clarify)                                                                 | `featureFlags.ts:68`                                | Hours    |
| 2   | Set `MATCHING_FEATURE_ENABLED=true` in prod env                                                                                    | env                                                 | Minutes  |
| 3   | Publish portfolios without verification; add Unverified/Verified badge tiers                                                       | `completion-flow.ts:124`, `public-contract.ts`      | 1–2 days |
| 4   | Wire `PublicPortfolioReadyStep` as onboarding finale (copy link + share)                                                           | onboarding flow                                     | 1 day    |
| 5   | Replace scrollytelling homepage with the orphaned `landing/sections/*` (hero, 3-step, comparison, dual CTAs above fold)            | `src/app/page.tsx`                                  | 1–2 days |
| 6   | Reopen the CV path (drop `start-from-cv` allow-list _or_ un-archive the wizard endpoints); make it step 1 of individual onboarding | `start-from-cv.ts:484`, `api/expertise/cv-import/*` | 1–2 days |
| 7   | Per-person OG image + real OG title for portfolios; kill "search engines off" visitor copy; replace `mailto:` intro buttons        | `portfolio/[handle]`                                | 1–2 days |
| 8   | Enable weekly digest; add verification reminder touches (day 2/5) + fix 7-vs-14-day copy mismatch                                  | `weekly-digest.ts`, new cron entry                  | 1–2 days |
| 9   | Route `OrgCandidatesWorkspace` into the org shell nav                                                                              | org routes                                          | 1–2 days |
| 10  | Glossary tooltips or plain-language swap for the 6 jargon terms                                                                    | shared components                                   | 1 day    |

_P0 alone converts the median new user's outcome from "private draft + silence" to "shareable artifact + AI help + reasons to return." It is disproportionately the highest-ROI two weeks available._

### P1 — Productize the wedges (weeks 3–8)

- Screening Room as a first-class product: org dashboard centered on invite → submissions → blind AI comparison summary → reveal. Simplify assignment builder to a 5-minute "basic mode" (flag exists: `ASSIGNMENT_BASIC_MODE`) with AI clarify on by default; move the 24-field rigor to an "advanced" path.
- Pricing page + Stripe self-serve billing; replace "Request a pilot" with "Start free."
- Verifier conversion loop (post-attestation CTA → own profile).
- Un-archive client-side analytics ingestion; wire the ~100 defined events; stand up a simple activation dashboard against your own targets (TTV ≤ 7 days is already coded — measure it).
- Consolidate IA: one inbox (kill the communications/messages duplication), nav entries for orphaned routes or delete them; one tour implementation.

### P2 — Make the moat (months 2–6)

- Semantic matching v1 + skill adjacency + org-side near-matches fallback (port the existing candidate-side softener).
- AI verification triage; provenance auto-checks (GitHub/domain email).
- Proof-profile SEO opt-in (portfolios are currently noindexed by design — once quality is there, this is free distribution).
- Case studies from first 3–5 Screening Room orgs; template library of assignments per role type.
- Zod on all mutation routes, rate limiting on auth/invite/token endpoints, close the ~20-table RLS gap, pick one migration system, delete `gsap`/`lenis`.

### Explicit non-goals for the next 6 months

ATS integrations, enterprise dashboards, reviewer marketplace, AI interviews, additional locales, any net-new schema. (Your own Locked Source of Truth already says most of this — the discipline exists on paper; apply it to the codebase.)

---

## 7. Metrics that decide if this works

Candidate: **time to shareable link** (target <10 min, measurable today), portfolio share rate, verifier→signup conversion, D7 return.
Org: **time to first reviewed proof pack** (target <1 day from signup via invites), invites sent per org, submission completion rate, free→paid conversion.
Platform: proof records created/week (the graph is the moat), % verified within 14 days.
All of these have event types already defined in `src/lib/analytics/constants.ts` — the only missing piece is live ingestion (P1).

---

## 8. Honest risks and counterarguments

- **Candidate effort is real even at 10 minutes.** If AI-drafted proof profiles feel generic, the artifact loses its point. Mitigation: quality bar on the AI drafts (show only high-confidence extractions; make editing frictionless), and the Unverified→Verified ladder to keep honesty visible.
- **"Unverified public portfolio" dilutes the trust brand.** Counter: labeled self-report is how every trust system bootstraps (LinkedIn, eBay reviews, Airbnb). Blocking publication doesn't protect trust; it prevents existence. The badge _is_ the trust model.
- **Screening Room drifts toward "just another assessment tool."** Differentiation to protect: blind-by-default review, proof-of-real-work (not synthetic tests), explainable comparisons, GDPR-native posture — none of TestGorilla/CodeSignal's DNA.
- **Solo-founder bandwidth.** The roadmap above deliberately front-loads wiring over building. If only P0 ships, the product is still categorically different in two weeks.
- **This document's recommendations change the Locked Source of Truth.** Yes — specifically the "portfolio requires verification" rule and the pilot-first GTM. The lock was rational for a concierge pilot; it is the wrong contract for self-serve adoption, which is the goal you've now set.

---

## Appendix A — Key evidence index

| Claim                                    | Evidence                                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| AI assist built but off                  | `src/lib/featureFlags.ts:68` (`ASSISTIVE_AI_UI: false`); `/api/ai/proof-pack/suggest`, `/api/ai/assignments/clarify` |
| Matching env-gated off                   | `src/lib/featureFlags.ts:48`                                                                                         |
| Portfolio gated on external verification | `src/lib/profile/completion-flow.ts:124-125`; `src/lib/portfolio/public-contract.ts:54`                              |
| Day-1 share component orphaned           | `PublicPortfolioReadyStep.tsx` — zero call sites (grep verified)                                                     |
| Org review workspace orphaned            | `OrgCandidatesWorkspace.tsx` — zero importers under `src/app` (grep verified)                                        |
| Semantic matching stubbed                | `src/lib/matching/semantic.ts` (returns zeros; header comment); `embedding-service.ts` unimported by match path      |
| Purpose weight zero                      | `src/lib/matching/match-score-contract.ts:24`                                                                        |
| Weekly digest hardcoded off              | `src/lib/notifications/weekly-digest.ts:11,112`                                                                      |
| Better landing orphaned                  | `src/components/landing/sections/*` — no importers; live page renders `ScrollytellingSection` (~3,900 lines)         |
| CV import doubly disabled                | `api/expertise/cv-import/wizard-apply/route.ts` (archived stub); `src/lib/ai/start-from-cv.ts:484` (403 allow-list)  |
| Manual org trust promotion               | `requireBreakGlassPlatformAdminJson` in `admin/organizations/[orgId]/verify`                                         |
| Input validation gap                     | 47/139 routes import zod                                                                                             |
| Jargon untaught                          | "corridor" 573×, "attestation" 571×; zero glossary/FAQ/how-it-works routes                                           |
| Identical OG for all portfolios          | `DEFAULT_OG_IMAGE = '/hero-visual.jpg'`; no `opengraph-image.tsx` in repo                                            |
| Analytics ingestion archived             | `/api/analytics/*` return "archived outside the locked launch MVP corridor"                                          |

## Appendix B — What was audited

Three parallel deep audits (backend/architecture & data model; frontend/UX/copy; product loops & cold-start) over the local repo (git-synced with `gother111/proofound-platform`), sampling all layers: 139 API routes, schema (152 tables), matching engine, onboarding flows, marketing surface, emails, crons, feature flags, admin surface, GTM/PRD docs. Market research July 2026 (sources in §2). Code-level claims were re-verified by direct grep/read before inclusion.
