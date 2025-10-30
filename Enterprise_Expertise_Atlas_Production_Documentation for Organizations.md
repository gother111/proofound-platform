---
title: "Enterprise Expertise Atlas — Production Documentation"
version: "1.0"
status: "Ready for implementation"
date: "2025-10-30"
owners:
  - product: Proofound
  - design: Org Atlas squad
  - engineering: Platform & Data
licence: CC BY 4.0
---

# 0) Purpose

The **Enterprise Expertise Atlas** gives an organization a truthful, explainable map of **what it offers**, **how it delivers**, and **where to improve**. It rolls up only **in-use** capabilities (skills + methods + systems + evidence) and exposes them as a small, stable set of domains → sub-capabilities → cards, with ESG and assurance embedded.

This document consolidates the **latest agreed spec** (UX, data, taxonomy, scoring, and dashboard) for production.

---

# 1) Scope & Non-Goals

**In scope**
- Organization view only (enterprise atlas).  
- L1→L2→L3 taxonomy (fixed); L4 is **free text** on L3 cards (no curated list).  
- Scoring model, evidence handling, and dashboard visualizations.  
- ESG integrated at capability and dashboard levels.  
- Figma implementation notes to ensure **visible** prototypes.

**Out of scope (for now)**
- Individual atlas details (covered elsewhere).  
- Automated proficiency inference; external data ingestion; HRIS integrations.  
- Fine-grained policy engines per region (future).

---

# 2) Core Principles

1. **In-use filter**: Only skills/methods **linked to actual work artifacts** (tickets, batches, PRs, engagements) roll up.  
2. **Explainability**: Every roll-up must show **why** it counts (evidence + owners + last update).  
3. **Stability**: Model **capabilities (what)**, not processes/org chart (how/who).  
4. **Resilience**: Highlight **coverage** (bus-factor), **single-holder risks**, and **evidence freshness**.  
5. **ESG first-class**: Metrics appear where they matter (delivery, tech/data, assurance) and at a snapshot.

---

# 3) Information Architecture (UX)

**L1 grid (3×2)** → **L2 drawer** → **L3 cards board** → **L3 detail modal**.

- **L1 (Domains)**: What we offer; How we deliver; Customers & market; Tech & data; Assurance; Innovation.  
- **L2 drawer**: list of sub-capabilities with pills (**L3 count, Avg maturity, Coverage, Open risks**).  
- **L3 cards**: the primary editing surface; include **free-text L4** and decision stats.  
- **Detail modal**: tabs *Overview, KPIs, Evidence, ESG, Notes*.

**About panel**: collapsible, plain-English explainer (capability map, in-use aggregation, proof & ESG, gaps→decisions).

---

# 4) L3 Card — Content & Stats

- Header: **Title**, one-line definition, **Criticality** (Core/Support/Experimental), **Maturity Dial (1–5)**.  
- Tags: **Methods/Frameworks**, **Systems/Tools**.  
- **KPI chips** (2–4).  
- **ESG row** (optional; material metrics only).  
- **Coverage** (people count; bus-factor), **Evidence count**, **Utilization %** (last quarter), **Last proof date**.  
- **Risk** (Low/Med/High) with badges: `S` Single-holder, `C` Compliance-critical, `E` Evidence stale.  
- **L4 (free text)**: “Granular skills / techniques”.  
- Actions: three-dot **Edit, Add evidence, Manage KPIs, Archive**.

**Why these stats**: drive staffing, continuity, credibility, and improvement prioritization.

---

# 5) Scoring & Definitions

- **Maturity (1–5)**: set on L3 card.  
- **Utilization (0–1)**: share of time/volume tagged to this L3 last period.  
- **Verification (0–1)**: artifact 0.25 / KPI 0.5 / certification 0.75 / audited cert 1.0.  
- **Coverage (1..n)**: verified in-use holders; **bus-factor = min(Coverage, 3) / 3**.  
- **Criticality weight**: Core 2.0, Support 1.0, Experimental 0.5.

