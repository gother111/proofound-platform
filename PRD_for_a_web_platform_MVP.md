# PRD — MVP — Part 1: Problem Statement

## 1.1 Context / Why Now
We’re in an unusually high-paced, high-volatility era shaped by rapid technological change and pervasive AI. Human cognition, social norms, and institutions are struggling to adapt, contributing to a measurable rise in mental-health strain. In parallel, the labor market is undergoing structural shifts: historically low employment security for many groups, unstable demand, and new skill requirements. Traditional hiring mechanics—CVs, cover letters, cold outreach, and generic networking—are increasingly misaligned with this reality and are trivially gamed by AI, eroding signal and trust.

## 1.2 Primary Users & Problems
**Primary user:** Job seekers (new graduates, industry switchers, mid-career movers, immigrants in new markets, senior talent facing ageism).  
**Counterparty:** Organizations seeking talent (from startups to enterprises).

**Candidate-side pains**
- Heavy time/energy cost crafting and tailoring CVs/letters, back-channeling, and repetitive intro calls.
- Low-signal processes (AI-written CVs/letters), few responses, automated rejections, and scant feedback.
- Exposure to bias (ageism/sexism/racism/homophobia), credentialism, and “CV gaps” stigma.
- Mental-health toll from uncertainty, repeat rejection, and performative pressure on social platforms.

**Organization-side pains**
- High spend on HR/recruiting workflows, agencies, and multi-round interviews to find one hire.
- Low precision from CV/keyword screens; poor differentiation between motivated and misaligned candidates.
- Bias and compliance risk; limited transparency and auditability of decisions.

## 1.3 Opportunity (What can be 10× better)
Create a space centered on authenticity, well-being, and values-aligned outcomes—not performative profiles or engagement feeds. Replace CV/cover-letter dependency with an **expertise mapping** model that captures skills, methods, outcomes, values/causes, and work preferences. Give users **control over visibility and boundaries** (privacy-first). Bake in **anti-bias guardrails** and **high-precision, automated matching** so both sides quickly reach motivated, well-reasoned connections that can create business value. Integrate lightweight **mental-well-being check-ins** to help users navigate uncertainty without the pressure to “perform” for algorithms.

**MVP industry focus:** Labor Market × Mental Health (with future expansion paths managed outside MVP).

## 1.4 Problem Hypothesis (single sentence)
For job seekers overwhelmed by volatile, biased, and time-intensive hiring—and for organizations overspending on low-precision talent acquisition—**Proofound’s MVP** delivers a privacy-first, anti-bias expertise-mapping and automated-matching system that rapidly creates values-aligned, credible introductions, as evidenced by a shorter time-to-first qualified match and reduced effort per hire for both sides.

---

## Facts & Decisions
**Canonical terms (for consistency across the PRD)**
- **Expertise Mapping / Expertise Atlas:** Structured, CV-alternative representation of skills, methods, outcomes, values/causes, and preferences.
- **Values-Aligned Match:** A connection proposed when skills, constraints, values/causes, and availability meaningfully overlap.
- **Guardrails:** Built-in mechanisms for transparency, anti-bias, credibility, privacy, and security.
- **Mental-Well-Being Check-ins:** Optional, lightweight prompts and reflections to track user stress and balance (non-diagnostic).

**Decisions captured here**
- MVP will **not** rely on CVs/cover letters as primary signals; the **Expertise Mapping** model is the default signal.
- MVP prioritizes **bias reduction, privacy, and transparency** by design (not add-ons).
- MVP excludes engagement-driven social feeds; **no LinkedIn-style content feed**.
- MVP will surface **values/causes** and **work-preference** signals in matching logic.

**Open questions (to resolve in subsequent sections)**
- Verification scope in MVP: which proofs (e.g., identity, employment, skills) and what UX?
- Minimum viable anti-bias techniques at launch (e.g., redaction/blinding, calibrated scoring, fairness checks).
- Which mental-health features fit MVP scope (frequency, opt-in, data handling) without entering medical territory?
- Data exposure defaults: what’s private by default vs. explicitly shareable?
- Organization onboarding: minimum inputs to produce high-precision matches quickly?
- Metrics we will commit to in #2 (e.g., time-to-first qualified intro, candidate/manager effort saved, perceived fairness).

**Approved on**
- **Status:** Draft v0.1 (awaiting product approval)  
- **Approver:** Pavlo Samoshko  
- **Date:** —


# PRD — MVP — Part 2: Goals & Success Metrics

## 2.1 North Star Metric (NSM)
**NSM: Time-to-Signed-Contract (TTSC)**

- **Definition:** Elapsed calendar time between activation and a signed employment/engagement agreement attributable to the platform.  
  - **Individual TTSC:** From **Matching Profile Activation** (profile ≥ minimum completeness and set to “matchable”) → **Signed Contract** (user attestation + optional org confirmation).  
  - **Organization TTSC:** From **Assignment Activation** (assignment published and matchable) → **Signed Contract** (org attestation + optional individual confirmation).
- **Formula:** `median(TTSC_days)` per cohort (role type, seniority, geography); track P75 as a risk lens.
- **MVP Target (initial):** Establish baselines in the first cohorts; demonstrate **≥30% reduction** vs. user-reported prior experience for comparable roles, or an **absolute median TTSC ≤ 30 days** for entry/mid roles (to be refined per cohort once baseline is known).

> Why this matters: It directly reflects the platform’s promise—faster, more efficient matches that culminate in real engagements.

## 2.2 Outcome Metrics
1. **Time-to-First Qualified Introduction (TTFQI)**  
   - **Definition:** Activation → first **Qualified Introduction** (intro where skills/constraints threshold is met and both parties opt-in).  
   - **Target (MVP):** Median ≤ **72 hours** post-activation for at least one persona/cohort.
2. **Time-to-Value (TTV)**  
   - **Definition:** Activation → first **Meaningful Step** (e.g., interview scheduled or async task accepted).  
   - **Target (MVP):** Median ≤ **7 days**.
3. **Effort Reduction (Candidate & Org)**  
   - **Definition:** Self-reported **hours saved** per search/hire vs. prior methods + measured **on-platform steps** (form fields, clicks).  
   - **Target (MVP):** ≥ **40%** perceived time saved; ≤ **15 minutes** to publish an assignment; ≤ **20 minutes** to activate a matchable profile.
4. **Ease-of-Use / UX Quality**  
   - **Definition:** Task success rate for key flows (profile activation, assignment publish, match review), **SUS** score, and drop-off rates.  
   - **Target (MVP):** **SUS ≥ 75**, ≥ **90%** task success, < **10%** drop-off between final two steps of activation.
5. **Well-Being Delta (non-diagnostic, opt-in)**  
   - **Definition:** Change in self-reported **stress** and **sense of control** (5-point Likert) from Activation → Day 14 (and Day 30).  
   - **Target (MVP):** ≥ **60%** of respondents show **≥ +1** improvement on at least one dimension; **no deterioration** trend at cohort level.
6. **Purpose-Alignment Contribution (PAC)**  
   - **Definition:** Share of the **match score** attributable to values/causes alignment; its correlation with acceptance/contract rates.  
   - **Target (MVP):** Top-decile PAC matches show **≥20% higher** intro acceptance and **≥15% higher** contract rate vs. baseline.
7. **Fairness/Equity Signal (opt-in)**  
   - **Definition:** **Fairness Gap** between opt-in demographic segments on intro and contract rates, controlling for skills/constraints.  
   - **Target (MVP):** **No statistically significant negative gap** for underrepresented cohorts; publish a fairness note per release.

## 2.3 Anti-Goals / Non-Metrics (MVP)
- Do **not** optimize remuneration levels, work conditions, or culture fit beyond explicit constraints supplied by users.
- Do **not** optimize for time-on-site, feed engagement, vanity counts, or message volume.
- Do **not** add social “content feeds”; avoid incentives that increase performative pressure.
- Do **not** introduce clinical/diagnostic mental-health measurements; keep well-being check-ins strictly **non-diagnostic** and **opt-in**.

---

## Facts & Decisions
**Canonical definitions**
- **Activation (Profile/Assignment):** Minimum completeness threshold met and explicitly set to “matchable.”
- **Qualified Introduction:** A two-sided, values-aware intro produced when skills/constraints thresholds and consent are satisfied.
- **Meaningful Step (TTV event):** A scheduled interview or accepted async task within the platform.
- **PAC (Purpose-Alignment Contribution):** The additive portion of the composite match score attributable to values/causes alignment.

**Decisions captured here**
- **NSM = TTSC** for both sides; track cohort medians + P75.
- Purpose/values signals are **first-class** in scoring and **evaluated for lift** (PAC).
- Well-being is measured only via **opt-in**, **non-diagnostic** 1–5 check-ins; results are private and aggregated.
- UX quality to be tracked with **SUS** + task success + drop-off; no social feed.

**Open questions**
- **Contract verification:** acceptable proofs (mutual attestation, doc upload, third-party integration later)?
- **Baselines:** how collected for TTSC/Effort (onboarding survey vs. control cohorts)?
- **Fairness controls:** which de-biasing techniques in MVP (blinding, calibration, periodic fairness audit)?
- **Cohort definitions:** by role family, seniority, geography—exact bins for dashboarding.
- **Privacy defaults:** analytics/event-level redaction for sensitive fields and opt-in demographics.

**Approved on**
- **Status:** Draft v0.1 (awaiting product approval)  
- **Approver:** Pavlo Samoshko  
- **Date:** —


# PRD — MVP — Part 3: User Personas & Primary Journeys

> **Alignment note:** These personas and journeys are tuned to Parts **1) Problem Statement** and **2) Goals & Success Metrics**.  
> Metrics referenced below use the canonical labels: **TTSC** (Time-to-Signed-Contract), **TTFQI** (Time-to-First Qualified Introduction), **TTV** (Time-to-Value), **PAC** (Purpose-Alignment Contribution), **SUS** (usability), and **Well-Being Delta** (non-diagnostic, opt-in). “Qualified Introduction” and “Activation” follow Part 2 definitions.

---

## Individuals (6)

### 1) Nenah, 24 — impact-driven grad, starting out
**Goal:** Build credibility fast; land paid impact work.  
**Context:** Mobile-first; budget-sensitive; limited network.

**Definition of Done (MVP):** Nenah receives ≥1 **Qualified Introduction** within 72h of activation and signs a first contract within the baseline TTSC cohort target.

#### Journey Stages
**Awareness**  
- **Touchpoints:** TikTok/IG reels, friend share, uni Slack.  
- **Actions (MVP):** Lands on “How It Works,” sees student-oriented variant.  
- **Feelings:** Curious.  
- **Friction:** Value prop vs LinkedIn unclear.  
- **Metrics:** CTR → TTFQI; landing bounce.  
- **Design Ops:** Social landing variant with 3 bullets + trust badges; “Student path” CTA.

**Consideration**  
- **Actions:** Start **Profile Wizard** (edu/work; mission/vision/values/causes; volunteering). Opens **Expertise Hub**; selects L1–L3; adds 2 L4 with level + proof.  
- **Feelings:** Overwhelmed by taxonomy.  
- **Friction:** “What do I add first?”  
- **Metrics:** Wizard completion %, L4 add rate, time-to-activation.  
- **Design Ops:** Guided starter kit (suggested L4s by degree); tooltips/glossary; proof template.

**Decision**  
- **Actions:** Create **Matching Profile** (location/time, values/causes). Sees gated preview matches.  
- **Feelings:** Cautiously optimistic.  
- **Friction:** Verification anxiety; price.  
- **Metrics:** Match-profile completion; verify click-through; PAC presence in top matches.  
- **Design Ops:** “Soft verify” (peer/mentor attest + artifact), student discount, privacy explainer.

**Purchase**  
- **Actions:** Buys Starter; completes mobile payment.  
- **Feelings:** Relieved.  
- **Friction:** Mobile pay friction.  
- **Metrics:** Mobile checkout success; drop-off by step.  
- **Design Ops:** Apple/Google Pay; one-screen checkout.

**Retention**  
- **Actions:** Uses **Dashboard**; adds 1 artifact/week; Zen Hub reflection after rejections.  
- **Feelings:** Progressing; occasional discouragement.  
- **Friction:** Quiet match weeks.  
- **Metrics:** 4-week retention; artifacts cadence; TTFQI→interview rate; **Well-Being Delta**.  
- **Design Ops:** “Micro-wins” streaks; auto-suggest L4s from uploaded CV; Zen prompts tied to milestones.

---

### 2) Mateo, 31 — career switcher to climate data
**Goal:** Credible proof for interviews; land role in climate data.  
**Context:** Bootcamp portfolio; non-linear path.

**Definition of Done (MVP):** Gap Map produced; ≥2 Qualified Introductions in first 2 weeks; ≥1 interview scheduled (TTV ≤ 7 days).

#### Journey Stages
**Awareness**  
- **Touchpoints:** Google search, podcast.  
- **Actions:** Reads “Switchers” page.  
- **Feelings:** Hopeful.  
- **Friction:** Is a non-linear path accepted?  
- **Metrics:** Switchers CTR; scroll depth.  
- **Design Ops:** Before/after stories; role-gap demo.

**Consideration**  
- **Actions:** Import projects to **Profile**; map to Expertise Hub (auto-scan suggests L4s like “Time-series cleaning,” “ETL in Python”). **Gap Map** highlights top L4s to add.  
- **Feelings:** Oriented.  
- **Friction:** Mapping confidence.  
- **Metrics:** Auto-map acceptance rate; time-to-activation.  
- **Design Ops:** “Why it mapped” explainer; edit-in-place L4 properties.

**Decision**  
- **Actions:** Configures **Matching Profile** (remote; causes: climate); sees shortlists gated by verification.  
- **Feelings:** Cost-sensitive.  
- **Friction:** Which verification matters?  
- **Metrics:** Verification pack attach rate; PAC contribution vs acceptance rate.  
- **Design Ops:** “Switch Pack”: portfolio review + 1 verified project + mock interview.

**Purchase**  
- **Actions:** Buys Switch Pack; books async review.  
- **Feelings:** Motivated.  
- **Friction:** Scheduling.  
- **Metrics:** Time-to-first verified proof.  
- **Design Ops:** 48-hour async SLA; calendar picker with soonest slot.

**Retention**  
- **Actions:** Follows Gap Map; applies to 3 roles; Zen Hub debriefs rejections.  
- **Feelings:** Resilient.  
- **Friction:** Limited feedback on declines.  
- **Metrics:** Interview & offer rates; TTSC; **Well-Being Delta**.  
- **Design Ops:** “Why not shortlisted” insights; practice tasks that lift match score + link back to L4 gaps.

