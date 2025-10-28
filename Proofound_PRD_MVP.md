# Proofound — PRD (MVP)

**Owner:** Pavlo Samoshko (Product)  
**Version:** v1.0 — 2025‑10‑26

---

## 0) Positioning (One‑Pager)

**Category:** A credibility engineering platform for impactful connections — unprecedented possibilities for work, business, and individual transformation. **Backed by evidence, not vanity metrics.**

**Why Now (placeholders):** _(Founder to fill with figures later)_  
• % of AI‑assisted CVs → …  
• Avg. time‑to‑hire in EU NGOs/SMEs → …  
• Burnout/meaning metrics → …

**Primary Outcome (MVP):** Reduce **Time‑to‑First‑Accepted Match** (median) and increase **% assignments with ≥3 qualified matches in 7 days** (North Star secondary).

**Principles:** Transparency • Non‑discrimination • Authenticity • Trustworthiness • Never monetize inequality/exclusion.

---

## 1) Scope: MVP vs Future

| Area             | **MVP (Now)**                                                              | Future (Post‑MVP)                                                 |
| ---------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Auth             | Email/password; Google, LinkedIn OAuth                                     | Apple, GitHub, Facebook; MFA; SSO (SAML/OIDC)                     |
| Profiles         | Proof‑based profile; 3 proofs/claim; privacy controls                      | Rich portfolios; imports; team profiles                           |
| Matching         | Opt‑in suggestions; user/org weights; explainability; **top 5–10 results** | Adaptive weights; team/role matching; scheduling                  |
| Assignments      | Outcomes, proof reqs, masked budgets                                       | Contracts, milestones, payments                                   |
| Verification     | Email/domain + referee; seniority-weighted (not visible)                   | Multi‑ref trees; doc checks; registry lookups; continuous signals |
| Cluster Snapshot | **Private, compute‑only** (no public UI)                                   | Personal UI, graph analytics, org network views                   |
| Messaging        | Post‑match text; links + **PDF ≤5 MB**                                     | Voice/video, scheduling, doc exchange                             |
| Moderation       | AI flagging + user reports                                                 | Appeals portal; transparency reports                              |
| Localization     | EN only                                                                    | SV + RTL + CJK                                                    |
| Monetization     | Free + pilot codes; NGOs free                                              | Subs, verification credits, payment fees                          |

---

## 2) Users & Access

**Launch geography:** EU.  
**Segments (Individuals):** students, older workers, experts, career switchers, immigrants.  
**Segments (Orgs):** NGOs, startups, SMEs.