**L3 score**  
```
score_L3 = (Maturity/5) × Utilization × Verification × (min(Coverage,3)/3) × CriticalityWeight
```

**Roll-ups**: mean of child L3 scores at L2; mean of L2 at L1 (optionally weighted by spend/revenue).

**Freshness**: proof age buckets `<90d | 90–180d | >180d`.  
**Compliance readiness**: controls passed / required (for compliance-critical L3).

---

# 6) Dashboard (8 widgets, production)

The Org dashboard **replaces** the “Coming soon” hero and is visible by default.

1. **Action Bar (Top 3)** — generated insights w/ primary action.  
2. **KPI Strip (6 tiles)** — Capability Health Index, Coverage Risk, Evidence Freshness, Compliance Readiness, ESG Pulse, On-time Delivery.  
3. **Capability Heatmap (L1×L2)** — color: Avg L3 Maturity; badge: Open risks.  
4. **Coverage & Bus-Factor** — stacked bars + Single-holder list (owner, ETA).  
5. **Utilization vs Demand** — clustered bars; over/under flags.  
6. **Value Stream Performance** — cycle-time control chart + defect rate; “Investigate bottleneck” deep-link.  
7. **Compliance Radar** — ISO 9001/27001, GDPR/Privacy, Sector Reg, Buyer Codes; list of audits, expiries, findings.  
8. **ESG Snapshot** — Scope 1/2/3 (or relevant intensity), Safety (TRIR/LTIFR), Governance control pass-rate with sparklines.

**Interaction**: each widget has “Go fix it” linking to the exact filtered L2/L3 view.

---

# 7) Data Model (API/Storage)

## 7.1 Entities (JSON)

```json
{
  "CapabilityL3": {
    "id": "string",
    "l1": "OFFER|DELIV|CUST|TECH|ASSURE|INNOV",
    "l2Code": "ORG.L2.OFFER.01",
    "name": "string",
    "definition": "string",
    "criticality": "CORE|SUPPORT|EXPERIMENTAL",
    "maturity": 1,
    "methods": ["string"],
    "systems": ["string"],
    "kpis": ["kpi_id"],
    "esgMetrics": ["esg_id"],
    "coverageCount": 0,
    "utilizationPct": 0.0,
    "verificationLevel": "ARTIFACT|KPI|CERT|AUDITED_CERT",
    "evidenceCount": 0,
    "lastProofAt": "2025-09-15",
    "risks": ["SINGLE_HOLDER", "COMPLIANCE_CRITICAL", "EVIDENCE_STALE"],
    "riskLevel": "LOW|MEDIUM|HIGH",
    "l4FreeText": "string",
    "owners": ["user_id"],
    "artifacts": ["artifact_id"],
    "complianceControls": ["control_id"],
    "createdAt": "iso",
    "updatedAt": "iso"
  },

  "KPI": {
    "id": "string",
    "name": "string",
    "definition": "string",
    "unit": "string",
    "target": "number",
    "direction": "UP_IS_GOOD|DOWN_IS_GOOD",
    "values": [{"date":"iso","value":0}],
    "source": "string"
  },

  "ESGMetric": {
    "id": "string",
    "name": "SCOPE_1|SCOPE_2|SCOPE_3|TRIR|LTIFR|GOV_PASSRATE|CUSTOM",
    "unit": "tCO2e|rate|%",
    "values": [{"date":"iso","value":0}],
    "material": true
  },

  "Artifact": {
    "id": "string",
    "type": "TICKET|BATCH|PR|WORKPAPER|CERTIFICATE|REPORT",
    "url": "string",
    "date": "iso",
    "verifiedBy": "user_id"
  }
}
```

**Coding**  
- IDs: `ORG.L3.<DOMAIN>.<L2NN>.<MM>` for taxonomy; entities use UUIDs.  
- Variables in UI: `eaOrg.view`, `eaOrg.lane`, `eaOrg.showESG`, `eaOrg.maturity`, `eaOrg.coverage`, `eaOrg.evidenceCount`, `eaOrg.utilization`, `eaOrg.openRisks`.