---

### 3) Ola, 38 — senior security engineer, time-poor advisor
**Goal:** Low-lift paid advisory with vetted orgs.  
**Context:** Privacy/security-sensitive; minimal time.

**Definition of Done (MVP):** Advisory sprint accepted with ≤15m onboarding; repeat micro-engagements per quarter.

#### Journey Stages
**Awareness**  
- **Touchpoints:** Referral, LinkedIn DM.  
- **Actions:** Skims Trust & Security.  
- **Feelings:** Skeptical.  
- **Friction:** Noise/notifications.  
- **Metrics:** Referral land → sign start.  
- **Design Ops:** “Quiet Mode” profile preset; email-only digests.

**Consideration**  
- **Actions:** Minimal **Profile** (headline + expertise domains); adds 4 L4s (e.g., Threat modeling, SOC2 readiness) with confidentiality flag; toggles availability; **Matching Profile** for micro-engagements.  
- **Feelings:** In control.  
- **Friction:** Taxonomy time.  
- **Metrics:** Time-to-availability.  
- **Design Ops:** Import from CV/LinkedIn to seed L4s; bulk add.

**Decision**  
- **Actions:** Reviews 2 NGO briefs; requests NDA before details.  
- **Feelings:** Professional.  
- **Friction:** NDA loops.  
- **Metrics:** NDA turnaround time; drop-offs.  
- **Design Ops:** One-click NDA; org security self-assessment badge on Assignments.

**Purchase**  
- **Actions:** Accepts paid advisory sprint.  
- **Feelings:** Clear.  
- **Friction:** Onboarding overhead.  
- **Metrics:** Time-to-onboard < 15m.  
- **Design Ops:** Sprint starter brief; Slack/Teams bridge.

**Retention**  
- **Actions:** Quarterly micro-advisories; **Dashboard** shows impact letters; exports credential.  
- **Feelings:** Recognized.  
- **Friction:** Recognition outside platform.  
- **Metrics:** Repeat engagements; credential views.  
- **Design Ops:** Public credential page; nudges when availability changes.

---

### 4) Dmitry, 59 — manufacturing expert, mentorship-first
**Goal:** Light mentorship/consulting; desktop-first.  
**Context:** Prefers simple scheduling and payouts.

**Definition of Done (MVP):** 3 pro-bono sessions completed; paid sessions enabled; first payout achieved.

#### Journey Stages
**Awareness**  
- **Touchpoints:** Facebook group, newsletter.  
- **Actions:** Opens mentor demo.  
- **Feelings:** Curious but cautious.  
- **Friction:** “Another complex tool?”  
- **Metrics:** Mentor land → wizard start.  
- **Design Ops:** “Mentor Quick Start” (3 steps).

**Consideration**  
- **Actions:** Minimal **Profile**; **Expertise Hub** adds 6 L4s (OEE improvement, Lean audits) via bulk add; sets **Matching Profile** for mentee criteria.  
- **Feelings:** Efficient.  
- **Friction:** Calendar setup.  
- **Metrics:** Time-to-availability.  
- **Design Ops:** ICS + phone-in options; default two slots/week.

**Decision**  
- **Actions:** Trials 3 pro-bono sessions.  
- **Feelings:** Testing waters.  
- **Friction:** Mentee quality.  
- **Metrics:** Post-session CSAT; no-show rate.  
- **Design Ops:** Pre-goal template for mentees; deposit for paid slots after 3 pro-bono.

**Purchase**  
- **Actions:** Enables paid sessions; connects payouts.  
- **Feelings:** Valued.  
- **Friction:** Payout setup.  
- **Metrics:** Time-to-first payout.  
- **Design Ops:** Stripe Connect guide; earnings widget.

**Retention**  
- **Actions:** Keeps cadence; collects testimonials; Zen Hub reflection prompts.  
- **Feelings:** Appreciated.  
- **Friction:** Getting public recognition.  
- **Metrics:** Repeat bookings; testimonial rate.  
- **Design Ops:** Auto-prompt for public testimonial (opt-in) + exportable badge.

---

### 5) Mateo Variant — keep?
*Merged into Persona #2 to avoid duplication.*

---

### 5) Priya, 27 — social entrepreneur (pre-seed)
**Goal:** Credibility with investors/advisors; recruit interns.  
**Context:** Founder wearing many hats; needs signal not noise.

**Definition of Done (MVP):** Investor-ready Evidence Pack; 1–2 advisor attestations; intern assignment published with ≤15m setup; TTFQI ≤ 5 days for applicants.

#### Journey Stages
**Awareness**  
- **Touchpoints:** Founder Slack, Product Hunt.  
- **Actions:** Reads “For Founders.”  
- **Feelings:** Excited about storytelling.  
- **Friction:** Fear of “clinical” profiles.  
- **Metrics:** Founders page → signups.  
- **Design Ops:** Narrative blocks + media carousels.

**Consideration**  
- **Actions:** **Company Profile** (mission/vision/values, roadmap); **Expertise Hub** L1–L4 across ops/tech/impact; add customer pilots as artifacts; open **Assignment Creation** (5-step) for intern role.  
- **Feelings:** Empowered.  
- **Friction:** Which L4 properties matter to investors?  
- **Metrics:** L4 completion; artifact richness.  
- **Design Ops:** “Investor-ready” L4 presets (traction, MoU, unit economics).

**Decision**  
- **Actions:** Enables **Due-Diligence Pack**; invites two advisors to attest.  
- **Feelings:** Confident.  
- **Friction:** Advisor onboarding.  
- **Metrics:** Attestation completion.  
- **Design Ops:** Magic-link attest; templated areas of advice.

**Purchase**  
- **Actions:** Buys Team plan + verification credits.  
- **Feelings:** Invested.  
- **Friction:** Pricing clarity.  
- **Metrics:** Plan upgrade path; checkout completion.  
- **Design Ops:** ROI calculator (time saved; conversion lift on applicants/investors).

**Retention**  
- **Actions:** **Dashboard** broadcasts updates; **Zen Hub** for founder resilience; recruits via Assignments and Matching.  
- **Feelings:** Supported.  
- **Friction:** Content overhead.  
- **Metrics:** Investor pack views; applicant conversion; TTSC for hires.  
- **Design Ops:** Auto-updates from commits/sales; “compose update” from artifacts.

---

### 6) Nenah Variant — keep?
*Merged into Persona #1 to keep set concise and measurable.*

---

## Organizations (3)

### 7) GreenGrid Energy (Scale-up, 120 FTE) — hard-to-find hires
**Goal:** Fill 8 specialist roles fast with verified talent.  
**Context:** Busy managers; wants precision shortlists; prefers SSO and ATS bridge.

**Definition of Done (MVP):** Time-to-shortlist < 5 days; ≥3 Qualified Introductions per role; 2 offers/month; TTSC improvement ≥30% vs prior.

#### Journey Stages
**Awareness**  
- **Touchpoints:** Case study, HR webinar.  
- **Actions:** Requests sandbox.  
- **Feelings:** Interested but busy.  
- **Friction:** Manager adoption.  
- **Metrics:** Demo → sandbox activation.  
- **Design Ops:** “Shortlist in inbox” workflow; SSO.

**Consideration**  
- **Actions:** **Company Profile** (mission/values/causes); **Expertise Hub** to declare hiring domains; run **Assignment Creation** (5 steps):  
  1) Role & outcomes, 2) Must/Nice skills (mapped to L4), 3) Verification gates, 4) Logistics (location/time/comp), 5) Review & publish.  
- **Feelings:** Structured.  
- **Friction:** Mapping JD → L4.  
- **Metrics:** Time-to-publish Assignment; manager task success.  
- **Design Ops:** JD paste → auto L4 mapping; verification presets.

**Decision**  
- **Actions:** Picks plan (seats + verify credits); invites hiring managers.  
- **Feelings:** ROI-oriented.  
- **Friction:** Budget approval.  
- **Metrics:** Trial-to-purchase; procurement cycle time.  
- **Design Ops:** ROI calc on time-to-shortlist; security & DPA pack.

**Purchase**  
- **Actions:** Buys 15 seats; connects ATS.  
- **Feelings:** Committed.  
- **Friction:** Legal redlines.  
- **Metrics:** Time-to-contract; ATS integration success.  
- **Design Ops:** Click-through MSA; sandbox → prod migration wizard.

**Retention**  
- **Actions:** **Dashboard** shows pipeline health; managers score candidates; repeat Assignments.  
- **Feelings:** Productive.  
- **Friction:** Drift to old habits.  
- **Metrics:** Time-to-shortlist; onsite rate; 90-day success; fairness signal.  
- **Design Ops:** Stale-shortlist nudges; manager NPS; hiring playbooks.

---

### 8) Bridges for Youth (NGO, 28 FTE) — volunteers & micro-grants
**Goal:** Recruit skilled volunteers; show donor-ready impact.  
**Context:** Compliance-minded; resource-constrained.

**Definition of Done (MVP):** 3 volunteer Assignments published in ≤7 days; ≥10 qualified applicants with verification gates; donor-ready Evidence Pack.

#### Journey Stages
**Awareness**  
- **Touchpoints:** Philanthropy network.  
- **Actions:** Views volunteer/impact demo.  
- **Feelings:** Curious.  
- **Friction:** Compliance.  
- **Metrics:** Demo → trial start.  
- **Design Ops:** Safe-data templates; donor view preview.

**Consideration**  
- **Actions:** **Org Profile**; **Expertise Hub** for program capabilities; create **Assignment** (5 steps) for volunteers; set verification gates (hours + artifact).  
- **Feelings:** Confident.  
- **Friction:** Staff training.  
- **Metrics:** Time-to-first Assignment; task success.  
- **Design Ops:** Train-the-trainer kit; champion badges.

**Decision**  
- **Actions:** Chooses NGO plan with volunteer screening.  
- **Feelings:** Reassured.  
- **Friction:** Cost.  
- **Metrics:** Conversion to paid.  
- **Design Ops:** Invoice + discount; impact forecast.

**Purchase**  
- **Actions:** Onboards staff; publishes 3 Assignments.  
- **Feelings:** Energized.  
- **Friction:** Applicant triage.  
- **Metrics:** Qualified applicants/Assignment; TTFQI for volunteers.  
- **Design Ops:** Auto-ranking by L4 fit + cause alignment (PAC).

**Retention**  
- **Actions:** **Dashboard** exposes donor-ready impact; Zen Hub to prevent burnout in grant cycles.  
- **Feelings:** Sustainable.  
- **Friction:** Volunteer engagement.  
- **Metrics:** Volunteer activation; proof submission rate; donor renewals.  
- **Design Ops:** Impact badges; referral loops; quarterly showcases.

---

### 9) CityWorks Dept. (Local Government) — vendor & talent credibility hub
**Goal:** Quick, transparent sourcing with audit trail.  
**Context:** Procurement rules; accessibility and records retention needs.

**Definition of Done (MVP):** Pilot live with 3 departments; SSO set; first micro-RFP published; compliant export and audit trail.

#### Journey Stages
**Awareness**  
- **Touchpoints:** GovTech panel.  
- **Actions:** Books pilot call.  
- **Feelings:** Interested, cautious.  
- **Friction:** Procurement + risk.  
- **Metrics:** Pilot call completion.  
- **Design Ops:** Accessibility statement; records retention/export demo.

**Consideration**  
- **Actions:** **Department Profile**; configure **Assignment Creation** (5 steps) with rubric & verification; create vendor/talent pools mapped to L4 skills; staff roles.  
- **Feelings:** Structured & compliant.  
- **Friction:** Justifying pilot.  
- **Metrics:** Time-to-first RFP/micro-RFP; staff task success.  
- **Design Ops:** 90-day pilot MOU; metrics dashboard template.

**Decision**  
- **Actions:** Approves 3-dept pilot; SSO setup.  
- **Feelings:** Aligned.  
- **Friction:** IT review.  
- **Metrics:** SSO success; risk sign-off.  
- **Design Ops:** Security pack; data map.

**Purchase**  
- **Actions:** Pilot live; assignments posted.  
- **Feelings:** Productive.  
- **Friction:** Change management.  
- **Metrics:** Staff adoption per dept; TTFQI on vendors/talent.  
- **Design Ops:** Champion program; in-product tours.

**Retention**  
- **Actions:** Cross-dept analytics; shared pools; Zen Hub check-ins during sprints.  
- **Feelings:** Supported.  
- **Friction:** Siloing.  
- **Metrics:** Time-to-award; audit passes; expansion to N depts.  
- **Design Ops:** Poly-tenant admin; shared pools; export to archives.

---

## What stands out across personas (portable backlog → scope candidates)
- **Onboarding clarity:** Role-specific wizards (Student, Switcher, Mentor, Org/HR, Government).  
- **Auto-mapping:** Paste CV/JD → proposed L4s with editable properties.  
- **Verification strategy:** “Soft verify” first; targeted verification packs tied to outcomes.  
- **Feedback loops:** “Why not shortlisted” + “What raises your match score next.”  
- **Zen Hub hooks:** Trigger reflections after rejections/reviews/deadlines; **Well-Being Delta** tracked privately and in aggregate.  
- **Dashboards that matter:** Activation tiles (Profile %, L4 depth, Matches/Assigns, Proof cadence) + “next best action.”  
- **Fairness:** Monitor fairness gap on intros/contracts where users opt-in to share demographics; publish fairness note per release.

---

## Facts & Decisions (Part 3)
**Canonical persona clusters**
- **Individuals:** Student/Grad, Career Switcher, Senior Advisor/Expert, Mentor/Consultant, Founder-Operator.  
- **Organizations:** Scale-ups/Enterprises (HR/Talent), NGOs, Government departments.

**Ties to metrics (Part 2)**
- Every persona has explicit paths to **TTFQI**, **TTV**, and **TTSC**.  
- **PAC** is instrumented wherever values/causes influence acceptance/contract rates.  
- **SUS** and task-success thresholds apply to activation, assignment publish, and match review.  
- **Well-Being Delta** is opt-in, non-diagnostic, private by default.

**Decisions captured here**
- Kept the set to **8 concrete personas** by merging near-duplicates to reduce scope creep while preserving coverage.  
- All journeys avoid social content feeds and engagement traps; focus is on efficient, values-aligned matching.

