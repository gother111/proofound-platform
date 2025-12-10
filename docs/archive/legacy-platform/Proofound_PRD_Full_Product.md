# Proofound — PRD (Full Product / Target State)

**Owner:** Pavlo Samoshko (Product)  
**Version:** v1.0 — 2025‑10‑26

---

## 0) Strategic Positioning

**Category:** A credibility engineering platform for impactful connections — backed by evidence, not vanity metrics.  
**Vision:** Eliminate spammy hiring and shallow reputation systems by centering verifiable proof, alignment, and mental‑health‑aware UX.  
**Why Now (data):** _(Founder to supply final figures.)_

**North Stars:**

1. Time‑to‑First‑Accepted Match (median).
2. % assignments with ≥3 qualified matches in 7 days.
3. Long‑run: Match quality & outcome realization (assignment completion & satisfaction).

**Principles:** Transparency • Non‑discrimination • Authenticity • Trustworthiness • Never monetize inequality/exclusion.

---

## 1) Product Surface (Target)

| Area               | Target State                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Auth               | OAuth suite (Google/LinkedIn/Apple/GitHub/Facebook), passwordless, MFA, enterprise SSO (SAML/OIDC), SCIM         |
| Profiles           | Rich portfolios; versioned artifacts; artifact imports (GitHub, Behance, Google Docs, Notion); team/org profiles |
| Matching           | Adaptive/learning weights; team/role multi‑matching; smart scheduling assist; explainability with numeric deltas |
| Assignments        | Outcomes → milestones → contracts → payments; SLA tracking; audit trails                                         |
| Verification       | Multi‑ref trees; document verification; registry lookups (EU/national); continuous & passive signals             |
| Cluster Snapshot   | Personal UI; graph analytics; second‑degree reach; org network overlays; role‑aware insights                     |
| Messaging          | Rich media; voice/video; calendar; structured links to artifacts; redactable PII                                 |
| Moderation & Trust | Appeals portal; transparency reports; tiered trust levels; progressive enforcement                               |
| Localization       | EN, SV, RTL (AR/HE), CJK; content QA; pluralization; layout variants                                             |
| Monetization       | Individual + Org tiers (subs & product‑based); verification credits; payment fees                                |
| APIs               | Public APIs/SDKs for matching, verification, artifacts, and events                                               |
| Mobile             | **Native iOS & Android** with offline micro‑flows and push notifications                                         |

---

## 2) Customer Segments & Access

**Geography:** EU‑first → global expansion.  
**Segments:** Individuals (students, experts, career switchers, immigrants, later executives); Org (NGO, startup, SME, later enterprise & gov).  
**Access:** Rolling cohorts post‑beta; marketplace quality gates persist (profile completeness + minimum proofs).

---

## 3) Core Capabilities (Target Specs)

### 3.1 Matching (Adaptive)

- Learning weights from outcomes; fairness constraints; exploration vs exploitation mix.
- Explanations with numeric deltas and suggested next proofs to improve rank.
- Batch/team matching (project teams); scheduling hints; calendar preferences.

### 3.2 Verification (Advanced)

- Multi‑ref verification trees with ancestry visualization.
- Doc checks (certificates, IDs where lawful), org registry lookups (BR/SE/EU/National).
- Continuous signals: artifact activity, reference freshness, anomaly detection.

### 3.3 Assignments → Contracts → Payments

- Outcome templates → milestones → acceptance criteria.
- Contract generation (templates); e‑sign; escrow; milestone‑based payouts.
- Dispute process with audited logs.

### 3.4 Cluster Intelligence

- Private by default; user‑visible dashboard with filters (active/legacy; role; time).
- Shared context insights with consent (e.g., common collaborators, second‑degree reach).
- Org overlays: where talent pools exist; demand/supply heatmaps.

### 3.5 Messaging & Collaboration

- Voice/video; screen share; shared artifact viewer; comment threads.
- Redaction tools for PII; audit export for enterprise.

---

## 4) Policy & Safety (Target)