**Evidence levels** (ordered): `ARTIFACT < KPI < CERT < AUDITED_CERT`.

---

# 8) ESG Integration

- **On cards**: optional ESG row with only **material** metrics for that L3.  
- **On dashboard**: ESG Snapshot tiles + trends.  
- **In detail modal (ESG tab)**: metric selection, data lineage note, link to assurance/evidence.

---

# 9) Permissions & Audit

- Editors: create/edit L3 cards, KPIs, evidence; viewers: read-only.  
- All changes logged with `who/when/what`.  
- Evidence requires a **verifier** (peer or system).

---

# 10) Accessibility & i18n

- WCAG AA; focus rings; keyboardable menus/chevrons; target ≥44px.  
- All user strings translatable; number/date localized; language scale switcher if needed.

---

# 11) Figma Implementation Notes (visibility)

- Place the **dashboard widgets directly on canvas** (no hidden variants/off-canvas).  
- Set this frame as **prototype start**.  
- Default wiring: first L1 → opens L2 drawer; first L2 → opens L3 board prefilled with **≥6** L3 cards (mock data).  
- **Do not render** taxonomy markdown; keep for internal reference only.

---

# 12) Success Criteria (Go/No-Go)

- Dashboard replaces hero; visible with mock data; deep-links open correct boards.  
- Adding/editing an L3 updates **maturity, coverage, utilization** and recalculates roll-ups.  
- Single-holder risks and evidence stale flags appear correctly.  
- ESG Snapshot displays data when configured; hides if none.  
- All UI meets accessibility checks.

---

# 13) Risks & Mitigations

- **Data sparsity** → show placeholders; encourage evidence upload with “stale” badge.  
- **Over-complexity** → keep L1 fixed; L2 count bounded; L3 concise with free-text L4.  
- **Gaming** → require artifact links and verifiers for roll-ups.

---

# 14) L1 • L2 • L3 Taxonomy (final)

> Fixed, region-agnostic; L4 is free text on the L3 card.

## ORG.L1.OFFER — Offering Expertise (What we sell)
- `ORG.L2.OFFER.01` — Portfolio & Catalog Management
  - `ORG.L3.OFFER.01.01` — Product family taxonomy
  - `ORG.L3.OFFER.01.02` — SKU/naming governance
  - `ORG.L3.OFFER.01.03` — Lifecycle status control
- `ORG.L2.OFFER.02` — Value Proposition & Outcome Design
  - `ORG.L3.OFFER.02.01` — Jobs-to-be-Done mapping
  - `ORG.L3.OFFER.02.02` — Outcome/KPI definition
  - `ORG.L3.OFFER.02.03` — Benefit proof library
- `ORG.L2.OFFER.03` — Industry/Sector Specializations
  - `ORG.L3.OFFER.03.01` — Regulatory tailoring
  - `ORG.L3.OFFER.03.02` — Vertical templates/playbooks
  - `ORG.L3.OFFER.03.03` — Reference architectures
- `ORG.L2.OFFER.04` — Pricing & Packaging
  - `ORG.L3.OFFER.04.01` — Pricing strategy (value/cost/comp)
  - `ORG.L3.OFFER.04.02` — Discount & approval matrices
  - `ORG.L3.OFFER.04.03` — Bundling/packaging rules
- `ORG.L2.OFFER.05` — Contracting & Commercial Terms
  - `ORG.L3.OFFER.05.01` — Terms/clauses library
  - `ORG.L3.OFFER.05.02` — Risk/indemnity playbooks
  - `ORG.L3.OFFER.05.03` — Rev-rec triggers & guardrails
- `ORG.L2.OFFER.06` — Service Catalog (Professional/Managed)
  - `ORG.L3.OFFER.06.01` — Service definitions/SOW templates
  - `ORG.L3.OFFER.06.02` — SLA catalog & tiers
  - `ORG.L3.OFFER.06.03` — Rate card governance
- `ORG.L2.OFFER.07` — Product Lifecycle & Variants
  - `ORG.L3.OFFER.07.01` — NPI/NPD stage gates
  - `ORG.L3.OFFER.07.02` — Sustaining change control
  - `ORG.L3.OFFER.07.03` — End-of-life planning