**Open questions**
- Minimum verification set per persona (student vs senior expert vs NGO vs government).  
- Exact cohort bins for benchmarking TTSC/TTFQI (role family, seniority, region).  
- Privacy defaults for artifacts and attestations per persona.

**Approved on**  
- **Status:** Draft v0.1 (awaiting product approval)  
- **Approver:** Pavlo Samoshko  
- **Date:** —


# Proofound — Individual User Flows (MVP, Structured from Founder Narration)
_Last updated: 2025-10-31T12:52:02.294819Z_

This document turns the free‑text narration into clear, production‑ready user flows for **individual users**.  
Each flow follows a consistent mini‑spec: **Purpose • Entry • Steps • Inputs/Data • Needs & Feelings • System Support • Done • Metrics • Edge Cases**.

> **MVP rule:** Only flows required now are marked **[MVP]**. Items labeled “Future” indicate planned evolutions and are included so UX and data models stay forward‑compatible.

---

## 0. Legend — Mini‑Spec Template
- **Purpose** — Why this flow exists; the user’s intended outcome.
- **Entry** — Preconditions & primary triggers.
- **Steps** — Happy‑path sequence (what the user does & sees).
- **Inputs/Data** — Data required/created; visibility rules.
- **Needs & Feelings** — Cognitive/emotional needs to design for.
- **System Support** — UI, guidance, validation, automation, privacy.
- **Done** — Concrete exit state.
- **Metrics** — Leading indicators.
- **Edge Cases** — Exceptions, recovery, guardrails.

---

# Flows

## I‑00 Landing Page Narrative & CTA **[MVP]**
**Purpose:** Educate and inspire enough confidence to click **Sign up**.  
**Entry:** First visit (not authenticated).  
**Steps:** 1) Scroll a cohesive story (what/why/how) → 2) Lightweight proof (social trust, privacy stance) → 3) Primary CTA “Sign up”.  
**Inputs/Data:** UTM/referrer (analytics).  
**Needs & Feelings:** Clarity; trust; low cognitive load.  
**System Support:** Performance; accessible motion; “Privacy-first” copy; sticky CTA.  
**Done:** User clicks **Sign up**.  
**Metrics:** Landing→signup CTR; time to CTA.  
**Edge Cases:** Low bandwidth → static fallback.

---

## I‑01 Account Creation & Sign‑in (Email/Google/LinkedIn) **[MVP]**
**Purpose:** Let users start with their preferred auth method and frictionless recovery.  
**Entry:** From Landing CTA or Login.  
**Steps:** 1) Choose Email/Google/LinkedIn → 2) Email: enter email + set password OR magic link; SSO: confirm provider → 3) Verify email → 4) Sign in.  
**Inputs/Data:** Email; name/avatar (from SSO); session token.  
**Needs & Feelings:** Control & choice; confidence about data.  
**System Support:** Clear provider options; passwordless option; resilient email delivery; resend link; device/session management.  
**Done:** Authenticated session established.  
**Metrics:** Signup completion; verification success; first session latency.  
**Edge Cases:** SSO domain blocked; expired link → one‑click resend.

---

## I‑02 Consent & Policy with AI‑assist **[MVP]**
**Purpose:** Transparent consent for Terms, Privacy, and Verification policy.  
**Entry:** First login or when terms change.  
**Steps:** 1) Read human‑readable summaries → 2) Optional “Ask AI” quick explanation → 3) Accept required consents.  
**Inputs/Data:** Consent versions & timestamps.  
**Needs & Feelings:** Understanding; control; privacy reassurance.  
**System Support:** Plain‑language summaries; download PDFs; log consent; link to data practices.  
**Done:** All required consents recorded.  
**Metrics:** Drop‑off; time on consent.  
**Edge Cases:** Jurisdictional clauses; under‑age lockout with guidance.

---

## I‑03 First‑Run Guided Tour (Reveal UI, Zero‑State) **[MVP]**
**Purpose:** Prevent overwhelm; orient users to core areas.  
**Entry:** First successful login (or when requested later).  
**Steps:** 1) Blank canvas with styled background → reveal **Navigation** + hint → 2) Reveal **Dashboard** + hint → 3) Jump to **Profile** (empty state & hint) → 4) Show **Expertise Hub** (About + hint) → 5) Show **Matching Profile** (why it matters) → 6) Show **Zen Hub** (safety & purpose) → 7) Show **Settings** (one‑line explainer) → 8) Suggest “Start with your Profile”.  
**Inputs/Data:** Tour seen flag; per‑module “seen” state.  
**Needs & Feelings:** Calm; agency; no forced learning.  
**System Support:** Skippable; repeatable; keyboard/ARIA compatible.  
**Done:** Tour completed or dismissed; next step CTA surfaced.  
**Metrics:** Tour completion; subsequent engagement with Profile.  
**Edge Cases:** Reduced‑motion mode; partial tour resume.

---

## I‑04 Home Dashboard (Observer‑Only Snapshot) **[MVP]**
**Purpose:** Provide a non‑interactive snapshot and deep‑link to the right area.  
**Entry:** Home route after login.  
**Steps:** See cards/tiles summarizing Profile, Expertise, Matching, Zen Hub; clicking a tile deep‑links to its module.  
**Inputs/Data:** Read‑only aggregates.  
**Needs & Feelings:** Orientation; no pressure to act.  
**System Support:** Empty‑state copy per tile; “no actions here” clarity.  
**Done:** User navigates purposefully from dashboard.  
**Metrics:** Tile click‑through; bounce from home.  
**Edge Cases:** No data → tasteful placeholders.

---

## I‑05 Profile Basics (Avatar, Cover, Core Info) **[MVP]**
**Purpose:** Establish a familiar identity surface.  
**Entry:** From tour nudge or Profile.  
**Steps:** Upload avatar; set cover image; add headline, location, timezone, languages; preview → save.  
**Inputs/Data:** Images; text fields.  
**Needs & Feelings:** Safe, familiar; low friction.  
**System Support:** Image cropper; content filters; autosave drafts.  
**Done:** Basics saved.  
**Metrics:** Completion rate; time to first save.  
**Edge Cases:** Large images; offensive content → block with feedback.

---

## I‑06 Mission & Vision (Private by Default) **[MVP]**
**Purpose:** Capture purpose statements to drive values alignment.  
**Entry:** From Profile.  
**Steps:** Open modal → see guidance (“what to write”) → enter **Mission** (≤300 chars) and **Vision** (≤300) → choose visibility (private default) → save.  
**Inputs/Data:** Two short texts; visibility flag.  
**Needs & Feelings:** Reassurance; no pressure to be “perfect”.  
**System Support:** Examples; word counter; privacy explainer.  
**Done:** Statements saved; not exposed unless opted‑in.  
**Metrics:** Fill rate; later opt‑in to share.  
**Edge Cases:** Empty allowed; later edits re‑score matching.

---

## I‑07 Values & Causes (Tagged) **[MVP]**
**Purpose:** Select up to 5 **Values** and up to 5 **Causes** to inform matching.  
**Entry:** From Profile.  
**Steps:** Search typeahead OR “Browse full list” → select up to limit → rank if desired → save.  
**Inputs/Data:** Tag IDs; order.  
**Needs & Feelings:** Discovery; control; clarity.  
**System Support:** Synonyms; category browse; duplicates prevented.  
**Done:** Tags saved and visible on profile per settings.  
**Metrics:** Tag coverage; impact on match quality.  
**Edge Cases:** User can’t find term → show synonyms/nearby.

---

## I‑08 Journey — Add **Work Experience** **[MVP]**
**Purpose:** Record work with minimal friction; enable later linkage to skills & projects.  
**Entry:** Profile → Journey tab (empty‑state hint).  
**Steps:** Toggle “Work” → Organization → Role/Title → Dates → Location (optional) → **What I did** (few short sentences) → **Impact** (brief example‑guided) → **Projects** (optional, names/briefs; continuous vs time‑boxed) → Save Draft or Publish.  
**Inputs/Data:** Structured fields; short texts.  
**Needs & Feelings:** Light, honest, safe; can edit later.  
**System Support:** Example prompts (e.g., “Improved accessibility for commuters”); drafts; privacy controls.  
**Done:** Work entry saved (draft or published).  
**Metrics:** Completion; average fields filled.  
**Edge Cases:** Incomplete dates; sensitive employer → allow redaction/masking.

---

## I‑09 Journey — Add **Learning Experience** **[MVP]**
**Purpose:** Capture education/certifications and intent.  
**Entry:** Profile → Journey tab.  
**Steps:** Toggle “Learning” → Provider → Credential (if any) → Dates → **Why I chose this** (private note) → Save.  
**Inputs/Data:** Provider; credential; dates; private note.  
**Needs & Feelings:** Reflection; privacy.  
**System Support:** Examples; draft/save; privacy badge on notes.  
**Done:** Learning entry saved.  
**Metrics:** Add rate; linkage to skills later.  
**Edge Cases:** Non‑credential learning; ongoing studies.

---

## I‑10 Journey — Add **Volunteering Experience** **[MVP]**
**Purpose:** Capture service contributions and connect to values/causes.  
**Entry:** Profile → Volunteering.  
**Steps:** Organization → Project → Role → Dates → Link to Values/Causes/Mission (optional) → Save.  
**Inputs/Data:** Structured fields; tag links.  
**Needs & Feelings:** Recognition; dignity; safety.  
**System Support:** Examples; drafts; visibility controls.  
**Done:** Volunteering entry saved.  
**Metrics:** Add rate; values linkage.  
**Edge Cases:** Anonymous volunteering → obfuscate details.

---

## I‑11 Expertise Hub — Introduction & Modes **[MVP]**
**Purpose:** De‑mystify the Hub; let users choose **Guided** vs **Explore Freely**.  
**Entry:** First visit to Expertise Hub.  
**Steps:** Read **About** (collapsible) → choose a mode → proceed.  
**Inputs/Data:** Mode preference.  
**Needs & Feelings:** Confidence; no pressure.  
**System Support:** Clear one‑sentence hints; skip/redo option.  
**Done:** User selects a mode.  
**Metrics:** Mode choice ratio; completion of first skill.  
**Edge Cases:** Abandon mid‑intro → show gentle nudge later.

---

## I‑12 Expertise Hub — Taxonomy Navigation (L1→L3→L4) **[MVP]**
**Purpose:** Add skills in a top‑down, understandable way.  
**Entry:** Press **Add** on an L1 domain card.  
**Steps:** Inline picker appears → pick **L3** category (with search + scrollable list) → choose specific **L4** granular skill.  
**Inputs/Data:** Selected L1/L3/L4 IDs.  
**Needs & Feelings:** Orientation; discoverability.  
**System Support:** Descriptions; examples; “only show what I’ve added” toggle for filled items.  
**Done:** L4 skill chosen for creation.  
**Metrics:** Picks to created skills; time to first add.  
**Edge Cases:** Unfamiliar terms → tooltips; synonyms.

---

## I‑13 Skill Creation (L4) — Level, Proof, Verify, Recency, Link **[MVP]**
**Purpose:** Create a credible skill record that powers matching.  
**Entry:** From I‑12 after choosing an L4.  
**Steps:** 1) Set self‑assessed **Level** (rubric 0–5) → 2) **Attach Proof** (link/file) → 3) **Request Verification** (peer/org/auto; optional) → 4) Set **Recency** (last used) → 5) **Link to Experiences** (work/learning/volunteering) → Save.  
**Inputs/Data:** Level; proof artifacts; verifier contact; recency; link refs.  
**Needs & Feelings:** Flexibility; fairness; safety.  
**System Support:** Level definitions; privacy for proofs; save as draft; later edit; anti‑overclaim nudges.  
**Done:** L4 skill saved (with or without pending verification).  
**Metrics:** Skills per user; proof attach rate; verification uptake.  
**Edge Cases:** NDA‑bound work → private evidence notes.

---

## I‑14 Expertise Dashboard (Comes to Life) **[MVP]**
**Purpose:** Help users “see themselves” via simple charts.  
**Entry:** After adding some skills/links.  
**Steps:** Reveal each chart one‑by‑one with a hint: **what it is** and **what it’s for** (e.g., **Recency** shows freshness of competencies).  
**Inputs/Data:** Aggregated skill metadata.  
**Needs & Feelings:** Insight; motivation; no overwhelm.  
**System Support:** Mock data preview for empty states; accessible charts; tooltips.  
**Done:** User understands snapshot; can deep‑link to edit.  
**Metrics:** Chart views; click‑through to edits.  
**Edge Cases:** Sparse data → show “how to improve this” tips.

---

## I‑15 Matching Profile — Focus Areas & Weighting **[MVP]**
**Purpose:** Let users decide *what* to match for and *how* to weight values vs. skills.  
**Entry:** Matching Profile (empty).  
**Steps:** 1) Choose areas/roles/sectors → 2) Set **alignment weighting**: **Mission/Impact** ↔ **Skills/Tools** → 3) Review preview sample matches.  
**Inputs/Data:** Focus tags; weighting parameters.  
**Needs & Feelings:** Agency; dignity; equality in matching.  
**System Support:** Live preview; clear copy about philosophy of mutual choice.  
**Done:** Preferences saved.  
**Metrics:** Edit rate; subsequent match CTR.  
**Edge Cases:** Over‑narrow focus → guidance to broaden.

---

## I‑16 Matching Profile — Practical Constraints & Visibility **[MVP]**
**Purpose:** Capture constraints without exposing sensitive details.  
**Entry:** Continuing I‑15.  
**Steps:** Set salary range, location, work setting, contract type; choose volunteering openness; set **what is visible** to orgs (e.g., only show “salary overlaps”, not the exact range).  
**Inputs/Data:** Constraints; visibility flags.  
**Needs & Feelings:** Safety; no low‑balling; fairness.  
**System Support:** Clear visibility matrix; consent checkboxes.  
**Done:** Constraints stored; visibility rules applied in UI/APIs.  
**Metrics:** Profile completeness; complaint rate about visibility.  
**Edge Cases:** Multi‑currency ranges; remote‑only preferences.

---

## I‑17 Matching Results & Refresh Cadence **[MVP]**
**Purpose:** Deliver matches on the user’s terms and cadence.  
**Entry:** After I‑15/I‑16.  
**Steps:** Pick refresh schedule (daily/weekly/monthly) → View two buckets: **Assigned Matches** (org can see you) & **Open Opportunities** (near‑fit, for exploration) → Save interesting items.  
**Inputs/Data:** Schedule preference; candidate/assignment lists.  
**Needs & Feelings:** Flexibility; discovery beyond strict prefs.  
**System Support:** Filters; snooze; save searches.  
**Done:** User has an actionable list; preferences respected.  
**Metrics:** Save/apply rates; bucket engagement split.  
**Edge Cases:** No matches → suggest tweaks; stale posts flagged.

