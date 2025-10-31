# Expertise Atlas — Product Documentation (MVP, Taxonomy + UI Fixes)
_Generated on 2025-10-30_

## 0) What changed in this revision
- **Scoped lists:** L1 expansion shows **only L2 categories that already contain user-added L4 skills**. L2 pop‑up shows **only L3 subcategories that contain user-added L4**. L3 rows display **name + L4 count**, and expand inline to reveal those L4 items.  
- **L4 interaction:** Clicking an L4 **expands it into a card view in place** (no separate small window). The card has an **Edit** icon; clicking **Edit** opens a **separate editing window** with the full toolkit (proofs, verification requests, project linking, etc.).  
- **Dashboard mode:** **No demo mode** in production. The dashboard shows **only data added by the user**; default is an **empty state** until L4 skills exist. Data persists until the user deletes it.

---

## 1) Purpose & scope
The Expertise Atlas helps individuals map, evidence, and maintain their skills using a shared, extensible taxonomy and a calm interface. It supports add/browse, attaching proofs, requesting verifications, and reading a dashboard that highlights credibility, freshness, and balance.

---

## 2) Taxonomy model (L1 → L2 → L3 → L4)
### 2.1 Domains (L1) — fixed set of six
Six meta-domains organize all skills and anchor color-coding in the UI: **Universal Capabilities (U)**, **Functional Competencies (F)**, **Tools & Technologies (T)**, **Languages & Culture (L)**, **Methods & Practices (M)**, **Domain Knowledge (D)**.

### 2.2 Categories (L2) — unlimited per L1
Each L1 can contain **any number of L2 categories** (curated and extensible with stable codes, short definitions, and low overlap).

### 2.3 Subcategories (L3) — unlimited per L2
Each L2 can contain **any number of L3 subcategories** (curated; concise names + definitions; example skills optional).

### 2.4 Granular skills (L4) — unlimited per L3
Each L3 can contain **any number of L4 leaf skills**. **Users author L4** (free text in MVP) under a chosen L3; curators can later consolidate synonyms.

**Important:** L4 skills are **distinct, specific competencies**—not proficiency levels or context variations. For example, under the L3 "Verbal communication", proper L4 skills include:
- Public speaking to large audiences
- One-on-one conversation
- Storytelling and narrative
- Explaining technical concepts verbally
- Telephone communication
- Pitch delivery

**Not:** "Verbal communication - Intermediate" or "Verbal communication for Teams" (proficiency and context are captured separately via the `level` attribute and usage metadata).

### 2.5 L4 data attributes (per skill)
- Identity: `l1_code`, `l2_code`, `l3_id`/`l3_label`, `l4_label` (user text), optional `l4_slug`
- Proficiency: `level` (1–5 observable rubric)
- Freshness: `last_used_at` → derived **recency** (Active ≤6 mo · Recent 6–24 mo · Rusty >24 mo)
- Relevance: `relevance` (Obsolete · Current · Emerging)
- Evidence: `proofs[]` (type: project/cert/media/reference, url/file, date, note)
- Credibility: `verification` (none/self/peer/manager/external, date, verifier ref)
- System: `created_at`, `updated_at`, `archived`, `owner_id`

> **Scale note:** Designed for **~15,000+ L4** in MVP; indexes should support fuzzy text search on `l4_label` and fast lookups by `(l1,l2,l3)`.

---

## 3) Scientific basis (very brief)
Informed by **ESCO/O*NET** (occupational breadth), **OECD transferable skills** (universals), and learning/proficiency models such as **Dreyfus** and **Bloom** (levels/progression). Evidence design follows **Kirkpatrick‑style** approaches to validating competence.

---

## 4) UI — Navigation & interactions
### 4.1 Atlas navigation (Individual)
- **L1 grid (3×2):** six cards show domain name + cumulative stats (L4 count, avg level, recency mix). **Clicking an L1 expands inline to show only L2 categories that contain at least one user-added L4** (others remain hidden in this scoped view).  
- **L2 list (within expanded L1):** rows show L2 name + **count of user L4**. **Clicking an L2 opens a pop‑up window** (modal) scoped to that L2.  
- **L2 pop‑up (modal):** header breadcrumb `L1 / L2`. **Body lists only L3 subcategories that contain user-added L4**, each with **name + L4 count**. **Clicking an L3 expands inline** to reveal a bullet list of the user’s **L4** under that L3. **Clicking an L4 expands it into a card view in place** (within the modal body).  
- **L4 card view:** shows the existing properties (level, recency, relevance, proofs, verification, links to projects, history). The card includes an **Edit** icon; **clicking Edit opens a separate editing window** with the full toolkit (proof attachment, verification request, link to projects, move to another L3, delete, etc.).

### 4.2 Adding skills (drawer flow)
Global **+ Add Skill** opens a right drawer with 4 steps: **Pick L1 → Pick L2 (searchable) → Pick L3 (searchable) → Enter L4** (+ level, recency, relevance, optional proof). **Save** creates the L4; **Save & add another** keeps the drawer open.

### 4.3 Adding proofs
From the **L4 card**, click **Add proof** → choose type (Project, Certification, Media, Reference), attach link/file, date, and note. Newest proof updates freshness on charts.