- `ORG.L2.OFFER.08` — Customer Success Add-ons
  - `ORG.L3.OFFER.08.01` — Training curriculum design
  - `ORG.L3.OFFER.08.02` — Enablement asset library
  - `ORG.L3.OFFER.08.03` — Adoption accelerators
- `ORG.L2.OFFER.09` — Embedded/Partnered Offers
  - `ORG.L3.OFFER.09.01` — OEM/white-label governance
  - `ORG.L3.OFFER.09.02` — Co-branding guidelines
  - `ORG.L3.OFFER.09.03` — Partner certification tiers
- `ORG.L2.OFFER.10` — Product-Level ESG & Labels
  - `ORG.L3.OFFER.10.01` — Ecolabel eligibility checks
  - `ORG.L3.OFFER.10.02` — Green-claims substantiation
  - `ORG.L3.OFFER.10.03` — Taxonomy alignment mapping
- `ORG.L2.OFFER.11` — Evidence Library
  - `ORG.L3.OFFER.11.01` — Case study curation
  - `ORG.L3.OFFER.11.02` — Reference customer management
  - `ORG.L3.OFFER.11.03` — Outcome data verification
- `ORG.L2.OFFER.12` — Roadmap Tie-ins
  - `ORG.L3.OFFER.12.01` — Demand signal intake
  - `ORG.L3.OFFER.12.02` — Prioritization framework
  - `ORG.L3.OFFER.12.03` — Release communications

## ORG.L1.DELIV — Operational Delivery (How we make/fulfil/support)
- `ORG.L2.DELIV.01` — Production/Service Execution
  - `ORG.L3.DELIV.01.01` — Standard work/SOPs
  - `ORG.L3.DELIV.01.02` — Takt/cycle planning
  - `ORG.L3.DELIV.01.03` — WIP/flow control
- `ORG.L2.DELIV.02` — Scheduling & Capacity Planning
  - `ORG.L3.DELIV.02.01` — Finite scheduling
  - `ORG.L3.DELIV.02.02` — Capacity/constraint models
  - `ORG.L3.DELIV.02.03` — Load leveling (heijunka)
- `ORG.L2.DELIV.03` — Logistics & Fulfilment
  - `ORG.L3.DELIV.03.01` — Warehouse slotting
  - `ORG.L3.DELIV.03.02` — Last-mile orchestration
  - `ORG.L3.DELIV.03.03` — Reverse logistics
- `ORG.L2.DELIV.04` — Inventory & Materials Management
  - `ORG.L3.DELIV.04.01` — Reorder policy design
  - `ORG.L3.DELIV.04.02` — Inventory accuracy & cycle count
  - `ORG.L3.DELIV.04.03` — Consignment/VMI controls
- `ORG.L2.DELIV.05` — Field Service & After-Sales Support
  - `ORG.L3.DELIV.05.01` — Dispatch optimization
  - `ORG.L3.DELIV.05.02` — Spare parts planning
  - `ORG.L3.DELIV.05.03` — KB/diagnostics workflows
- `ORG.L2.DELIV.06` — Facilities & Asset Operations (O&M)
  - `ORG.L3.DELIV.06.01` — PM/PdM plans
  - `ORG.L3.DELIV.06.02` — Utilities management (energy/water)
  - `ORG.L3.DELIV.06.03` — Asset performance monitoring
- `ORG.L2.DELIV.07` — Reliability & Maintenance (CMMS/OEE)
  - `ORG.L3.DELIV.07.01` — Condition-based maintenance
  - `ORG.L3.DELIV.07.02` — Root cause analysis (RCA)
  - `ORG.L3.DELIV.07.03` — OEE dashboarding
- `ORG.L2.DELIV.08` — Process Quality & HSE Metrics
  - `ORG.L3.DELIV.08.01` — Statistical process control
  - `ORG.L3.DELIV.08.02` — Safety leading indicators
  - `ORG.L3.DELIV.08.03` — Environmental intensity tracking