---

## I‑18 Rank Transparency & Assignment Detail **[MVP]**
**Purpose:** Show fit reasons and where the user ranks when surfaced to an org.  
**Entry:** Open a matched assignment.  
**Steps:** See **Why you match** subscores + **Your rank among top X** candidates; review role; consent to proceed or dismiss.  
**Inputs/Data:** Match vector; rank info (bounded).  
**Needs & Feelings:** Transparency; fairness.  
**System Support:** Clear explanation; guardrails against gaming.  
**Done:** Proceeded or dismissed with feedback.  
**Metrics:** View→proceed rate; dismissal reasons.  
**Edge Cases:** Rank unavailable (privacy) → show band (e.g., “Top 5”).

---

## I‑19 Express Interest / Consent to Share **[MVP]**
**Purpose:** Give explicit consent to be visible/approachable for a specific assignment.  
**Entry:** From I‑18.  
**Steps:** Review what will be shared → confirm consent → appear in org’s ranked list.  
**Inputs/Data:** Consent event; fields shared per visibility settings.  
**Needs & Feelings:** Control; informed sharing.  
**System Support:** Field‑level visibility summary; one‑tap revoke.  
**Done:** Candidate listed for the org.  
**Metrics:** Consent rate; revoke rate.  
**Edge Cases:** Consent timeout; visibility changes mid‑process.

---

## I‑20 Secure Messaging (Text‑Only, No Paste) **[MVP]**
**Purpose:** Lightweight, private, auditable conversation with the org.  
**Entry:** Org contacts user or after consent.  
**Steps:** Open thread → type messages (pasting disabled by design) → optional reveal of additional fields (controlled by the user).  
**Inputs/Data:** Message texts; reveal events.  
**Needs & Feelings:** Efficiency; safety; minimalism.  
**System Support:** No attachments; anti‑spam; content moderation; typing indicators; read receipts.  
**Done:** Clarifications exchanged OR interview scheduled.  
**Metrics:** Response latency; thread duration.  
**Edge Cases:** Attempts to share files/links → gentle block note.

---

## I‑21 Interview Scheduling (One 30‑min Limit) **[MVP]**
**Purpose:** Coordinate a single 30‑minute interview, quickly.  
**Entry:** From messaging.  
**Steps:** Propose/accept slots → confirm 30‑min event (within **7 days** of match agreement) → calendar sync → video call link generated (Zoom or Google Meet).  
**Inputs/Data:** Timezones; calendars (optional); video call platform preference (Zoom or Google Meet).  
**Needs & Feelings:** Certainty; fairness; speed.  
**System Support:** Timezone auto‑convert; reminders; reschedule allowed once; automatic video call link generation via Zoom or Google Meet integration.  
**Done:** Interview held within SLA.  
**Metrics:** Time match→interview; no‑show rate.  
**Edge Cases:** Panel interviews; candidate/org declines → close loop.

---

## I‑22 Decision Window & Feedback **[MVP]**
**Purpose:** Ensure timely closure and learning.  
**Entry:** After interview.  
**Steps:** Both sides respond **within 48 hours**: accept or decline; if assignment closes, **top matched candidates receive personalized feedback**.  
**Inputs/Data:** Decision; feedback notes.  
**Needs & Feelings:** Equality; closure; growth.  
**System Support:** Deadlines; templated, helpful feedback prompts.  
**Done:** Accepted engagement OR respectful decline with feedback.  
**Metrics:** SLA adherence; feedback quality score.  
**Edge Cases:** Silence → automatic expiry with explanation.

---

## I‑23 Settings — Account & Privacy **[MVP]**
**Purpose:** Manage identity, security, and privacy like any modern platform.  
**Entry:** Settings.  
**Steps:** Change email, phone, password; manage sessions; toggle visibility defaults; notification preferences.  
**Inputs/Data:** Contact; credentials; prefs.  
**Needs & Feelings:** Familiarity; control.  
**System Support:** 2FA; device list; irreversible action warnings.  
**Done:** Settings saved.  
**Metrics:** Password reset success; session revokes.  
**Edge Cases:** Compromised account → forced reset flow.

---

## I‑24 Data Portability — **Export JSON** / **Import JSON** **[MVP]**
**Purpose:** Let users own their data offline and restore it later.  
**Entry:** Settings → Data.  
**Steps:** **Export**: generate JSON → download. **Import**: upload valid JSON → preview what will be restored → confirm.  
**Inputs/Data:** Profile JSON schema.  
**Needs & Feelings:** Ownership; trust.  
**System Support:** Schema versioning; validation; redaction of secrets.  
**Done:** File exported OR profile restored.  
**Metrics:** Export/Import counts; validation errors.  
**Edge Cases:** Mismatched schema version → guided migration.

---

## I‑25 Delete Account (Immediate, No Grace Period) **[MVP]**
**Purpose:** Allow irreversible exit at user’s request.  
**Entry:** Settings → Danger Zone.  
**Steps:** Read consequences → type confirmation phrase → optional export reminder → delete immediately.  
**Inputs/Data:** Confirmation; audit log.  
**Needs & Feelings:** Autonomy; clarity.  
**System Support:** Final double‑check; email confirmation of deletion.  
**Done:** Account and personal data deleted per policy.  
**Metrics:** Deletion completion; post‑delete support contacts.  
**Edge Cases:** Legal holds; queued exports blocked with notice.

---

## I‑26 Zen Hub — Quick Check‑in & Mood‑Responsive UI **[MVP]**
**Purpose:** Provide a **safe, private** space for self‑check‑ins; adapt UI to the user’s state.  
**Entry:** Zen Hub tab.  
**Steps:** One‑click “How do you feel now?” → mood influences UI density (e.g., high anxiety → show only essential elements) → optional 1‑minute practice (no streak pressure).  
**Inputs/Data:** Mood check‑in; timestamp.  
**Needs & Feelings:** Safety; calm; control.  
**System Support:** Extra privacy guardrails; no diagnostic claims; no gamified pressure.  
**Done:** Check‑in recorded; user optionally completes a short practice.  
**Metrics:** Check‑in frequency; abandonment rate.  
**Edge Cases:** Crisis signals → show local resources link (non‑diagnostic).

---

## I‑27 Zen Hub — Established, Lightweight Self‑Assessments **[MVP]**
**Purpose:** Offer quick, recognized self‑assessments for personal insight (not medical).  
**Entry:** Zen Hub → Assessments.  
**Steps:** Pick brief questionnaire → complete → see visualized result on private dashboard.  
**Inputs/Data:** Questionnaire answers; scores.  
**Needs & Feelings:** Clarity; validation; strict privacy.  
**System Support:** Evidence‑based sources; disclaimers; export to private notes.  
**Done:** Result stored privately; user informed.  
**Metrics:** Completion rate; return cadence.  
**Edge Cases:** User distress → optional break/snooze UI.

---

## I‑28 Zen Hub — Work Schedule & Burnout Guardrails **[MVP]**
**Purpose:** Let users log schedules and receive gentle balance nudges.  
**Entry:** Zen Hub → Schedule.  
**Steps:** Enter weekly schedule + side projects/volunteering → see total load → optional mild alerts when exceeding thresholds.  
**Inputs/Data:** Hours; categories.  
**Needs & Feelings:** Prevention; autonomy.  
**System Support:** Private by default; thresholds editable; dismissible alerts.  
**Done:** Schedule saved; alerts configured.  
**Metrics:** Alert dismiss/acknowledge; hour trends.  
**Edge Cases:** Shift workers; irregular weeks.

---

## I‑29 Zen Hub — Toolkit (External Resources) **[MVP]**
**Purpose:** Curate cards that link to external wellbeing resources (mostly free).  
**Entry:** Zen Hub → Explore.  
**Steps:** Browse cards (e.g., Headspace, Sadhguru resources, yoga classes) → open external link.  
**Inputs/Data:** Click history (local analytics).  
**Needs & Feelings:** Discovery; choice; privacy.  
**System Support:** Clear “external link” labeling; content safety screening.  
**Done:** User opens a resource or saves it.  
**Metrics:** Click‑through; saves.  
**Edge Cases:** Paywalled items → label clearly.

---

## I‑30 Zen Hub — Local In‑Person Discovery **[MVP]**
**Purpose:** Surface nearby wellbeing events/classes to foster human connection.  
**Entry:** Zen Hub → Local.  
**Steps:** Share location (optional) → see list/map of nearby events → save or open link.  
**Inputs/Data:** City/approx location (consented).  
**Needs & Feelings:** Safety; relevance; opt‑in.  
**System Support:** Strict consent; coarse geolocation; “clear my location” control.  
**Done:** Event saved or opened externally.  
**Metrics:** Opt‑in rate; click‑through.  
**Edge Cases:** No local data → suggest online options.

---

# Notes for Engineering & Design
- Flows **I‑11 → I‑14** constrain the Expertise Hub to a top‑down add path (L1→L3→L4) while still allowing later linkage of skills to Journey items; ensure data model supports many‑to‑many.
- Messaging (I‑20) must **block paste & file uploads by design**; log attempts for UX tuning.
- Rank transparency (I‑18) should display **rank bands** if exact rank would reduce fairness or invite gaming.
- Decision SLAs (I‑21/I‑22): enforce reminders/escalations; allow explicit “decline” from either side.
- Data portability (I‑24) requires a **versioned JSON schema** and a safe import preview.
- Zen Hub data should be **extra‑protected** (scoped encryption, segregated storage, minimized telemetry).



# Proofound — Organization User Flows (MVP)
**Purpose:** Translate the narrated CEO journey into **distinct, production-ready organization user flows** for the MVP.  
**Scope:** Organization-side only (companies/SMEs). Individual flows are out-of-scope here.  
**Version:** 1.0 • **Date:** 2025-10-31

---

## How to read this document
Each flow includes:
- **ID & Name** — Stable reference you can map in Figma/dev issues.
- **Goal** — What the user is trying to achieve.
- **Entry** — Where the flow begins (preconditions).
- **Happy-path steps** — Canonical sequence to success.
- **Success** — Exit condition / state transition.
- **Key data** — Fields/entities created or updated.
- **Edge cases** — Errors, branches, or special considerations.
- **MVP** — Whether this belongs to MVP scope.

> This file is built directly from the provided narration. Wording is normalized for production documentation; no features were added beyond the narrative’s intent.

---

## Global assumptions from the narration
- **Free trial** exists for organizations; shows concise value cards before commitment.
- **Privacy & data handling**: legally public org data is public by default; sensitive/contractual data remains private.
- **First-run guidance** uses a **gradual reveal** of UI (nav, dashboard cards) with **concise hints** and **mock data** during onboarding only.
- **Account modes**: a person can hold an **Individual** account and also act as an **Org Representative**; easy switching is required.
- **Trial seats**: free trial permits **up to 5 seats** (CEO + 4).
- **Interview policy**: one **30‑minute** interview per candidate; **7 days** to conduct after match acceptance; decision within **48 hours**; feedback required.
- **Matching results**: **Top 5** candidates for free tier; if the pool is too small, platform compiles best matches by **72 hours** post‑publish.

---

# Flows

## O‑01 Landing → Trial Intent
**Goal:** Understand value and decide to try the platform.  
**Entry:** Visitor reads the shared landing page (for individuals & orgs).  
**Happy‑path steps:** Landing → “Start Free Trial (Organizations)” → Value cards (concise).  
**Success:** User proceeds to org sign‑up.  
**Key data:** None.  
**Edge cases:** TL;DR behavior—value cards must be scannable; avoid walls of text.  
**MVP:** Yes.

## O‑02 Organization Sign‑Up & Email Verification
**Goal:** Create an org representative account cleanly.  
**Entry:** CTA from O‑01.  
**Happy‑path steps:** Choose **Organization account** → enter **name, work email, title, password** → submit → receive **verification email** → verify.  
**Success:** Account verified; user can sign in.  
**Key data:** User(OrgRep), Org placeholder.  
**Edge cases:** Email deliverability; password policy; duplicate email.  
**MVP:** Yes.

## O‑03 Minimal Org Setup (Slug & Names)
**Goal:** Provide only essentials before seeing value.  
**Entry:** First sign‑in after O‑02.  
**Happy‑path steps:** Form with **org slug**, **display name**, **legal name** → save.  
**Success:** Org created with minimal profile; hint that more details can be added later.  
**Key data:** Org.slug, Org.name, Org.legal_name.  
**Edge cases:** Slug collision; reserved words.  
**MVP:** Yes.

## O‑04 Trial Activation & Consent
**Goal:** Start free trial with clear terms and reassurance.  
**Entry:** Post O‑03.  
**Happy‑path steps:** Show **value cards** → accept **ToS/Privacy** → optional note on **security/privacy contact** → start trial.  
**Success:** Trial active; seat limit set.  
**Key data:** Trial.start_at, Trial.end_at, Trial.seat_cap=5.  
**Edge cases:** Decline terms → return to dashboard with limited access.  
**MVP:** Yes.

## O‑05 First‑Run Guided Tour (Nav + Dashboard)
**Goal:** Prevent overwhelm; explain layout & purpose swiftly.  
**Entry:** Trial starts / first dashboard view.  
**Happy‑path steps:** Gradual reveal of **nav bar** (with hint) → **dashboard cards** one by one with **mock data** while hints visible → on dismiss, cards revert to **empty defaults**.  
**Success:** Tour completed or skipped; user orients.  
**Key data:** Dismissed_tutorial flags.  
**Edge cases:** Skip/replay; accessibility (keyboard, reduced motion).  
**MVP:** Yes.

## O‑06 Structure Overview: Tabs & Quick Intros
**Goal:** High‑level understanding of what exists (Profile, Assignments, Atlas, Team, Settings).  
**Entry:** End of O‑05 or via “Show me around.”  
**Happy‑path steps:** One‑screen intro per tab → concise “why it matters.”  
**Success:** User navigates intentionally.  
**Key data:** None.  
**Edge cases:** Do not deep‑dive yet; keep scannable.  
**MVP:** Yes.