- **Political content:** neutral role descriptions allowed; advocacy/proselytizing disallowed; public policy Q&A limited to factual credentials.
- **Harassment/violence/sex content:** zero tolerance; swift enforcement; appeal path.
- **Fraud signals:** same as MVP + model‑based anomaly detection and community‑weighted signals; “Confidence pending” label with reasons and recommended actions.
- **Privacy:** granular controls; per‑field visibility; consent flows; public indexing opt‑in only.

**Retention (Target Defaults):** logs 180–365d; audit 2y; soft‑delete purge 30d; message retention user‑controlled (per conversation).  
**DPIA/DPA:** comprehensive DPIA; regional DPAs; data residency options for enterprise (EU).

---

## 5) Metrics & Analytics (Target)

- Outcome realization rate (assignment completion + satisfaction).
- Long‑term verification attainment; proof freshness index.
- Quality guardrails: report rate, moderation SLA, false‑positive/negative moderation rates.
- Growth: activation, expansion by segment, LTV/CAC (conservative models).

---

## 6) Monetization (Target)

**Individuals (subs & product):**

- **Development Hub** subscription (learning plans, verification coaching, artifact helpers).
- **Zen Hub** premium (well‑being tools, focus modes).
- **AI Co‑founder** (tiered usage).

**Organizations (subs & product):**

- Platform subscription (seats/assignments).
- Assignment completion fees (success‑based).
- Enterprise: Zen/Workforce Development Hub, SSO/SCIM, audit exports, custom SLAs, data residency.

**Payments:** Stripe for contracts/escrow/payouts; platform fee %; verification credit packs.

**Pilot Codes:** All new users receive **3 months free** (time‑boxed experiments).

---

## 7) GTM & Ops (Target)

**Channels:** NGO federations, university career centers, incubators/accelerators, credibility‑focused creators, selected enterprises.  
**Assets:** Case studies, trust signals, explainer videos, onboarding webinars, documentation portal.  
**Support:** Business hours human + AI assistant; enterprise SLAs.  
**SRE Targets:** 99.9%+; regional failover; error budgets and SLO reviews.

**Exit to GA:** sustained target metrics (North Stars) for 2 quarters; infra SLOs met; moderation healthy; churn below threshold.

---

## 8) Platform & Architecture (Target)

**Reference Stack:** Next.js + TypeScript + React + Tailwind + Supabase (Postgres + Auth) + Resend + Stripe + Vercel.  
**Enterprise:** SSO (SAML/OIDC), SCIM, audit export, role‑based admin, data residency (EU), evidence export APIs.  
**Mobile:** Native iOS/Android; video (Daily/Vonage); push; offline micro‑flows.  
**APIs:** Public APIs + SDKs for matching/verification/artifacts/events with rate limiting and consumer keys.

---

## 9) Roadmap (Theme Order)

1. Clarification Engine → 2) Zen Hub → 3) Development Hub → **4) Native Mobile Apps** → 5) AI Co‑founder → 6) Government Nodes → 7) Proofound VC → 8) Impact Funds.  
   Quarterized after MVP learnings; rolling 12‑month roadmap maintained.

---

## 10) Legal & Terms (Target)

18+ only; no unpaid tests; additional proof allowed only with outcome‑tied rationale; strict bans: threats, hate, harassment, sexual content, child abuse, incitement of violence. Public indexing opt‑in only.

---

## 11) Appendices

**Empty‑State “Teach & Prompt” Copy (examples):**

- **Profile:** “Show your _proofs_. Add one verified reference and link one artifact. You’ll unlock stronger matches immediately.”
- **Expertise Atlas:** “Rank your top 5 skills and attach at least one proof to each.”
- **Assignments (Org):** “Define outcomes and the proofs you value (e.g., referee from NGO, GitHub repo). We’ll handle bias‑safe matching.”
- **Matches:** “Each suggestion shows _why it fits_ and _how to improve_. Strengthen proofs to climb the list.”
- **Verification:** “Ask the _right_ verifier. A senior peer or org contact increases your credibility signal.”

**Events → Owner → Cadence Table:** included for each dashboard metric in the analytics spec.

**Public APIs:** endpoints for /matching, /verification, /artifacts, /events with keys, scopes, and rate limits.