- `ORG.L2.DELIV.09` — Business Continuity & DR
  - `ORG.L3.DELIV.09.01` — Risk scenario planning
  - `ORG.L3.DELIV.09.02` — Recovery runbooks/tests
  - `ORG.L3.DELIV.09.03` — Site redundancy/failover
- `ORG.L2.DELIV.10` — Service Support & Incident Management
  - `ORG.L3.DELIV.10.01` — Tiered support model
  - `ORG.L3.DELIV.10.02` — Incident SLA policies
  - `ORG.L3.DELIV.10.03` — Problem/Change management
- `ORG.L2.DELIV.11` — Cost & Throughput Optimization
  - `ORG.L3.DELIV.11.01` — Value stream mapping
  - `ORG.L3.DELIV.11.02` — Bottleneck management
  - `ORG.L3.DELIV.11.03` — Cost-to-serve analysis
- `ORG.L2.DELIV.12` — Supplier Enablement for Delivery
  - `ORG.L3.DELIV.12.01` — VMI onboarding
  - `ORG.L3.DELIV.12.02` — Supplier scorecards
  - `ORG.L3.DELIV.12.03` — ASN/EDI integration

## ORG.L1.CUST — Customer & Market (Who we serve; how we win/keep)
- `ORG.L2.CUST.01` — Market & Competitive Intelligence
  - `ORG.L3.CUST.01.01` — TAM/SAM/SOM modeling
  - `ORG.L3.CUST.01.02` — Competitive battlecards
  - `ORG.L3.CUST.01.03` — Win/loss analysis
- `ORG.L2.CUST.02` — Segmentation & Targeting
  - `ORG.L3.CUST.02.01` — ICP definition
  - `ORG.L3.CUST.02.02` — Persona research
  - `ORG.L3.CUST.02.03` — Propensity scoring
- `ORG.L2.CUST.03` — Brand & Positioning
  - `ORG.L3.CUST.03.01` — Narrative framework
  - `ORG.L3.CUST.03.02` — Visual identity system
  - `ORG.L3.CUST.03.03` — Messaging architecture
- `ORG.L2.CUST.04` — Marketing & Demand Generation
  - `ORG.L3.CUST.04.01` — Campaign orchestration
  - `ORG.L3.CUST.04.02` — Content operations
  - `ORG.L3.CUST.04.03` — Lead scoring & nurture
- `ORG.L2.CUST.05` — Sales Execution (New & Expansion)
  - `ORG.L3.CUST.05.01` — Sales playbooks
  - `ORG.L3.CUST.05.02` — Pipeline governance
  - `ORG.L3.CUST.05.03` — Deal desk operations
- `ORG.L2.CUST.06` — Account Management & Renewals
  - `ORG.L3.CUST.06.01` — QBR framework
  - `ORG.L3.CUST.06.02` — Health scoring models
  - `ORG.L3.CUST.06.03` — Churn/expansion playbooks
- `ORG.L2.CUST.07` — Channel/Partner Management
  - `ORG.L3.CUST.07.01` — Partner onboarding
  - `ORG.L3.CUST.07.02` — MDF/incentive programs
  - `ORG.L3.CUST.07.03` — Joint business planning
- `ORG.L2.CUST.08` — Proposal/Tender Management
  - `ORG.L3.CUST.08.01` — Bid/no-bid gates
  - `ORG.L3.CUST.08.02` — Proposal knowledge base
  - `ORG.L3.CUST.08.03` — Compliance & pricing review
- `ORG.L2.CUST.09` — Voice of Customer & CX Metrics
  - `ORG.L3.CUST.09.01` — Survey program design
  - `ORG.L3.CUST.09.02` — Journey mapping
  - `ORG.L3.CUST.09.03` — Close-the-loop actions
- `ORG.L2.CUST.10` — Sustainability Claims & Buyer Requirements
  - `ORG.L3.CUST.10.01` — Buyer code compliance mapping
  - `ORG.L3.CUST.10.02` — Product footprint request handling
  - `ORG.L3.CUST.10.03` — Evidentiary dossier creation