## O‑07 Account‑Mode Linking & Switching (Individual ↔ Org Rep)
**Goal:** Allow a person to connect personal & org representative identities and switch easily.  
**Entry:** From header switcher or settings.  
**Happy‑path steps:** Link accounts (work email ↔ personal identity) → switch context via header control.  
**Success:** Context reflects chosen mode.  
**Key data:** LinkedAccount(user_id_personal, user_id_orgrep).  
**Edge cases:** Org policy forbids linking; visibility rules differ per mode.  
**MVP:** Yes.

## O‑08 Team Setup: Departments, Hierarchy, Seats
**Goal:** Model company structure & invite collaborators (trial cap = 5 seats).  
**Entry:** Team tab.  
**Happy‑path steps:** Create **departments** → set **hierarchy** → **invite members** by work email → assign **roles** and **departments**.  
**Success:** Team active with roles and seat usage displayed.  
**Key data:** Dept tree, Invites, Roles/Permissions.  
**Edge cases:** Seat cap reached; resend invite; revoke access.  
**MVP:** Yes.

## O‑09 Org Profile Completion (Core Data)
**Goal:** Fill sensitive but essential org details with reassurance.  
**Entry:** Profile tab.  
**Happy‑path steps:** Enter **org number/registry**, **locations**, **industries**, **legal structure**, **ownership & voting rights**; add **mission/vision (free text)**, **values/causes (preset tags)**; upload **logo & cover**.  
**Success:** Profile saved; public vs private fields respected.  
**Key data:** Org registry IDs; governance & transparency fields.  
**Edge cases:** Public‑by‑law defaults vs confidential flags.  
**MVP:** Yes.

## O‑10 Impact Areas — Create, Edit, Publish
**Goal:** Declare public impact areas with strong guidance.  
**Entry:** Profile → Impact Areas.  
**Happy‑path steps:** Add **impact area** via dialog → field‑level hints → **save draft** → **publish** (public by design) → edit later.  
**Success:** Impact areas visible on public org profile.  
**Key data:** ImpactArea entities (title, scope, metrics optional).  
**Edge cases:** Draft vs published; versioning.  
**MVP:** Yes.

## O‑11 Projects — Create, Edit, Confidentiality
**Goal:** Track org projects with confidentiality controls.  
**Entry:** Profile → Projects.  
**Happy‑path steps:** Create project (name, scope, team, status) → mark **confidential/NDA** if needed → save draft/publish (respect visibility).  
**Success:** Project stored; visibility enforced.  
**Key data:** Project, Confidentiality flags, Team links.  
**Edge cases:** Redactions on public views; access control for private projects.  
**MVP:** Yes.

## O‑12 Bindings: Link Projects/Impact Areas ↔ Team & Competencies
**Goal:** Connect work and impact to people and competencies.  
**Entry:** From Project/ImpactArea editors or Atlas/Team views.  
**Happy‑path steps:** Select **project/impact area** → link **team members** and **competencies** (from Atlas) → save.  
**Success:** Relationships appear in Team and Atlas.  
**Key data:** Link tables (Project↔User, ImpactArea↔Competency).  
**Edge cases:** Permission checks; circular edits.  
**MVP:** Yes.

## O‑13 Assignment Creation (5‑Step) with Stakeholders
**Goal:** Define a high‑quality assignment aligned to business value.  
**Entry:** Assignments → “Create First Assignment.”  
**Happy‑path steps:**  
1) **Business Value (BV)** — creator assigns **stakeholders** (e.g., CTO/HR/Lead/CEO) and drafts BV; stakeholders can review/comment.  
2) **Target Outcomes (TO)** — measurable outcomes & improvement targets.  
3) **Weight Matrix** — relative weights: **mission/purpose fit**, **expertise depth**, **work mode** (onsite/hybrid/remote; hard/soft requirement).  
4) **Practicals** — budget/salary range, location, availability window.  
5) **Expertise Mapping** — pick competencies (Atlas) and tie each to **BV/TO**; optional **education requirements** must include a short **justification**.  
**Success:** Validated draft ready to publish.  
**Key data:** Assignment with stakeholders, weights, mappings, education justification texts.  
**Edge cases:** Missing stakeholder input; conflicting weights; justification omitted when education is marked “required.”  
**MVP:** Yes.

## O‑14 Publish Assignment (Free Tier Constraints)
**Goal:** Make the assignment discoverable and ready for matching.  
**Entry:** From O‑13.  
**Happy‑path steps:** Review summary → confirm visibility → publish.  
**Success:** Assignment live; matching pipeline starts.  
**Key data:** Assignment.status=Published; subscription tier.  
**Edge cases:** Editing after publish; tier upgrade prompt.  
**MVP:** Yes.

## O‑15 Intake Matches & Review
**Goal:** Receive and evaluate best candidates quickly.  
**Entry:** After O‑14; matching engine runs.  
**Happy‑path steps:** System compiles **Top 5** candidates (free tier) immediately or within **72h**; show **ranked list** with **subscores** and “why this match.”  
**Success:** Shortlist created.  
**Key data:** CandidateMatch(score, subscores, rationale).  
**Edge cases:** Insufficient pool → partial list + ETA; stale profiles.  
**MVP:** Yes.

## O‑16 Candidate Pipeline: Message & Schedule Single Interview
**Goal:** Move shortlisted candidates through one structured touchpoint.  
**Entry:** From O‑15 shortlist.  
**Happy‑path steps:** Open **message thread** → propose **30‑min** slot(s) via Zoom or Google Meet within **7 days**; system generates video call link automatically; auto‑invite **assigned stakeholders**; confirm time.  
**Success:** Interview completed.  
**Key data:** Conversation, Calendar event, Participants, Video call link.  
**Edge cases:** Time‑zone collisions; no‑shows; reschedule once.  
**MVP:** Yes.

## O‑17 Decision & Feedback (48h SLA)
**Goal:** Decide promptly and provide personal feedback.  
**Entry:** After O‑16.  
**Happy‑path steps:** Collect stakeholder inputs → choose **hire/advance/hold/reject** → send **personalized feedback** to each candidate within **48h**.  
**Success:** Candidate informed; pipeline updated.  
**Key data:** Decision records, Feedback artifacts.  
**Edge cases:** Breach of SLA → reminder/escalation; templated but personalized guidance.  
**MVP:** Yes.

## O‑18 Enterprise Expertise Atlas: Intro & Dashboard
**Goal:** Familiarize with org‑level Atlas without overload.  
**Entry:** Atlas tab.  
**Happy‑path steps:** Collapsible **About** (value & future use cases) → gradual reveal of dashboard **graphs with mock data** → revert to empty after tour.  
**Success:** User understands purpose; no data required yet.  
**Key data:** Tutorial flags.  
**Edge cases:** Skip/replay; performance on empty datasets.  
**MVP:** Yes (intro only).

## O‑19 Enterprise Atlas: L1→L4 Competencies (Show‑Only‑Added)
**Goal:** Create and manage org competencies with progressive disclosure.  
**Entry:** Atlas after O‑18.  
**Happy‑path steps:** Show **six L1 domain cards** → on click, list **only L2 categories that have items added** → select L2 to see only added **L3** → expand **L4 competencies**; add/edit competencies; bind to **Impact Areas** and **Projects**.  
**Success:** Competency structure saved; bindings visible.  
**Key data:** Competency(L1‑L4), bindings.  
**Edge cases:** Permissions; bulk edits; taxonomy updates.  
**MVP:** Yes (foundational authoring).

## O‑20 Settings, Security & Data Lifecycle
**Goal:** Manage org security and compliance with strong safeguards.  
**Entry:** Settings tab or header menu.  
**Happy‑path steps:** Change password; setup **MFA**; manage privacy defaults; manage team/roles; **export JSON** of org data; **delete org** with multi‑step confirmations and manual text entry.  
**Success:** Settings applied; exports/downloads complete; deletions irreversible.  
**Key data:** Security settings, Export package, Deletion logs.  
**Edge cases:** Legal hold blocking deletion; restore from JSON (future); role‑based access to sensitive actions.  
**MVP:** Yes (MFA, privacy, export, guarded delete).

---

## Appendix A — Entities & References (from narration)
- **Org**: slug, name, legal_name, registry_ids, locations, industries, legal_structure, ownership/voting, mission, vision, values, causes, pledges, logos, cover.
- **User(OrgRep)**: name, work_email, title, role.
- **Team/Dept**: tree structure; roles/permissions; seat cap in trial.
- **ImpactArea**: public by default; fields guided by hints; draft/publish states.
- **Project**: name, scope, team, status; confidentiality/NDA flags; draft/publish.
- **Competency (L1–L4)**: taxonomy items; bindings to ImpactArea/Project.
- **Assignment**: BV, TO, weights, practicals, expertise mapping, education justification, stakeholders.
- **Match**: score, subscores, rationale; rank.
- **Interview**: 30‑min; Zoom; participants; scheduled ≤7 days after acceptance.
- **Decision/Feedback**: outcome with personal feedback ≤48h SLA.
- **Settings/Security**: MFA, privacy, export JSON, deletion safeguards.

## Appendix B — SLA & Trial Rules
- **Free tier:** Top 5 candidates; **≤72h** to populate if pool is small; **5 seats** (CEO + 4).  
- **Interview:** One **30‑minute** slot; **7 days** window to conduct after match acceptance.  
- **Decision:** **48 hours** to inform candidates with personalized feedback.  



# PRD — MVP — Part 5: Scope (MVP Features)

> **Scope philosophy (for this MVP):** “Features” are **distinct, value-creating capabilities** beyond commodity plumbing (e.g., auth, basic profile, settings). Below separates **Individual** and **Organization** features, each with **Why Now** (from Part 1), **Acceptance Criteria** (pulling from Part 2 metrics and Part 4 flows), and **MoSCoW** priority for MVP.

---

## 5.1 Individual Features

### F1 — **Purpose Block** (Mission • Vision • Values • Causes) within Profile
**Why Now:** Replaces performative CVs with authentic, values-first signals that improve match quality and reduce bias in noisy/AI-inflated markets.  
**Acceptance Criteria:**  
- User can create/edit mission, vision, values (≤5), and causes (≤5) with per-field visibility controls.  
- Purpose signals are ingested by the matching engine and visible in a **Match Detail** with **PAC (Purpose-Alignment Contribution)** shown.  
- Audit trail for edits; exportable as a public snippet (optional).  
- **SUS ≥ 75** for editing flow; completion rate ≥ 85% among new users who start the block.  
**MoSCoW:** **Must** (MVP); **Could:** bulk import from CV/LinkedIn text.

---

### F2 — **Customizable Dashboard** (Tiles from key hubs)
**Why Now:** Reduces cognitive load and time-to-value through a single, user-curated view.  
**Acceptance Criteria:**  
- Add/remove/reorder tiles for: Matches, Applications/Intros, Expertise depth, Evidence/Artifacts, Zen Hub, Next Best Action.  
- Dashboard loads < 2.0s P75 with cohort baseline volumes.  
- **Task success ≥ 90%** for add/remove tile; **drop-off < 10%** in final two steps.  
- Users can mute Zen Hub tiles without affecting underlying data.  
**MoSCoW:** **Must** (core tiles); **Should:** per-persona presets; **Could:** multiple layouts.

---

### F3 — **Expertise Atlas** (L1→L4 taxonomy + L4 properties & proofs)
**Why Now:** Moves from keyword CVs to structured, high-signal expertise representation that AI can’t trivially game.  
**Acceptance Criteria:**  
- Users can add ≥ 10 L4 skills via guided flow or import; edit L4 properties (level, months, proof links/files).  
- Auto-suggest L4s from pasted CV/JD with explain-why; user acceptance/edit-in-place.  
- Time-to-activation (profile matchable) **≤ 20 minutes** P50 for first-time users.  
- Event tracking on add/edit; visible **Expertise depth** tile on Dashboard.  
**MoSCoW:** **Must** (manual add + basic auto-suggest); **Should:** Gap Map basic; **Could:** bulk CSV import.

---

### F4 — **Matching Hub** (values-aware automated matching)
**Why Now:** Shrinks search overhead for both sides, targeting **TTFQI** and **TTSC** improvements.  
**Acceptance Criteria:**  
- Generates ranked shortlists with composite score and **PAC** component.  
- **TTFQI median ≤ 72 hours** for at least one target cohort after activation (Part 2).  
- Inline “Why this match” with editable constraints (location, availability, verification gates) and quick actions (intro, pass, snooze).  
- **Fairness note** per release with cohort checks where users opt-in to share demographics.  
**MoSCoW:** **Must** (shortlist + why + quick actions); **Should:** snooze/feedback loops; **Could:** experiment flags for alternative scoring.

---

### F5 — **Zen Hub** (well-being center with extra privacy)
**Why Now:** Reduces anxiety and improves sense of control during volatile job searches (Part 1).  
**Acceptance Criteria:**  
- Opt-in, non-diagnostic 1–5 check-ins (stress, sense of control) with private-by-default storage.  
- Reflections linked to milestones (rejection, interview, offer).  
- **Well-Being Delta** reported only in aggregate to the user; no use in ranking other users.  
- Clear privacy boundary banner; separate data partition in analytics.  
**MoSCoW:** **Must** (check-ins + reflections + privacy); **Could:** guided exercises library.

---

### F6 — **Granular Visibility & Boundary Controls**
**Why Now:** Trust and safety: users choose what’s visible to whom to avoid performative pressure and bias.  
**Acceptance Criteria:**  
- Field-level visibility (public, link-only, match-only, private) for purpose, artifacts, and selected L4s.  
- One-click **Redact name/photo** mode for blinded previews.  
- Privacy settings surfaced in relevant flows (purpose edit, artifact upload, match review).  
**MoSCoW:** **Must** (field-level + redact); **Could:** audience presets.

---

### F7 — **Verification & Attestations (v1)**
**Why Now:** Credibility without heavy gatekeeping; reduces noise for orgs and anxiety for candidates.  
**Acceptance Criteria:**  
- Users can request **peer/mentor attests** to artifacts or L4s via magic link.  
- Assignment-introduced **verification gates** are displayed pre-intro (e.g., ID, portfolio, reference).  
- Time-to-first verified proof P50 **≤ 7 days** for users who request it (from Persona flows).  
**MoSCoW:** **Should** (soft verify/attest); **Could:** ID or employment verification later.

---

## 5.2 Organization Features

### O1 — **Purpose Block** (Mission • Vision • Values • Causes) within Org Profile
**Why Now:** Signals values and impact aims to attract aligned talent; supports purpose-aware matching.  
**Acceptance Criteria:**  
- Create/edit mission, vision, values (≤5), causes (≤5); visibility controls.  
- Appears in **Match Detail**; contributes to **PAC** in scoring.  
**MoSCoW:** **Must**.