**Allow‑list (Private Beta):**  
• **Individuals:** all basic info complete; every claim requiring proof has ≥1 proof.  
• **Organizations:** verified entity (domain email + website/registry #) before matching.

**Beta Waves:**

- **Wave 1:** 5 NGOs, 20 SMEs, 1,000 individuals.
- **Wave 2:** +10 NGOs, +30 SMEs, +2,000 individuals.

---

## 3) Information Architecture & Navigation

**Global nav:** Home · **Matches** · Profile · For Organizations · Zen Hub (Coming Soon) · Settings.  
**Settings:** Toggle Individual ↔ Organization; privacy/export/delete; notifications; language.

---

## 4) Functional Requirements (by Epic)

### 4.1 Auth & Accounts **[MVP]**

- **Flows:** Email/password; OAuth (Google, LinkedIn). Sessions; logout; device recognition; 18+ age‑gate.
- **AC:** P95 sign‑in < 5s; clear errors; rate limits; brute‑force protection.

### 4.2 Profiles (Individual) **[MVP]**

- **Fields (public unless private):** avatar; Mission · Vision · Values · Causes; **Expertise Atlas** (grouped/ranked skills); professional; education; volunteering; artifact gallery.
- **Private:** name, region (not exact), email, masked contacts, salary band (masked), availability, timezone.
- **Proofs:** **Up to 3 per claim** → (1) verified reference; (2) link/file; (3) credential. Artifacts can support multiple claims.
- **AC:** required fields; link validation; duplicate‑proof detection; WYSIWYG preview; granular visibility.

### 4.3 Organizations & Assignments **[MVP]**

- **Fields:** role (title‑inflation guardrails), location/remote, timelines, start date, **budget range (masked)**, proof requirements, expertise mapping, expected outcomes/impact, mission/values.
- **Org verification:** required **before** matching (domain email + checks).
- **AC:** Draft → Publish → Close; edit history; audit log; masked budgets respected everywhere.

### 4.4 Matching & Recommendations **[MVP]**

- **Model:** No “apply.” Users toggle **Available for Match** and set preferences.
- **Inputs:** Expertise Atlas; mission/values; availability; location/timezone; salary band; industry; languages.
- **Default Weights (guard‑railed):** Mission/Values **30%**, Core Expertise **40%**, Tools **10%**, Logistics **10%**, Recency **10%**; adjustable ±15pp.
- **Results set:** **Top 5–10** matches per assignment (configurable).
- **Explainability:** Each suggestion shows “**Why this match**” with % breakdown and **numeric improvement tips** (e.g., “Add proof X to increase score by ~8–12%”).
- **Cold‑start:** Editorial “Starter Matches”; if <5 strong results, show “Near Matches” with missing/strength notes.
- **Refresh defaults:** Employment → **daily**; Volunteering → **weekly** (user‑configurable; system min daily).
- **AC:** First suggestions within 24h of profile readiness; reasons render consistently.

### 4.5 Verification v1.0 **[MVP]**

- **Flow:** Email link to verifier → view claim/artifact → Accept/Decline/Cannot Verify (+reason). Domain verification for org emails.
- **Who verifies:** employment/volunteer → org rep (domain); side projects → qualified peers (link to artifact + short rubric).
- **Seniority:** derived from Expertise Atlas; **not visible**; used as weight.
- **SLA:** target 72h; auto‑nudge 48h & 7d; expiry 14d.
- **Appeal:** user may submit context; human review ≤72h.
- **Public vs Private:** Public status (unverified/pending/verified), verifier role/org (contact masked), timestamp. Private: emails, notes, IP/device info.

### 4.6 Cluster Snapshot v1.0 **[MVP]**

- **Definition:** Active ties linked to ongoing processes in last **60 days**; older ties → Legacy.
- **Visibility:** **Private only**; used by algorithms. No public UI in MVP.

### 4.7 Messaging (Post‑Match) **[MVP]**

- **Identity reveal:** Stage 1 masked basics; Stage 2 names/org revealed **after mutual accept**.
- **Attachments:** links + **PDF ≤5 MB** only.
- **AC:** report/block; no cold DMs; moderation hooks.

### 4.8 Admin & Moderation **[MVP]**

- AI keyword/ML flagging + user reports (≤50 words reason). Queue: pending/reviewed/actioned.
- Violations: 1 warning → second critical violation → timed suspension.
- **Political policy:** factual role descriptions allowed; **advocacy/proselytizing disallowed**.
- **Examples:**
  - ✅ “Policy analyst at Ministry of X (2019–2022).”
  - ✅ “Organized civic tech hackathon, outcomes linked here.”
  - ❌ “Vote for party X / donate to Y.”
  - ❌ “Promotional content for political campaign.”

---

## 5) Trust, Safety, Privacy & Compliance **[MVP]**

**Bias minimization:** No race/gender/age/YOE filters; early views expose only bias‑safe attributes.  
**Fraud signals (respectful):** domain mismatch; bounced refs; velocity spikes; duplicate artifacts; inconsistent timelines; device anomalies.  
**Response:** **“Confidence pending”** label + targeted proof request; no silent penalties; appeal path.  
**Privacy:** GDPR‑aligned. Optional additional context allowed; fine‑grained visibility; consent for public indexing.  
**Retention:** auth/app logs **180d**; audit logs **2y**; soft‑delete purge **30d**; messages retained **until match closes** (user can export).  
**Security:** OWASP Top‑10; rate limits; encryption; least‑privilege roles; audit logs.  
**DPIA/DPA:** DPIA maintained from Day 1; DPA available on request (future enterprise).

---

## 6) Analytics & Metrics **[MVP]**

**North Star:** Time‑to‑First‑Accepted Match (median).  
**North Star 2:** % assignments with ≥3 qualified matches in 7d.

**Day‑1 Admin Dashboard (tiles):**

1. Time‑to‑first‑match (median)
2. % profiles “Ready for Match” (24h)
3. Org verification completion rate
4. Match acceptance rate (+ decline reasons)
5. Safety: report rate & resolution SLA

**Core Events:** `signed_up`, `created_profile`, `profile_ready_for_match`, `org_verified`, `assignment_published`, `match_suggested`, `match_viewed`, `match_accepted`, `match_declined(reason)`, `message_sent`, `verification_requested`, `verification_completed(status)`, `content_reported`.

**Targets (90d):** profile completion ≥60% D+1; first suggestion <24h; acceptance ≥20%; ≥50% assignments with ≥3 qualified matches in 7d; verified users ≥30% by D+14; report rate <1% with <24h SLA.

**Instrumentation Map:** Metric → Events → Owner → Review cadence (weekly).

---

## 7) Performance, Reliability & Ops **[MVP baselines]**

**Web Vitals:** LCP < 2.5s (P75); INP < 200ms (P75); CLS < 0.1.  
**API SLAs:** Read P95 < 800ms; Write P95 < 1200ms.  
**Rate limits:** 60 req/min IP; 120 req/min user token (burst 2×); stricter for auth/verification.  
**Scale:** Private beta up to 5–15 RPS sustained; scale 10× via autoscaling.  
**Uptime:** 99.5% MVP (→ 99.9% post‑beta). Maintenance Sun 02:00–04:00 CET (read‑only).  
**Incidents:** Sev‑1/2/3; status page; postmortems ≤72h.

---

## 8) Integrations & Platform **[MVP → Future]**

**Stack (MVP):** Next.js 15 + TypeScript + React + Tailwind + Supabase (Postgres + Auth) + Resend + Vercel Analytics; file links preferred; signed URLs for small files; CDN.  
**Future:** Apple/GitHub/Facebook auth; Twilio/Vonage SMS; Daily/Vonage video; **Stripe** for future monetization; FeatureFlags table → Unleash/Flipt.

---

## 9) Monetization **[MVP]**

Free; **all pilots get 3 months**; NGOs test free. No transaction fees. Limit **5 free assignments/org**.

---

## 10) Launch Plan **[MVP]**

**Channels:** NGO federations; university career centers; incubators; credibility‑focused creators.  
**Assets:** 90‑sec explainer; onboarding webinar; email sequences (ind/org).  
**Support:** Business hours (human response target <8h) → off‑hours next business day.  
**Exit criteria:** ≥50% assignments with ≥3 qualified matches in 7d; acceptance ≥20%; report rate <1% with <24h SLA for 4 weeks; SLOs met 30 days.  
**Kill/pivot:** acceptance <10% after 2 iterations; org verification <30% after 2 outreach cycles; NPS <0 for 2 cycles.

---

## 11) Open Items

• Insert “Why Now” figures. • Finalize proof categories and default weight guardrails text. • Document moderator RACI.