- `ORG.L2.CUST.11` — Community/Government Relations
  - `ORG.L3.CUST.11.01` — Stakeholder mapping
  - `ORG.L3.CUST.11.02` — Public-affairs calendar
  - `ORG.L3.CUST.11.03` — Community impact reporting
- `ORG.L2.CUST.12` — Strategic Accounts Programs
  - `ORG.L3.CUST.12.01` — Account plan templates
  - `ORG.L3.CUST.12.02` — Exec sponsorship model
  - `ORG.L3.CUST.12.03` — Relationship multithreading

## ORG.L1.TECH — Tech & Data Enablement (What powers delivery)
- `ORG.L2.TECH.01` — Enterprise Architecture & Roadmaps
  - `ORG.L3.TECH.01.01` — Capability-to-system mapping
  - `ORG.L3.TECH.01.02` — Standards/guardrails registry
  - `ORG.L3.TECH.01.03` — Tech-debt register
- `ORG.L2.TECH.02` — Product/Platform Engineering
  - `ORG.L3.TECH.02.01` — Architecture patterns
  - `ORG.L3.TECH.02.02` — Backlog/sprint governance
  - `ORG.L3.TECH.02.03` — Secure SDLC practices
- `ORG.L2.TECH.03` — DevOps/SRE & Release Management
  - `ORG.L3.TECH.03.01` — CI/CD pipelines
  - `ORG.L3.TECH.03.02` — SLO/SLI reliability management
  - `ORG.L3.TECH.03.03` — Change/release calendars
- `ORG.L2.TECH.04` — Business Applications (ERP/CRM/MES/PLM)
  - `ORG.L3.TECH.04.01` — Master data governance
  - `ORG.L3.TECH.04.02` — Process configuration
  - `ORG.L3.TECH.04.03` — Upgrade/patch policy
- `ORG.L2.TECH.05` — Integration & APIs
  - `ORG.L3.TECH.05.01` — API lifecycle management
  - `ORG.L3.TECH.05.02` — Event/streaming backbone
  - `ORG.L3.TECH.05.03` — Data contracts/SLAs
- `ORG.L2.TECH.06` — Data Management & Governance
  - `ORG.L3.TECH.06.01` — Catalog/lineage
  - `ORG.L3.TECH.06.02` — Data quality rules
  - `ORG.L3.TECH.06.03` — Access/privacy controls
- `ORG.L2.TECH.07` — Analytics/AI & Decisioning
  - `ORG.L3.TECH.07.01` — BI semantic models
  - `ORG.L3.TECH.07.02` — ML feature store
  - `ORG.L3.TECH.07.03` — Experimentation/AB frameworks
- `ORG.L2.TECH.08` — Cybersecurity & Privacy
  - `ORG.L3.TECH.08.01` — Identity & access management
  - `ORG.L3.TECH.08.02` — Threat detection/response
  - `ORG.L3.TECH.08.03` — Privacy impact assessments
- `ORG.L2.TECH.09` — Infrastructure/Cloud/Edge
  - `ORG.L3.TECH.09.01` — Landing zones
  - `ORG.L3.TECH.09.02` — FinOps/cost optimization
  - `ORG.L3.TECH.09.03` — Observability stack
- `ORG.L2.TECH.10` — OT/IoT & Instrumentation
  - `ORG.L3.TECH.10.01` — Sensor strategy
  - `ORG.L3.TECH.10.02` — Edge gateways
  - `ORG.L3.TECH.10.03` — OT network segmentation
- `ORG.L2.TECH.11` — Model Risk & MLOps
  - `ORG.L3.TECH.11.01` — Model validation/testing
  - `ORG.L3.TECH.11.02` — Drift/monitoring
  - `ORG.L3.TECH.11.03` — Model cards/governance
- `ORG.L2.TECH.12` — ESG Data Systems & LCA Pipelines
  - `ORG.L3.TECH.12.01` — Scope 1/2/3 data pipelines
  - `ORG.L3.TECH.12.02` — LCA modeling framework
  - `ORG.L3.TECH.12.03` — Audit/assurance workflow