---

### O2 — **Structure Block** (Org structure & roles overview)
**Why Now:** Clarifies context and reporting lines; improves expectation alignment.  
**Acceptance Criteria:**  
- Add departments/teams; link to Assignments; export simple org map.  
**MoSCoW:** **Should** (basic); **Could:** import from HRIS later.

---

### O3 — **Culture Block** (work norms, collaboration)
**Why Now:** Reduces mismatches that cause churn and anxiety; supports inclusive hiring.  
**Acceptance Criteria:**  
- Define norms (e.g., async/sync, meeting load, tools); accessibility commitments.  
- Visible to candidates pre-intro.  
**MoSCoW:** **Should**.

---

### O4 — **Impact Block** (outcomes & beneficiaries)
**Why Now:** Evidence for talent motivation and, for NGOs, funders.  
**Acceptance Criteria:**  
- Create “Impact entries” with metrics and artifacts; export **Evidence Pack** (PDF).  
**MoSCoW:** **Should** (basic); **Could:** donor/investor view analytics.

---

### O5 — **Projects Block** (initiatives & artifacts)
**Why Now:** Practical signal of what work looks like.  
**Acceptance Criteria:**  
- List projects, link to artifacts and Assignments; basic status tags.  
**MoSCoW:** **Should**.

---

### O6 — **Enterprise Expertise Hub** (org capabilities mapped to L1→L4)
**Why Now:** Structured demand-side skill map for precise matching; reduces JD ambiguity.  
**Acceptance Criteria:**  
- Declare capability domains; map required L4s; see coverage vs team.  
- JD paste → suggested L4s with explain-why.  
**MoSCoW:** **Must** (declare + suggest); **Could:** team coverage analytics.

---

### O7 — **Assignment Creation (5-Step)** with Verification Gates
**Why Now:** Standardized, efficient creation of high-signal roles; improves TTFQI and TTSC.  
**Acceptance Criteria:**  
- 5 steps: (1) Role & outcomes, (2) Must/Nice skills (L4), (3) Verification gates, (4) Logistics (location/time/comp), (5) Review & publish.  
- **Time-to-publish P50 ≤ 15 minutes**; task success ≥ 90%; drop-off < 10% on final steps.  
**MoSCoW:** **Must**.

---

### O8 — **Company Dashboard** (pipeline & outcomes)
**Why Now:** Focuses managers on throughput, not process churn.  
**Acceptance Criteria:**  
- Tiles for: Open Assignments, Shortlists, Intros pending, TTSC trend, Fairness note, Next actions.  
- Loads < 2.0s P75 at baseline volumes.  
**MoSCoW:** **Must** (core tiles); **Could:** custom layouts later.

---

### O9 — **Team Management Hub**
**Why Now:** Scales usage beyond a single HR owner; supports permissions and accountability.  
**Acceptance Criteria:**  
- Invite members; roles/permissions for creating assignments, viewing candidates, exporting data.  
- SSO-ready config placeholder.  
**MoSCoW:** **Must** (roles & invites); **Could:** SSO/SCIM later.

---

### O10 — **Organization Type Differentiation** (For‑profit vs Non‑profit)
**Why Now:** Enables tailored defaults, language, and future compliance/reporting.  
**Acceptance Criteria:**  
- Required selection at org creation; stored as a first-class attribute.  
- Toggles copy and minor defaults (e.g., “donors” vs “investors”) without forking code paths.  
**MoSCoW:** **Must** (flag + UX copy); **Could:** governance-specific templates later.

---

## 5.3 Out of Scope (confirming feature boundaries)
- Social **content feeds** and engagement mechanics.  
- Clinical/diagnostic mental-health tooling (Zen Hub remains non-diagnostic).  
- Deep HRIS/ATS integrations beyond simple exports/placeholders in MVP.  
- Automated compensation benchmarking; culture scoring; legal/contracting workflows.

---

## 5.4 Cross-Feature Acceptance Gates (MVP “Done” hooks)
- **Activation thresholds** defined and enforced for both Profiles and Assignments.  
- **TTFQI**, **TTV**, **TTSC** instrumentation live; baseline dashboards populated.  
- **SUS** study executed on activation and assignment flows; targets from Part 2 met.  
- **Fairness note** generated from cohort checks (opt-in demographics).  
- **Privacy review** passed for Zen Hub and visibility controls; redaction works in previews.

---

## 5.5 MoSCoW Summary (MVP)
- **Must:** F1, F2, F3, F4, F5, F6; O1, O6, O7, O8, O9, O10.  
- **Should:** F7; O2, O3, O4, O5.  
- **Could:** Bulk import/export niceties; richer analytics; SSO/SCIM; donor/investor views; exercises library.

---

## Facts & Decisions (Part 5)
- **Features vs plumbing:** Auth, base profile, settings, messaging basics are **non-features** (plumbing) and assumed present.  
- **Values-aware matching:** Purpose signals are first-class (PAC) and must never be used to penalize or exclude protected groups.  
- **Zen Hub boundary:** Strictly non-diagnostic, private-by-default; never used to rank matches.  
- **Org type flag:** Mandatory at creation, enabling tailored copy and presets without branching the platform.

**Open Questions**
- Minimum verification set per persona/org in MVP (tie to Part 3).  
- Exact fairness checks & thresholds to include in the “fairness note.”  
- Cohort bins for TTSC/TTFQI dashboards (role, seniority, region) to finalize with data model.

**Approval**
- **Status:** Draft v0.1 (awaiting product approval)  
- **Approver:** Pavlo Samoshko  
- **Date:** —


# PRD — MVP — Part 6: Out of Scope

> **Purpose:** Keep the MVP tight and prevent **stealth bloat** (quiet, incremental scope creep that dilutes focus and delays launch). Everything below is **post‑MVP** unless explicitly re-scoped later.

## 6.1 Excluded Product Capabilities (MVP)
- **Social content feeds** and engagement mechanics (likes, follows, vanity counters).  
- **Clinical/diagnostic mental‑health tools** (therapy/coaching claims, screenings); using well‑being data to rank users.  
- **Deep integrations**: full ATS/HRIS/CRM or email inbox integrations; **SSO/SCIM production** rollout (placeholders only).  
- **Hard verification**: background checks, KYC/ID, employment verification (beyond **soft attestations**).  
- **Payments & contracting**: payouts, invoicing/escrow, offer/comp negotiation, e‑signature, payroll.  
- **Advanced analytics**: cohort experimentation platform, causal fairness analysis; public leaderboards.  
- **Compliance programs**: SOC 2/ISO 27001 audits; strict **data residency** controls beyond basic privacy.  
- **Mobile apps** (iOS/Android) and offline mode.  
- **Localization at scale** (beyond base language + standard formats/timezones).  
- **Public directories/SEO landing farms** for user/org profiles.  
- **Generative CV/cover‑letter tools**; personality/culture **scoring** beyond explicit constraints.  
- **Heavy content libraries** (courses/exercises) in Zen Hub; only light, opt‑in reflections ship in MVP.

## 6.2 Excluded Geographies / Segments (MVP)
- Government-grade deployments with records‑retention mandates beyond export.  
- Highly regulated sectors requiring bespoke compliance (health/defense) beyond generic controls.

## 6.3 Boundaries vs Included MVP Features
- **Included (Part 5):** Purpose blocks, customizable dashboards, Expertise Atlas, Matching Hub (with **PAC**), Zen Hub (non‑diagnostic), visibility controls, soft **attestations**, Org Expertise Hub, 5‑step Assignment Creation, Company Dashboard, Team Hub, org‑type flag.  
- **Not included:** Anything that materially expands scope beyond these (above exclusions apply).

---

## Facts & Decisions
- This list is **binding for MVP**; additions require a change note and re‑prioritization.  
- Non‑negotiables: **no social feed**, **no diagnostic mental‑health features**, **no hard verification**, **no payments/contracting** in MVP.  
- Rationale ties to Parts **1–5**: focus on faster, fairer **matches** (TTFQI/TTSC), privacy‑first, low cognitive load.

**Status:** Draft v0.1 (awaiting product approval) · **Approver:** Pavlo Samoshko · **Date:** —


# PRD — MVP — Part 7: Functional Requirements

> **Scope:** Functional specs for all **MVP features** (from Part 5) grounded in **User Journeys** (Part 3) and **Core User Flows** (Part 4).  
> For each feature: **Inputs → Processing Rules → Outputs → Error & Empty States → Event Tracking** (analytics).  
> Canonical metrics from Part 2: **TTFQI, TTV, TTSC, PAC, SUS, Well-Being Delta**.

---

## 7.1 Individual Features

### F1 — Purpose Block (Mission • Vision • Values • Causes)
**Inputs**  
- User text entries: `mission`, `vision` (max length & profanity filter), `values[]` (≤5), `causes[]` (≤5; mapped to controlled tags).  
- Visibility flags per field: `{public | link_only | match_only | private}`.  
- Optional: import from existing resume/LinkedIn paste.

**Processing Rules**  
- Validate lengths; deduplicate values/causes; normalize case.  
- Map `causes` to internal tag set for **PAC** calculation; store as normalized IDs.  
- Changes write an append-only **purpose_edit_log** for audit.

**Outputs**  
- Profile render; **Match Detail** panel shows purpose with **PAC** badge.  
- Optional public snippet export (shareable link).

**Error & Empty States**  
- Empty: “Add your mission/values—improves match quality.” Suggested examples.  
- Errors: disallowed content, length exceeded, save conflict → show inline; autosave retries.

**Event Tracking**  
- `purpose_created/updated` {fields_changed[], field_visibility[], word_count}  
- `purpose_exported` {format, link_created}  
- `purpose_viewed_in_match` {match_id, pac_value}

---

### F2 — Customizable Dashboard (Tiles)
**Inputs**  
- Tile config: ordered list of tiles (Matches, Applications/Intros, Expertise Depth, Evidence/Artifacts, Zen Hub, Next Best Action).  
- Persona preset (optional).

**Processing Rules**  
- Persist user-specific layout; fetch tile data concurrently with 2.0s P75 budget.  
- “Next Best Action” computes from profile completeness, L4 gaps, and match backlog.

**Outputs**  
- Dashboard page; per-tile quick actions (e.g., open shortlist, add L4, schedule reflection).

**Error & Empty States**  
- Empty: show skeletons and seeded examples (“No matches yet—complete 3 L4s to unlock”).  
- Tile fetch error: display fallback message and retry control.

**Event Tracking**  
- `dashboard_viewed` {tiles[], load_ms}  
- `dashboard_tile_added/removed/reordered` {tile, position}  
- `next_best_action_clicked` {action_type}

---

### F3 — Expertise Atlas (L1→L4 + properties & proofs)
**Inputs**  
- Manual L4 add (name from taxonomy), properties: `level (0–5)`, `months_experience`, `proofs[]` (files/links), `visibility`.  
- Import text/PDF (optional) to suggest L4s; user accept/edit.  
- Bulk add (up to 10 L4s at once).

**Processing Rules**  
- Validate files (size/type); virus-scan uploads.  
- Auto-suggest pipeline extracts candidates, maps to known L4 IDs with confidence + “why” rationale.  
- Compute **expertise_depth** (count, recency of proofs).  
- Profile **activation** triggers when minimum L4 count and properties met.

**Outputs**  
- Hierarchical view (L1→L4) with counts; L4 detail sheet; proof gallery.  
- Dashboard “Expertise depth” tile.

**Error & Empty States**  
- Empty: guided starter kit (3 suggested L4s).  
- Import failure: offer manual add with copy/paste capture.  
- Upload error: show allowed types/size; keep unsaved changes.

**Event Tracking**  
- `l4_added` {l4_id, source: manual|suggested, visibility, level}  
- `l4_property_updated` {l4_id, field, old, new}  
- `proof_uploaded` {l4_id, file_type, size_kb}  
- `cv_import_attempted` {pages, bytes} / `cv_mapping_accept/reject` {l4_id, confidence}

---

### F4 — Matching Hub (values-aware automated matching)
**Inputs**  
- From user: location mode, availability window, languages, compensation bounds, right-to-work, causes/values priority; verification readiness.  
- From system: active **Assignments**, org **verification gates**, Atlas L4 set.

**Processing Rules**  
- Composite **match_score = f(skills_fit, constraints_fit, verification_fit, PAC)**; configurable weights (server-side defaults).  
- Only surface matches meeting minimum score + gate compatibility.  
- Provide “Why this match” explainer (top contributing factors).  
- Opt-in fairness checks produce cohort-level **fairness note** each release.

**Outputs**  
- Ranked shortlist; actions: **introduce**, **pass (with reason)**, **snooze**, **open assignment**.  
- “Why not shortlisted” hints when near-threshold.

**Error & Empty States**  
- Empty: show top 3 actions to raise score (e.g., add L4 proof, widen availability).  
- Gate mismatch: banner explaining unmet verification.  
- Rate limiting: prevent mass introduces within a window.

**Event Tracking**  
- `shortlist_generated` {count, min_score, cohort}  
- `match_viewed` {match_id, score, pac}  
- `match_actioned` {match_id, action:introduce|pass|snooze, reason?}  
- `match_settings_changed` {field, old, new}

---

### F5 — Zen Hub (well-being center, private)
**Inputs**  
- Opt-in flag.  
- Check-ins: Likert 1–5 for stress & sense-of-control; optional reflection text.  
- Milestone triggers (rejection, interview, offer).

**Processing Rules**  
- Store well-being data in a private partition; **never used in ranking**.  
- Compute **Well-Being Delta** over 14/30 days for user-only view.  
- Prompt schedule can be paused; reminders respect Quiet Hours.

**Outputs**  
- Personal chart and reflection journal; optional PDF export for the user only.  
- Gentle milestones-based suggestions (no medical claims).

**Error & Empty States**  
- Not opted in: explain benefits and privacy; single-click enable.  
- Empty reflections: suggest prompts tied to current stage.

**Event Tracking**  
- `wellbeing_opt_in_changed` {enabled}  
- `wellbeing_checkin_submitted` {scores, from_trigger?}  
- `reflection_added` {word_count}  
- `privacy_banner_acknowledged` {timestamp}

---

### F6 — Visibility & Boundary Controls
**Inputs**  
- Field-level visibility settings; global **Redact** toggle (name/photo).  
- Preview-as: public, link-only, match-only.