### 4.4 Requesting verifications
From the **L4 card**, click **Request verification** → choose **verifier type** (Peer/Manager/External) and recipient. Status: `none/self` → `pending` → `peer/manager/external` when accepted. The verification source feeds dashboard aggregates.

### 4.5 Other actions
- **Delete L4** (with confirm). **Reset Atlas** clears all L4 (confirm).  
- All entries **persist** until deleted by the user; no demo data is present in production.

---

## 5) Dashboard — elements, details, and purpose
The dashboard replaces the former hero. It shows **only user data**; default is an **empty state** until L4 items exist. Global filters (L1, L2, Status, Recency) affect all widgets. Clicking any visualization sets filters and opens a side sheet listing matching L4.

### 5.1 Credibility Status Pie (donut)
- **What it shows:** the share of L4 by status — **Verified (proof + verification)**, **Proof‑only**, **Claim‑only**.  
- **Why it’s here (purpose):** make credibility gaps visible at a glance so users prioritize adding proof and seeking verification.  
- **Data & calc:** counts of L4 grouped by `verification` and presence of `proofs[]`; three mutually exclusive buckets.  
- **Interactions:** click a slice to filter by that status; tooltip shows exact counts and a “View skills” link.

### 5.2 Coverage Heatmap (L1 × L2)
- **What it shows:** breadth and depth by category — **cell size = number of user L4**, **cell color = average level (1–5)**.  
- **Why it’s here:** highlight strong/weak areas to guide growth and showcase specialization.  
- **Data & calc:** aggregate user L4 per (L1,L2); compute mean of `level`.  
- **Interactions:** click a cell to open that L2 pop‑up with L3; tooltip shows counts and avg level.

### 5.3 Relevance Bars
- **What it shows:** counts of L4 labeled **Obsolete**, **Current**, **Emerging** (three vertical bars).  
- **Why it’s here:** focus learning and refresh time where it will matter most next.  
- **Data & calc:** user L4 grouped by `relevance`.  
- **Interactions:** click a bar to filter; tooltip reveals examples and “View skills”.

### 5.4 Recency × Competence Scatter
- **What it shows:** each L4 as a dot (**y = level**, **x = months since last used**; left = recent, right = older). Quadrant guides on hover.  
- **Why it’s here:** quickly spot **strong but stale** skills to refresh first.  
- **Data & calc:** `level` and `last_used_at` (derived months).  
- **Interactions:** brush-select to create a temporary filter; click a dot to open that L4 card.

### 5.5 Skill Wheel (polar area)
- **What it shows:** balance across **L1 domains**; each sector’s radius scales to a **weighted L4 count** (optionally weight Proof = 1.2, Verified = 1.5).  
- **Why it’s here:** reveal overall balance/imbalance and encourage rounded development.  
- **Data & calc:** aggregate weighted counts per L1.  
- **Interactions:** click a sector to filter the dashboard by that L1.

### 5.6 Verification Sources Donut
- **What it shows:** distribution of verification sources — **Self, Peer, Manager, External**.  
- **Why it’s here:** encourage a healthier mix with more independent (Manager/External) attestations.  
- **Data & calc:** latest `verification` source per L4.  
- **Interactions:** click a segment to filter; tooltip shows counts and source definitions.

### 5.7 Next‑Best‑Actions (smart list)
- **What it shows:** prioritized tasks such as **“Add proof to X”**, **“Request verification for Y”**, **“Refresh Z (stale 18 mo)”**, **“Fill gap for target role”**; each item has reason badges (Stale, Low credibility, Role gap).  
- **Why it’s here:** convert insights into concrete next steps so the atlas improves continuously.  
- **Data & calc:** rules over `level`, `last_used_at`, `relevance`, `proofs[]`, `verification`; rank by impact/urgency.  
- **Interactions:** primary actions open the relevant L4 card in edit mode or the request flow.

**Empty state behavior (all widgets):** show a calm skeleton, a one‑line explanation, and a CTA to **add your first skills**.

---

## 6) Collapsible “About” section (on the Expertise page)
A short, collapsible panel that explains the Atlas:
- **What it is:** a structured, extensible way to map your skills, add proof, and keep them fresh.
- **How it works:** _Pick a category_ → _Add skills_ → _Attach proof_ → _Request verification_ → _Track on dashboard_.
- **Scientific basis:** ESCO/O*NET, OECD transferable skills, Dreyfus/Bloom.
- **Privacy:** you control what to share; proofs and verifications are optional.
Default state: collapsed. “Learn more” links to the full guide.

---

## 7) Accessibility, performance, and scale
- **Accessibility:** keyboard-first nav, visible focus rings, ARIA/labels for charts, reduced‑motion variants.
- **Performance:** virtualized lists, debounced search, server‑side counts; indexes on `(l1,l2,l3)` and text search on `l4_label`.
- **Scale:** designed for **15k+ L4** per user/org; charts aggregate incrementally and cache.

---

## 8) Data & persistence
All entries are **user-authored and persist until deleted**. The app stores L4 attributes in §2.5 and computes aggregates for dashboard widgets. All changes are timestamped; verification retains source and time. Taxonomy (L2/L3) is curated centrally and can grow without limit.