## ORG.L1.ASSURE — Assurance (Risk • Quality • Compliance • Governance)
- `ORG.L2.ASSURE.01` — Quality Management System (QMS)
  - `ORG.L3.ASSURE.01.01` — Document control
  - `ORG.L3.ASSURE.01.02` — Nonconformance/CAPA
  - `ORG.L3.ASSURE.01.03` — Supplier quality
- `ORG.L2.ASSURE.02` — Product/Service Certifications & Labels
  - `ORG.L3.ASSURE.02.01` — Certification roadmap
  - `ORG.L3.ASSURE.02.02` — Audit readiness kits
  - `ORG.L3.ASSURE.02.03` — Label usage governance
- `ORG.L2.ASSURE.03` — Regulatory/Standards Compliance
  - `ORG.L3.ASSURE.03.01` — Regulatory inventory
  - `ORG.L3.ASSURE.03.02` — Control mapping
  - `ORG.L3.ASSURE.03.03` — Change monitoring
- `ORG.L2.ASSURE.04` — Enterprise Risk Management & Internal Control
  - `ORG.L3.ASSURE.04.01` — Risk register/appetite
  - `ORG.L3.ASSURE.04.02` — Control testing
  - `ORG.L3.ASSURE.04.03` — Issue remediation
- `ORG.L2.ASSURE.05` — Internal/External Audit Readiness
  - `ORG.L3.ASSURE.05.01` — Evidence management
  - `ORG.L3.ASSURE.05.02` — Sampling/walkthroughs
  - `ORG.L3.ASSURE.05.03` — Findings tracking
- `ORG.L2.ASSURE.06` — Information Security Compliance
  - `ORG.L3.ASSURE.06.01` — ISMS scope/policy
  - `ORG.L3.ASSURE.06.02` — Control implementation
  - `ORG.L3.ASSURE.06.03` — Continuous monitoring
- `ORG.L2.ASSURE.07` — Privacy & Data Protection
  - `ORG.L3.ASSURE.07.01` — Records of processing
  - `ORG.L3.ASSURE.07.02` — DPIAs/LIAs
  - `ORG.L3.ASSURE.07.03` — Data subject rights
- `ORG.L2.ASSURE.08` — Ethics, Anti-Corruption & TPDD
  - `ORG.L3.ASSURE.08.01` — Third-party screening
  - `ORG.L3.ASSURE.08.02` — Gifts/hospitality logs
  - `ORG.L3.ASSURE.08.03` — Speak-up investigations
- `ORG.L2.ASSURE.09` — Legal/Contracts/IP Management
  - `ORG.L3.ASSURE.09.01` — Clause/template library
  - `ORG.L3.ASSURE.09.02` — IP portfolio management
  - `ORG.L3.ASSURE.09.03` — Litigation tracking
- `ORG.L2.ASSURE.10` — Sustainability Reporting & Assurance
  - `ORG.L3.ASSURE.10.01` — Disclosure mapping (IFRS/ESRS/GRI)
  - `ORG.L3.ASSURE.10.02` — Data controls & lineage
  - `ORG.L3.ASSURE.10.03` — External assurance coordination
- `ORG.L2.ASSURE.11` — Environmental Management & GHG Accounting
  - `ORG.L3.ASSURE.11.01` — Emissions boundaries/factors
  - `ORG.L3.ASSURE.11.02` — Supplier data quality program
  - `ORG.L3.ASSURE.11.03` — Reduction initiatives registry
- `ORG.L2.ASSURE.12` — Health, Safety & Environment (HSE)
  - `ORG.L3.ASSURE.12.01` — Hazard ID & risk assessment
  - `ORG.L3.ASSURE.12.02` — Safety training & drills
  - `ORG.L3.ASSURE.12.03` — Incident/near-miss reporting