**Processing Rules**  
- Enforce visibility on all reads (UI & API) with defense-in-depth checks.  
- Redaction applies to profile preview and shortlist cards.  
- Audit log for changes; “restore defaults” control.

**Outputs**  
- Live preview; updated profile/match cards.  
- Audit trail accessible to the user.

**Error & Empty States**  
- Conflicts (e.g., artifact is private but linked in public snippet): block with guidance.  
- Permission errors return “Forbidden” without leaking existence.

**Event Tracking**  
- `visibility_changed` {entity, field, from, to}  
- `redact_mode_toggled` {enabled}  
- `preview_rendered` {mode}

---

### F7 — Verification & Attestations (v1)
**Inputs**  
- Attestation request (artifact/L4), recipient email/name, message, due date.  
- Status updates from magic-link form (approve/decline + comment).

**Processing Rules**  
- Generate signed magic links; expiry (default 14 days).  
- Store attestations; surface badges on artifacts/L4s.  
- Assignment **verification gates** displayed pre-intro.

**Outputs**  
- Attestation status panel; badges on verified items; reminder emails.  
- Export verification summary in Match Detail.

**Error & Empty States**  
- Expired link → regenerate flow; declined attest → feedback shown to requester.  
- Missing gate → block introduce with explanation.

**Event Tracking**  
- `attestation_requested` {target, recipient_role}  
- `attestation_completed` {target, outcome}  
- `verification_gate_failed` {gate_type}

---

## 7.2 Organization Features

### O1 — Org Purpose Block
**Inputs**: mission, vision, values[], causes[]; visibility flags.  
**Processing**: normalize & map causes for **PAC**; log edits.  
**Outputs**: Org profile & Match Detail.  
**Errors/Empty**: same patterns as F1.  
**Events**: `org_purpose_updated` {fields_changed[]}.

---

### O2 — Structure Block
**Inputs**: departments/teams, parent-child relations, hiring managers.  
**Processing**: validate tree (no cycles), link teams to Assignments.  
**Outputs**: simple org map, CSV export.  
**Errors/Empty**: “No teams yet—add your first team.” Invalid link → inline fix.  
**Events**: `org_structure_node_added/updated/removed` {node_type}.

---

### O3 — Culture Block
**Inputs**: norms (async/sync, meeting load), accessibility commitments, tooling.  
**Processing**: store structured fields; show on Assignments.  
**Outputs**: culture summary card.  
**Errors/Empty**: template suggestions.  
**Events**: `org_culture_updated` {fields_changed[]}.

---

### O4 — Impact Block
**Inputs**: outcome entries (metric, timeframe, beneficiaries), artifacts.  
**Processing**: basic calculations, validation; generate **Evidence Pack** (PDF).  
**Outputs**: impact list; donor/investor-ready export.  
**Errors/Empty**: missing metrics → inline prompts; export failure → retry.  
**Events**: `impact_entry_created/updated`; `evidence_pack_exported` {pages}.

---

### O5 — Projects Block
**Inputs**: project title/summary, links to artifacts and Assignments, status.  
**Processing**: maintain links; status transitions.  
**Outputs**: project list; links resolve to artifacts/assignments.  
**Errors/Empty**: “No projects yet”; broken link notice.  
**Events**: `project_created`; `project_artifact_linked` {artifact_type}.

---

### O6 — Enterprise Expertise Hub
**Inputs**: capability domains, required L4s, JD paste for mapping.  
**Processing**: suggest L4s with rationale; compute team coverage vs requirements.  
**Outputs**: coverage view; suggested L4 list for Assignments.  
**Errors/Empty**: JD paste failure → manual add; “no coverage” → coach marks.  
**Events**: `jd_pasted_for_mapping` {chars}; `org_l4_required_added` {l4_id}.

---

### O7 — Assignment Creation (5-Step) with Verification Gates
**Inputs**: (1) role & outcomes, (2) must/nice L4s, (3) verification gates, (4) logistics, (5) review.  
**Processing**: validate fields; compute readiness; generate public-facing brief.  
**Outputs**: published Assignment; preview card; shareable link.  
**Errors/Empty**: incomplete required fields; invalid ranges; show inline fixers.  
**Events**: `assignment_step_completed` {step}; `assignment_published` {assignment_id}.

---

### O8 — Company Dashboard
**Inputs**: selected tiles; data from Assignments & matches.  
**Processing**: aggregate pipeline stats (TTFQI, TTSC, fairness note); refresh cadence.  
**Outputs**: tiles for Open Assignments, Shortlists, Intros, TTSC trend, Next Actions.  
**Errors/Empty**: show skeletons and instructions.  
**Events**: `company_dashboard_viewed` {tiles[]}.

---

### O9 — Team Management Hub
**Inputs**: member email/name, role (Owner, Manager, Reviewer), permissions.  
**Processing**: send invites (magic link); enforce permissions across app.  
**Outputs**: member list; role editor; invite status.  
**Errors/Empty**: already a member; invalid email; expired invite.  
**Events**: `team_member_invited` {role}; `team_member_joined`; `role_changed` {from,to}.

---

### O10 — Organization Type Differentiation (For-profit vs Non-profit)
**Inputs**: selection at org creation; edits require Owner role.  
**Processing**: set copy defaults (“donors” vs “investors”); toggle minor presets.  
**Outputs**: tailored UI labels; flag in analytics.  
**Errors/Empty**: change confirmation with impact note.  
**Events**: `org_type_set` {type}.

---

## 7.3 Cross-Cutting Functional Requirements

**Notifications & Email**  
- Introduce, attestation, and invite flows send transactional emails with magic links; all have retry and unsubscribe for non-transactional digests.

**Permissions**  
- Enforce role-based access throughout (Owner/Manager/Reviewer; Individual).

**Auditability**  
- User-visible edit logs for purpose, visibility changes, verification actions.

**Search & Filters (basic)**  
- Individuals: filter shortlist by location/availability; Orgs: filter candidates per assignment.

**Internationalization (baseline)**  
- Support base language & standard formats/timezones; full localization is out-of-scope (Part 6).

---

## 7.4 Analytics & Event Schema Notes
- Every event includes `{event_id, occurred_at, user_id?, org_id?, profile_id?, assignment_id?, properties}`.  
- PII minimization: avoid free-text in properties; use IDs/enums.  
- Events feed dashboards for **TTFQI, TTV, TTSC**, **SUS study tags**, and **fairness notes**.

---

## 7.5 Dependencies / Hand-offs
- Matching score weights & fairness checks are configured server-side and versioned.  
- Evidence Pack export requires server-side PDF service.  
- Email/magic links require a transactional email provider.

---

**Status:** Draft v0.1 (awaiting product approval) · **Approver:** Pavlo Samoshko · **Date:** —


# Part 8 — Non‑Functional Requirements (MVP)

**Scope:** Baseline qualities the MVP will meet. These are binding for launch; exceptions require a written waiver.

## Security & Privacy
- **AuthN/AuthZ:** JWT-based auth with role- and record-level authorization. Enforce row‑level security on all user‑generated content; deny-by-default policies.
- **Data classification:** Tag data as **PII / Sensitive / Public**; log policy references per table/column.
- **PII handling:** Minimize collection; isolate PII from analytics; never store PII in logs, events, or traces; redact on ingestion.
- **Encryption:** TLS 1.2+ in transit; provider encryption at rest for DB and object storage; periodic key rotation.
- **Consent & audit:** Versioned consent records (ToS, Privacy, verification) per user/org; immutable audit logs for visibility/verification changes.
- **Privacy controls:** Field‑level visibility (public/link-only/match-only/private), profile redaction mode, opt‑out for analytics/ML.
- **Vulnerability management:** Monthly dependency scans, critical fixes within 7 days; annual 3rd‑party pen test (post‑MVP).
- **Incident response:** Pager on P1 incidents; 24h preliminary report; user notification if data is materially affected.
- **Data residency posture:** Single region for MVP; clarify in Privacy Policy; add regional storage post‑MVP if required.

## Performance
- **Page SLAs:** P95 Time-to-Interactive ≤ **2.5s** (desktop broadband), ≤ **3.5s** (mid‑tier mobile). First meaningful paint budget: 1.5s (desktop).
- **API SLAs:** P95 endpoint latency ≤ **1.5s**; P99 ≤ 3s. File upload ≤ 25MB with streaming; images ≤ 10MB.
- **Query hygiene:** Indexed filters; pagination for lists; N+1 guards in ORM; batch fetching for dashboard tiles.
- **Rate limiting:** 100 requests/min per IP (burst 200) for public APIs; introduce backoff and friendly errors.
- **Batch jobs:** Nightly ETL completes by **02:00 UTC**; weekly model export completes within 2h window.

## Reliability
- **Uptime target:** ≥ **99.5%** monthly (MVP). Public status page post‑MVP.
- **Backups:** Automated nightly DB backups; object storage durability per provider. Quarterly restore test.
- **RTO/RPO:** RTO ≤ **8h**; RPO ≤ **24h**.
- **Idempotency & retries:** Idempotent write APIs where practical; exponential backoff on transient failures.
- **Alerts:** Error‐rate spikes, job failures, latency/availability SLO breaches.

## Scalability
- **Expected MVP volumes:** ~500 users / 200 assignments / 5k events/day. Headroom ×10 via indexing and caching.
- **Scale plan:** Read replicas or caching layer post‑MVP; background workers for matching recomputations; vector search (pgvector) considered Phase 1.
- **Large files:** Enforce file type/size; virus scan; presigned uploads to keep app servers stateless.

## Accessibility
- **WCAG 2.1 AA baselines:** Semantic HTML, labels, focus order, visible focus ring, keyboard nav, ARIA only when necessary, color‑contrast ≥ 4.5:1, skip links, reduced‑motion setting, screen‑reader announcements on dynamic content.
- **Testing:** Automated a11y checks in CI; manual audits on critical flows (activation, assignment creation, checkout if used).

## Localization
- **Languages:** English UI for MVP.
- **Internationalization:** IANA timezone capture; locale‑aware dates, numbers, and currency formatting; Unicode-safe storage; left‑to‑right baseline (RTL readiness assessed post‑MVP).

## Observability
- **Structured logging:** JSON logs with request‑id; scrub PII on emit; 30‑day retention in log store.
- **Metrics:** RED (Rate/Errors/Duration) for APIs; key business metrics (TTFQI, TTV, TTSC) on dashboards.
- **Tracing:** Minimal distributed traces on critical paths (match generation, assignment publish).
- **Product analytics:** Event taxonomy aligned to Part 9; sampling allowed for high‑volume events.

---

## Facts & Decisions
- **Facts:** MVP is privacy‑first (field‑level visibility, redaction, consent logs); no diagnostic MH data; well‑being data excluded from ranking.
- **Decisions:** Adopt above SLAs/SLOs; English‑only UI; single‑region hosting for MVP; nightly ETL cadence; 99.5% uptime target; rate limiting in gateway.


# Part 9 — Data Model (High‑Level)

**Scope:** Key entities, relationships, retention, and the top event schema for analytics and future ML.

## Key Entities & Relationships

- **User** — authentication identity; 1:1 with **Profile**.
- **Profile (Individual)** — public summary and private fields; 1:1 **MatchingProfile**; 1:N **Experience**, **Education**, **Artifact** (proof), **Verification**.
- **Organization (Org)** — profile (mission/vision/values/causes, culture, impact); 1:N **Member** (Profile) with role; 1:N **Assignment**.
- **MatchingProfile** — constraints & preferences used by matching (availability, comp, location mode, languages, causes).
- **SkillsTaxonomy** — hierarchical L1→L4 catalog; synonyms; level rubric.
- **ProfileSkill** — join table: Profile × L4 skill with `level (0–5)`, `months_experience`, `visibility`.
- **Assignment** — role & outcomes, must/nice L4 skills, verification gates, logistics, and weights.
- **Match** — materialized (Profile × Assignment) record with `score`, `subscores` (skills/constraints/verification/PAC), `created_at`.
- **Application** — candidate intent + answers, attached artifacts; links to **Interview** events.
- **Verification** — attestation requests & results for skills/experience/artifacts (soft verify v1).
- **Message** — basic contact thread or system notifications (MVP minimal).
- **ConsentRecord** — user policy acceptances with versioning and IP/agent.
- **AuditLog** — immutable changes for purpose/visibility/verification.
- **AnalyticsEvent** — anonymized interaction event.

### ER Sketch (text)
- User 1—1 Profile  
- Profile 1—1 MatchingProfile  
- Profile N—N SkillsTaxonomy via ProfileSkill  
- Profile 1—N Experience / Education / Artifact / Verification  
- Org 1—N Assignment  
- Org 1—N Member (Profile) with role  
- Assignment 1—N Application  
- Profile N—N Assignment via Application; Profile × Assignment → Match (scored)  
- Application 1—N Interview  
- Any 1—N AnalyticsEvent (with anonymized ids)

## Data Retention & Deletion
- **Profiles:** Soft delete for 30 days, then hard delete; replace references in analytics with hashed ids.
- **Assignments/Applications:** Retain 24 months by default; allow org‑level purge on request.
- **Artifacts:** Retain while linked to active Profile/Assignment; orphan cleanup after 90 days.
- **Messages:** Retain 36 months; subject to legal holds.
- **Analytics events:** Retain 24 months then aggregate/anonymize.
- **Backups:** Follow Part 8 policy; restores purge deleted PII as part of post‑restore job.

## Top Events & Properties
- `dashboard_viewed` — `{ tiles[], load_ms }`
- `l4_added` — `{ l4_id, source, level }`
- `match_settings_changed` — `{ field, old, new }`
- `shortlist_generated` — `{ count, min_score }`
- `match_viewed` — `{ match_id, score, pac }`
- `match_actioned` — `{ match_id, action, reason? }`
- `applied` — `{ assignment_id, match_score }`
- `interview_scheduled` — `{ application_id, scheduled_at }`
- `hired` — `{ application_id }`
- `wellbeing_checkin_submitted` — `{ scores }` (non‑diagnostic, private path)

> **Event hygiene:** No PII in properties; use ids/enums. Nightly ETL hydrates a `ml_training_data` table with positive/negative/neutral labels from events.

---

## Facts & Decisions
- **Facts:** Matches are materialized to accelerate UX; values/causes (PAC) are first‑class in scoring but never used to penalize protected groups.
- **Decisions:** Keep ER monolithic for MVP; adopt soft‑delete + re‑keying in analytics; expand with vector search entities post‑MVP if needed.


# Part 10 — Integrations (MVP)

**Scope:** External services, auth methods, failure handling, secrets, and environment separation.

## Authentication
- **Methods:** OAuth (Google) and magic‑link email.
- **Claims:** `sub`, `email`, `role`, optional `org_id` for org context.
- **Controls:** 5 attempts/15m throttle; magic‑link expiry; device/browser hinting.

## Email (Transactional)
- **Provider:** Transactional email (e.g., Resend). Templates for verification, attestation, invitations, intros.
- **Failures:** Retry with exponential backoff (max 3); log bounces & complaints; suppress invalid recipients.

## Analytics
- **Pipeline:** Client and server events → Postgres; optional forwarder to a product analytics tool later.
- **Schema:** Use Part 9 taxonomy; validation in CI to prevent schema drift.

## Maps & Geocoding
- **Provider:** Mapbox/Places for location autocomplete.
- **Fallback:** Free‑text city + country when provider is unavailable.

## Video Conferencing
- **Providers:** Zoom API and/or Google Meet API for interview scheduling.
- **Features:** Automatic meeting link generation, calendar invites with video link, timezone handling.
- **Fallback:** Manual link entry if API unavailable.

## Storage
- **Provider:** S3‑compatible object storage for avatars/covers/artifacts; presigned upload; antivirus scan.

## Observability
- **Provider:** Sentry (FE/BE) for error tracking; alerts on error spikes and job failures.

## Payments
- **Status:** Out of scope for MVP (see Part 6).

## Secrets & Rotation
- **Storage:** Environment variables; separate keys per environment; least‑privilege service accounts.
- **Rotation:** Quarterly rotation; immediate rotation on incident.

## Environments
- **Dev:** Local + dev cloud project; seeded with synthetic data only.
- **Preview:** Per‑PR preview deployments; sandbox API keys.
- **Prod:** Restricted maintainers; audit trail on config changes.

---

## Facts & Decisions
- **Facts:** No payments/contracting integrations in MVP; transactional email and map autocomplete are required; error tracking is mandatory.
- **Decisions:** Define explicit fallbacks for 3rd‑party outages; keep secrets in env vars with rotation; keep dev/preview/prod fully isolated.


# Part 11 — Dependencies & Constraints

**Scope:** Technology, compliance, organizational, and third‑party constraints.

## Technical Constraints
- **Stack:** Next.js/React/TypeScript; Postgres + Auth + Object Storage; ORM (Drizzle); Tailwind + Radix; Vercel; transactional email.
- **Search:** Postgres full‑text for MVP; vector search (pgvector) optional post‑MVP.
- **Realtime:** Polling is acceptable for MVP; realtime channels optional later.
- **Performance levers:** Caching and read replicas post‑MVP if needed; batch recomputation for matching.

## Compliance & Data Handling
- **Regimes:** GDPR/CCPA principles—consent, access, deletion, opt‑out of analytics/ML, data minimization.
- **Retention:** See Part 9; honor verified deletion requests within 30 days.
- **Cookies:** Use strictly necessary cookies by default; analytics cookies behind consent.

## Team & Timeline Constraints
- **Resourcing:** Lean team; prioritize features that directly lift TTFQI/TTSC; defer non‑critical requests.
- **Ops windows:** Nightly ETL & weekly model export windows; avoid deploys during ETL.

## Third‑Party Limits & Risks
- **Quotas/outages:** Email provider rate limits; map API quotas; object storage egress costs.
- **Video conferencing APIs:** Zoom/Google Meet rate limits; account requirements; OAuth setup; meeting duration limits (Zoom free tier = 40 min, sufficient for 30-min interviews).
- **Vendor lock‑in:** Keep portable SQL and storage paths; document exit plans (e.g., Postgres dump, S3 export).
- **Security posture:** Monitor for dependency CVEs; maintain an allowlist for uploads.

---

## Facts & Decisions
- **Facts:** MVP deliberately excludes payments, hard verification, deep ATS/HRIS; single‑region hosting.
- **Decisions:** Implement rate limiting and basic moderation for MVP; treat vector search/caching/SSO as post‑MVP; revisit compliance posture before GA.


# Part 12 — Acceptance Criteria (MVP “Done”)

> **Intent:** Objective, testable checks to declare the MVP “ship-ready.” All items below must pass.

---

## 12.1 Functional Acceptance (mapped to Part 5 features)

### Individuals
**F1 Purpose Block**
- [ ] Create/edit **mission, vision, values (≤5), causes (≤5)** with field-level visibility.
- [ ] Purpose signals appear in **Match Detail** with **PAC** shown when applicable.
- [ ] Audit log records purpose edits (who/when/what).

**F2 Customizable Dashboard**
- [ ] Add/remove/reorder tiles; layout persists across sessions/devices.
- [ ] “Next Best Action” suggests at least one actionable step when TTFQI=∅.

**F3 Expertise Atlas**
- [ ] Add ≥ **10 L4** skills with properties (level, months, proof).
- [ ] CV paste → receive suggestions with “why it mapped”; accept/edit-in-place.
- [ ] Profile reaches **Activation** when minimum threshold met (configurable).

**F4 Matching Hub**
- [ ] Ranked shortlist with composite score and **Why this match** explainer.
- [ ] Quick actions: **Introduce / Pass / Snooze**; near-threshold hints shown.
- [ ] **Fairness note** generated per release when opt-in demographics exist.

**F5 Zen Hub**
- [ ] Opt-in check-ins (1–5) + reflections; privacy banner shown on first use.
- [ ] Well-Being data **never** used in ranking; export private journal (PDF) works.

**F6 Visibility & Boundary Controls**
- [ ] Field-level visibility works end-to-end (public/link-only/match-only/private).
- [ ] **Redact** mode hides name/photo in previews and cards.

**F7 Verification & Attestations (v1)**
- [ ] Request attestation via magic link; status visible; reminders send.
- [ ] Assignment gates are displayed pre-intro; unmet gates block “Introduce.”

### Organizations
**O1 Purpose Block** — Mission/vision/values/causes editable; contributes to PAC.
**O2 Structure Block** — Create teams; link Assignments; export simple org map.
**O3 Culture Block** — Norms & accessibility commitments visible pre-intro.
**O4 Impact Block** — Create impact entries; export **Evidence Pack (PDF)**.
**O5 Projects Block** — Link artifacts & Assignments; status tags.
**O6 Enterprise Expertise Hub** — Declare domains; JD paste → suggested L4s.
**O7 Assignment Creation (5-step)** — Publish flow completes with gates & logistics.
**O8 Company Dashboard** — Tiles for pipeline (Shortlists, Intros, TTSC trend).
**O9 Team Management Hub** — Invite members; roles/permissions enforced.
**O10 Organization Type Flag** — For-profit vs Non-profit selected & reflected in copy.

---

## 12.2 Non-Functional Acceptance (Part 8 baselines)

- [ ] **Performance:** API **P95 ≤ 1.5s**; page TTI **P95 ≤ 2.5s** desktop / **≤ 3.5s** mobile on reference devices.
- [ ] **Reliability:** **RTO ≤ 8h**, **RPO ≤ 24h** documented; quarterly restore test completed.
- [ ] **Security & Privacy:** RLS policies audited; consent logs in place; PII not present in logs/events.
- [ ] **Accessibility:** Critical flows pass WCAG 2.1 AA checks; manual keyboard audit completed.
- [ ] **Localization:** Timezone & locale formatting verified; English UI confirmed.
- [ ] **Observability:** Error tracking, latency dashboards, and event pipeline active.

---

## 12.3 Data Quality & Analytics Readiness (Parts 9–10)

- [ ] Event schema validated in CI; no PII in event properties.
- [ ] Dashboards show **NSM (TTSC)**, **TTFQI**, **TTV**, and funnel conversion (view→intro→interview→hire).
- [ ] Nightly ETL → analytics DB successful; **ml_training_data** table populated with labels.

---

## 12.4 Smoke Test Playbook (must pass end-to-end)

1) **Individual activation:** Sign up → Purpose → Atlas (≥10 L4) → Activate → See matches.  
2) **Org assignment:** Create org → Purpose → Assignment (5-step) → Publish → Shortlist appears.  
3) **Introduce:** From shortlist → Introduce → Message thread opens (basic) → Mark as interview scheduled.  
4) **Verification:** Request attestation → Approver completes → Badge visible.  
5) **Zen Hub:** Opt-in → Add check-in → See reflection log; export PDF.  
6) **Privacy:** Toggle field visibility & Redact mode → Previews reflect settings.

---

## 12.5 Sign-offs

- **Product:** feature scope & UX (Parts 3–5)  
- **Engineering:** NFRs, reliability, security & data (Parts 8–9)  
- **Design/Accessibility:** WCAG checks, design parity  
- **Data/Analytics:** event schemas, dashboards  
- **Owner (Go/No‑Go):** Pavlo Samoshko

**Status:** Draft v0.1 · **Date:** —


# Part 13 — Risks & Assumptions

> Top risks with owners & mitigations; key assumptions to validate; rollback plan.

## 13.1 Top Risks

| # | Risk | Likelihood | Impact | Owner | Mitigation |
|---|------|------------|--------|-------|------------|
| R1 | Matching fails to deliver TTFQI ≤ 72h for first cohorts | M | H | Eng/Data | Tighten defaults; seed high-intent Assignments; add “near-threshold” hints; monitor daily |
| R2 | Purpose/values misuse or perceived bias | M | H | Product/Legal | Clear privacy copy; never penalize on values; cohort fairness note; user controls |
| R3 | Low verification completion | M | M | Product | “Soft verify” first; reminders; scoped attestation UX; show lift where present |
| R4 | Atlas taxonomy overwhelms users | M | M | Design | Guided starters; auto-suggest with “why it mapped”; reduce friction to activation |
| R5 | Email deliverability issues | M | M | Eng | Monitor bounces; SPF/DKIM/DMARC; fallback provider |
| R6 | Data leakage via mis-configured visibility | L | H | Sec/Eng | Deny-by-default RLS; privacy previews; audits in CI |
| R7 | Vendor outage (auth, email, maps) | M | M | Eng | Fallbacks (magic-link resend, free-text city); circuit breakers |
| R8 | Performance regressions under load | M | M | Eng | Budgets in CI; tracing hot paths; index review; caching plan |
| R9 | Legal/compliance change (privacy) | L | M | Product/Legal | Versioned consent; opt-out for analytics/ML; data map |
| R10 | Scope creep pre-launch | M | H | Product | Part 6 guardrails; change-control with impact estimate |

## 13.2 Assumptions to Validate

- A1: **Shortlists with PAC** increase intro acceptance and contract rates (measure lift vs baseline).  
- A2: Students/switchers can **activate** (reach matchable profile) in ≤20 minutes median.  
- A3: Organizations can **publish** Assignments in ≤15 minutes median.  
- A4: Opt-in well-being check-ins do **not** harm activation or retention; improve perceived control.  
- A5: Email-first onboarding is sufficient for early cohorts (SSO later).

**Validation windows:** First 4–6 weeks post-launch; report weekly.

## 13.3 Kill-Switch & Rollback

- **Feature flags** guard: Matching Hub variants, Zen Hub entry, verification flows.  
- **Operational rollback:** Vercel instant rollback to last green deploy; DB migration strategy uses reversible migrations.  
- **Comms:** If user-impacting issue occurs, post status, email affected users (template ready).

**Status:** Draft v0.1 · **Date:** —


# Part 14 — Launch Plan

> Environments, deployment, observability, analytics, support, and post‑launch checkpoints.

## 14.1 Environments & Gating

- **Dev (local):** Full stack with seed data; feature flags default **on**.  
- **Preview (Vercel):** Per‑PR deployments; synthetic data; flags set per branch; **QA sign‑off** required.  
- **Prod (Vercel):** Final deployment target; flags default **off** for new features.

**Go/No‑Go Gates (must be green):**
- Part 12 acceptance suite (functional + NFR) passes.  
- Security/privacy checks complete (RLS audit; consent logs).  
- Analytics dashboards live (TTFQI, TTV, TTSC).  
- Run smoke tests from 12.4 on Preview then on Prod after deploy.

**Release strategy:** Trunk-based with feature flags; staged rollouts by cohort if needed; instant rollback available in Vercel.

## 14.2 Deployment

- CI builds & tests on PR → Preview deploy on Vercel.  
- Merge to main → Production deploy on Vercel.  
- Reversible migrations run via migration tool; **post-deploy** job warms indexes & caches.  
- Only after all flows & interactions test **green** do we declare launch-ready.

## 14.3 Observability

- **Dashboards (Ops):** API RED (rate/errors/duration), page TTI P95, job success, error rate by release, DB health.  
- **Dashboards (Product):** NSM **TTSC**, **TTFQI**, **TTV**, conversion funnels, fairness note summary.  
- **Alerts:** 5xx spike, latency P95 breach, failed ETL, error rate by route, email bounce spike.  
- **Tracing:** Critical paths (assignment publish, shortlist generation) traced end-to-end.  
- **Log hygiene:** JSON logs with request-id; PII scrubbing.

## 14.4 Analytics Plan

**Goals:** Instrument outcomes that reflect speed & quality of matches and user effort reduction.
- **Core events:** `dashboard_viewed`, `l4_added`, `shortlist_generated`, `match_viewed`, `match_actioned{introduce|pass|snooze}`, `applied`, `interview_scheduled`, `hired`, `wellbeing_checkin_submitted` (private path).  
- **Attribution:** `source` on landings (organic/referral/paid); `cohort` labels (persona, role family, region).  
- **Derived metrics:** **TTFQI**, **TTV**, **TTSC**; effort saved (self-report + steps); PAC lift on acceptance/hire.  
- **Data flow:** Client/server events → analytics DB via ETL (nightly); ML labels persisted in `ml_training_data`.  
- **Privacy:** No PII in properties; opt-out honored; Zen Hub data segmented and excluded from ranking.

## 14.5 Support & Incident Response

- **User support:** **hello@profound.io** (primary).  
- **Operational:** On-call pager for P1; publish post‑mortems for user‑impacting incidents.

## 14.6 Post‑Launch Checkpoints (user milestones)

- **100 users:** Validate instrumentation, UX friction points, and Atlas starter success; fix onboarding blockers.  
- **1,000 users:** Validate TTFQI median target in ≥1 cohort; test indexing/caching plan; fairness note cadence.  
- **10,000 users:** Load/latency review; enable caching/read replica if needed; consider pgvector pilot; review compliance needs.

**Status:** Draft v0.1 · **Owner:** Pavlo Samoshko · **Date:** —