## ORG.L1.INNOV — Adaptive & Innovation (How we evolve)
- `ORG.L2.INNOV.01` — Research & Applied Science
  - `ORG.L3.INNOV.01.01` — Research agenda/hypotheses
  - `ORG.L3.INNOV.01.02` — Lab protocols/ethics
  - `ORG.L3.INNOV.01.03` — Publication/patent pipeline
- `ORG.L2.INNOV.02` — Product Discovery & Incubation
  - `ORG.L3.INNOV.02.01` — Problem/solution interviews
  - `ORG.L3.INNOV.02.02` — Prototyping/usability tests
  - `ORG.L3.INNOV.02.03` — Beta/early-access programs
- `ORG.L2.INNOV.03` — Portfolio & Roadmap Management
  - `ORG.L3.INNOV.03.01` — Prioritization frameworks
  - `ORG.L3.INNOV.03.02` — Capacity/funding allocation
  - `ORG.L3.INNOV.03.03` — Portfolio health dashboards
- `ORG.L2.INNOV.04` — Experimentation & Pilots
  - `ORG.L3.INNOV.04.01` — Experiment design/guardrails
  - `ORG.L3.INNOV.04.02` — Test data management
  - `ORG.L3.INNOV.04.03` — Success criteria/rollback
- `ORG.L2.INNOV.05` — Partnerships & Ecosystems
  - `ORG.L3.INNOV.05.01` — Partner scouting/evaluation
  - `ORG.L3.INNOV.05.02` — Contracting/IP terms
  - `ORG.L3.INNOV.05.03` — Governance cadence
- `ORG.L2.INNOV.06` — Capability Building & Upskilling
  - `ORG.L3.INNOV.06.01` — Skill gap analysis
  - `ORG.L3.INNOV.06.02` — Learning paths/academies
  - `ORG.L3.INNOV.06.03` — Coaching/communities of practice
- `ORG.L2.INNOV.07` — Change Management & Org Design
  - `ORG.L3.INNOV.07.01` — Stakeholder analysis
  - `ORG.L3.INNOV.07.02` — Communications plan
  - `ORG.L3.INNOV.07.03` — Adoption measurement
- `ORG.L2.INNOV.08` — Sustainability/Decarbonization Programs
  - `ORG.L3.INNOV.08.01` — Abatement cost curves
  - `ORG.L3.INNOV.08.02` — Transition milestones
  - `ORG.L3.INNOV.08.03` — Supplier engagement
- `ORG.L2.INNOV.09` — Grants & Non-Dilutive Funding
  - `ORG.L3.INNOV.09.01` — Opportunity scanning
  - `ORG.L3.INNOV.09.02` — Proposal development
  - `ORG.L3.INNOV.09.03` — Compliance/reporting
- `ORG.L2.INNOV.10` — Foresight, Scenarios & Risk Sensing
  - `ORG.L3.INNOV.10.01` — Horizon scanning
  - `ORG.L3.INNOV.10.02` — Scenario workshops
  - `ORG.L3.INNOV.10.03` — Early-warning indicators
- `ORG.L2.INNOV.11` — Corporate Development (M&A/JV)
  - `ORG.L3.INNOV.11.01` — Target screening
  - `ORG.L3.INNOV.11.02` — Due-diligence playbooks
  - `ORG.L3.INNOV.11.03` — Integration planning
- `ORG.L2.INNOV.12` — Open Innovation & Community/OSS
  - `ORG.L3.INNOV.12.01` — Community governance
  - `ORG.L3.INNOV.12.02` — Contribution guidelines
  - `ORG.L3.INNOV.12.03` — License compliance

---

# 15) Glossary

- **Capability**: stable “ability to do X” that delivers value.  
- **Bus-factor**: number of people whose loss would break the capability (we cap at 3).  
- **Evidence**: artifacts proving in-use performance (tickets, audits, certs, KPIs).  
- **Material ESG**: metrics that meaningfully affect value or compliance for a capability.

---

# 16) Open follow-ups (post-MVP)

- HRIS/ATS integration for utilization & coverage.  
- Automated artifact ingestion (Git, JIRA, MES, LIMS).  
- Regional governance modes (EU AI/DE Works Council/CN PIPL).

---

**End of document**
