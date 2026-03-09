# PROOFOUND — PRD TECHNICAL REQUIREMENTS & ARCHITECTURE

**Document Version**: 1.0  
**Last Updated**: 2026-03-09  
**Scope**: Complete technical specifications for MVP → Future-proof architecture  
**Audience**: Engineering, Product, Leadership

---

## TABLE OF CONTENTS

1. [Non-Functional Requirements](#1-non-functional-requirements)
2. [Data Model (High-Level)](#2-data-model-high-level)
3. [Integrations](#3-integrations)
4. [Dependencies & Constraints](#4-dependencies--constraints)
5. [Launch Plan](#5-launch-plan)
6. [Document Summary](#6-document-summary)
7. [Block 12: Canonical Launch Security, NFR Hardening, and Spec Reconciliation Appendix](#7-block-12-canonical-launch-security-nfr-hardening-and-spec-reconciliation-appendix)

---

> Canonical launch note: Section 7 is the authoritative launch contract for security, auth, storage, privacy, accessibility, reliability, and operational readiness. Where older sections in this document describe broader, earlier, or post-MVP assumptions, Section 7 overrides them for launch implementation.

## 1. NON-FUNCTIONAL REQUIREMENTS

### 1.1 Security

#### MVP Security Requirements

**Authentication**:

- ✅ Email/password with bcrypt hashing (Supabase Auth)
- ✅ OAuth 2.0 (Google, LinkedIn)
- ✅ Supabase SSR cookie sessions for interactive web auth
- ✅ HttpOnly, Secure session cookies with server-side revocation on logout, password reset, or admin invalidation
- ✅ Scoped capability tokens for verification, recovery, invite, and proof-response flows
- ⚠️ Rate limiting: 60 req/min per IP, 120 req/min per authenticated user

**Authorization**:

- ✅ Row-Level Security (RLS) policies on all 30+ database tables
- ✅ Role-Based Access Control (RBAC) for organizations:
  - `owner`: Full control
  - `admin`: Manage members, assignments
  - `member`: Create content
  - `viewer`: Read-only
- ✅ Persona-based routing (individual vs org_member)
- ✅ Service role bypasses RLS (admin operations only)

**Data Protection**:

- ✅ Encryption at rest: AES-256 (Supabase managed)
- ✅ Encryption in transit: TLS 1.3
- ✅ Encrypted backups (daily, 30-day retention)
- ✅ PII scrubbing in logs
- ✅ IP address auto-deletion after 90 days

**Application Security**:

- ✅ OWASP Top 10 compliance
- ✅ XSS prevention (React auto-escaping + DOMPurify for rich text)
- ✅ CSRF protection (double-submit token on cookie-auth mutating routes)
- ✅ SQL injection prevention (Drizzle ORM parameterized queries)
- ✅ Input validation (Zod schemas)
- ⚠️ Rate limiting implementation needed
- ⚠️ Brute-force protection (10 attempts = 15-min lockout)

#### Future Security Enhancements

**Post-MVP**:

- MFA/2FA (TOTP via Supabase Auth)
- Biometric authentication (mobile apps)
- SSO/SAML/OIDC for enterprise
- SCIM provisioning
- Security headers (CSP, HSTS already configured)
- Penetration testing (quarterly)
- Bug bounty program

**Compliance Certifications**:

- SOC 2 Type II (target: 100K+ users)
- ISO 27001 (enterprise customers)

---

### 1.2 Privacy

#### MVP Privacy Architecture

**Privacy by Design**:

- ✅ Minimal data collection (only what's needed for matching)
- ✅ Privacy-by-default settings:
  - App profile visibility: `private` by default
  - Public portfolio publication: explicit user action required and non-indexed by default until publication criteria are met
  - Contact/work email visibility: `private` by default
  - Proof visibility: `private`
  - Marketing emails: opt-in
- ✅ Granular visibility controls (public/network/private)
- ✅ Opt-in for ML training, analytics, marketing

**Data Classification** (4-tier system):

- 🔴 **Tier 1 (PII)**: Email, phone, IP addresses, payment info
  - Access: User only, admins with audit trail
  - Storage: Encrypted, auto-deleted per retention policy
- 🟠 **Tier 2 (Sensitive Professional)**: Compensation preferences, verifier relationships
  - Access: User + explicitly shared organizations
  - Storage: Encrypted, masked in UI
- 🟡 **Tier 3 (Semi-Public)**: Skills, experience, proofs (user-controlled)
  - Access: User configurable (public/network/private)
  - Storage: Standard encryption
- 🟢 **Tier 4 (Public)**: Organization profiles, published assignments
  - Access: Anyone authenticated
  - Storage: Standard, CDN-cacheable

**Blind-by-default progressive reveal** (matching, shortlist review, messaging):

- ✅ Matching and shortlist review are blind-by-default. Identity, contact, exact location, compensation specifics, public portfolio links, and other bias-sensitive signals remain hidden unless a later reveal stage explicitly permits them.
- ✅ Public portfolio publication is a separate explicit-public surface and does not weaken blind review inside matching surfaces.
- ✅ Candidate approval is required for any identity-bearing reveal, including name, photo, employer or school names, direct portfolio access, exact location, exact compensation, or contact details.
- ✅ Existing implementation reveal scopes remain the canonical technical contract:
  - `blind` maps to product Stage 0 anonymous review and Stage 1 capability + proof review.
  - `shortlist_identity` maps to product Stage 2 contextual reveal.
  - `full_identity` maps to product Stage 3 intro-approved reveal and Stage 4 interview coordination reveal.
- ✅ Product stage rules:
  - **Stage 0: anonymous / redacted review**
    - Visible: anonymous label, capability summary, skill clusters, proof-pack summaries, outcome evidence summaries, work-mode fit, timezone band or broad region if needed, compensation fit as `overlap / no overlap / not shared`, narrow verification labels, rank band or unordered shortlist position.
    - Hidden: name, handle, photo, exact location, employer names, school names, exact compensation, contact details, public portfolio URL, direct social/profile links, demographic or inferred bias-sensitive signals.
    - Allowed actions: shortlist, pass, snooze, request more proof, request contextual reveal.
  - **Stage 1: capability + proof review**
    - Visible: Stage 0 plus deeper proof-pack content, artifact summaries, methods/tools, outcome metrics, verification summary, and redacted class labels such as “global NGO” or “public university” when redaction is enabled.
    - Hidden: name, photo, handle, direct links, contact details, exact employer or school names when redaction is enabled, exact location, exact compensation, demographic or inferred bias-sensitive signals.
    - Allowed actions: keep under review, shortlist, pass, request contextual reveal, request missing proof.
  - **Stage 2: contextual reveal**
    - Visible: Stage 1 plus exact timezone, metro or region, work authorization summary, availability window, and employer, school, or portfolio context only when redaction is disabled and candidate consent exists.
    - Hidden: personal contact details, non-revealable private social links, exact compensation unless separately allowed, demographic or inferred bias-sensitive signals.
    - Allowed actions: request intro, request Stage 3 reveal, pass with structured feedback, continue in-platform discussion.
  - **Stage 3: intro-approved reveal**
    - Visible: full name, photo, public portfolio URL if published, employer and school names according to profile visibility, allowed verification labels, and the identified intro thread.
    - Hidden: direct email, phone, and off-platform contact details by default; exact compensation unless separately allowed.
    - Allowed actions: approve intro, open identified thread, exchange structured intro context, request interview.
  - **Stage 4: interview coordination reveal**
    - Visible: direct contact channel needed for coordination, exact location only when needed for interview logistics, calendar or meeting details, and exact compensation only when separately allowed or negotiation-safe.
    - Hidden: anything outside coordination scope plus demographic or inferred bias-sensitive signals.
    - Allowed actions: schedule interview, exchange meeting details, negotiate logistics.
- ✅ Redaction mode takes priority over general public visibility inside matching surfaces.
- ✅ Exact rank is hidden by default. Rank bands are the standard until fairness policy and workflow stage permit exact rank exposure.
- ✅ Verification badges remain conservative in early stages and must not reveal raw verifier identities or detailed provenance.
- ✅ Manually uploaded artifacts with identifying metadata must be sanitized, withheld, or requires-review before they can appear in reveal-stage UI.

**GDPR Compliance** (EU users):

- ✅ Right to Access (Art. 15): Data export in JSON format, <48h SLA
- ✅ Right to Rectification (Art. 16): Profile editing always available
- ✅ Right to Erasure (Art. 17):
  - Soft delete: 30-day grace period
  - Hard delete: Permanent after 30 days
  - Exceptions: Financial records (7 years), anonymized analytics
- ✅ Right to Portability (Art. 20): JSON export with all user data
- ✅ Right to Object (Art. 21): Opt-out of ML training, marketing
- ✅ Data Processing Agreements (DPAs) with organizations
- ✅ Consent management system (version tracking)

**CCPA Compliance** (California users):

- ✅ Right to Know: Data export shows all collected data
- ✅ Right to Delete: Account deletion flow
- ✅ Right to Opt-Out: "Do Not Sell" (we don't sell data, but opt-out available)
- ✅ Right to Non-Discrimination: Opting out doesn't reduce functionality

**Data Retention**:

- Auth/application logs: 180 days
- Audit logs: 2 years (compliance requirement)
- Soft-deleted accounts: 30 days → purge
- Messages: Retained until conversation closes (user can export)
- Analytics events: 2 years → anonymize → archive

**Audit Logging**:

- ✅ Security events: Login, logout, password changes, permission changes
- ✅ Privacy events: Profile views by orgs, data exports, consent changes
- ✅ Admin events: Admin access to user data, moderation actions, deletions
- ✅ Reveal events: requested scope, granted scope, actor type, actor ID when available, target profile, org, assignment, and match IDs, source surface, trigger type, reason code, consent state, policy version, outcome, timestamp
- ✅ Retention: 2 years for compliance

#### Future Privacy Enhancements

**Post-MVP**:

- Differential privacy for aggregated analytics
- Data residency options (EU/US/AP regions)
- Privacy dashboard (who accessed your data, when)
- Granular per-field visibility controls
- Anonymous browsing mode
- Enhanced PII detection in user-generated content

---

### 1.3 Performance

#### MVP Performance Targets

**Web Vitals** (75th percentile):

- LCP (Largest Contentful Paint): <2.5s
- INP (Interaction to Next Paint): <200ms
- CLS (Cumulative Layout Shift): <0.1
- TTFB (Time to First Byte): <600ms

**API Performance** (95th percentile):

- Read queries: <800ms
- Write queries: <1200ms
- Matching computation: <5s (cold start)
- Search queries: <500ms

**Database Performance**:

- Query response time: <100ms (P95)
- Connection pool: PgBouncer via Supabase
- Concurrent connections: Up to 500 (Pro tier)
- Indexes on all foreign keys and commonly queried fields

**Caching Strategy**:

- Browser cache: Static assets (1 year)
- CDN cache: Vercel Edge Network (automatic)
- Application cache: React Query (5-minute stale time)
- ⚠️ Redis cache (Post-MVP): Sessions, matching scores, taxonomy data

**Optimization Techniques**:

- ✅ Code splitting (Next.js automatic)
- ✅ Image optimization (next/image)
- ✅ Lazy loading (below-the-fold content)
- ✅ Server Components (reduce client bundle)
- ✅ Font optimization (next/font)
- ⚠️ ISR (Incremental Static Regeneration) for public pages

#### Future Performance Enhancements

**Post-MVP**:

- Semantic search with pgvector (ANN index for <3s matching)
- Read replicas (separate read/write traffic)
- Database partitioning (analytics_events, messages by month)
- Redis caching layer (sessions, matching results)
- CDN for user-generated content
- Worker threads for matching computation
- GraphQL for flexible queries (reduce over-fetching)

**Scale Targets** (500K+ users):

- LCP: <1.5s
- API P95: <500ms
- Matching: <2s
- Uptime: 99.99%

---

### 1.4 Reliability

#### MVP Reliability Requirements

**Uptime**:

- Target: 99.5% uptime (MVP)
- Allowed downtime: ~3.6 hours/month
- Maintenance window: Sunday 02:00-04:00 CET (read-only mode)

**Error Handling**:

- ✅ Graceful degradation (features fail independently)
- ✅ User-friendly error messages
- ✅ Automatic retries (3 attempts with exponential backoff)
- ✅ Circuit breakers for external services
- ⚠️ Error tracking (Sentry integration needed)

**Data Durability**:

- Daily automated backups (Supabase)
- 30-day backup retention
- Point-in-time recovery (PITR) available
- Multi-region replication (Supabase automatic)
- RPO (Recovery Point Objective): 24 hours
- RTO (Recovery Time Objective): 8 hours

**Monitoring**:

- ✅ Vercel Analytics (web vitals)
- ✅ Supabase Dashboard (database metrics)
- ✅ Sentry (error tracking and release health)
- ⚠️ Uptime monitoring (single external checker for `/` and `/api/health`)
- ⚠️ Custom metrics via OpenTelemetry (post-launch, non-canonical for MVP)

**Incident Response**:

- Severity levels: Sev-1 (critical), Sev-2 (high), Sev-3 (medium), Sev-4 (low)
- Sev-1 response time: <1 hour
- Postmortem for all Sev-1/2 incidents within 72 hours
- Status page for user communication

#### Future Reliability Enhancements

**Post-MVP**:

- 99.9% uptime target
- Multi-region deployment (US-East, EU-West, AP-South)
- Auto-failover for database
- Load balancing across regions
- Chaos engineering (resilience testing)
- PagerDuty integration for on-call

---

### 1.5 Scalability

#### MVP Scalability Architecture

**Current Capacity** (Private Beta):

- Users: 1,000-5,000
- Concurrent sessions: 100-200
- Database size: <5GB
- API requests: 5-10 RPS sustained, 20 RPS peak
- Matching computations: 100/hour

**Horizontal Scaling**:

- ✅ Vercel Edge Functions (auto-scales)
- ✅ Supabase connection pooling (PgBouncer)
- ⚠️ Stateless architecture (for future load balancing)

**Vertical Scaling**:

- Supabase Pro: 8GB database, 250GB bandwidth
- Can upgrade to Team tier: 500GB database, 1TB bandwidth

**Database Scaling Strategy**:

1. **0-10K users**: Single Postgres instance (Supabase Pro)
2. **10K-50K users**: Add read replicas + caching
3. **50K-500K users**: Partition large tables, add Elasticsearch
4. **500K+ users**: Consider sharding by user_id

**Bottleneck Identification**:

- Matching algorithm: Pre-compute scores and persist queue state in Postgres-backed workers
- Full-text search: Migrate to Elasticsearch at 50K+ assignments
- Real-time messaging: Migrate to a dedicated realtime transport only if polling or database-backed fan-out becomes insufficient
- File storage: Migrate to AWS S3 + CloudFront at 10TB+

#### Future Scalability Targets

**Post-MVP** (100K users):

- Concurrent sessions: 5,000
- Database size: 100GB
- API requests: 100 RPS sustained, 500 RPS peak
- Matching computations: 10,000/hour

**Post-MVP** (500K users):

- Concurrent sessions: 25,000
- Database size: 500GB
- API requests: 500 RPS sustained, 2,000 RPS peak
- Matching computations: 50,000/hour

**Infrastructure Evolution**:

- Kafka for event streaming (analytics, webhooks)
- Elasticsearch for advanced search
- Redis for caching + Pub/Sub (post-launch only if evidence justifies added operational complexity)
- CDN for user-generated content (Cloudflare)
- Microservices for matching engine (separate from API)

---

### 1.6 Accessibility

#### MVP Accessibility Requirements

**WCAG 2.1 Level AA Compliance**:

- ✅ Semantic HTML (proper heading hierarchy, landmarks)
- ✅ Keyboard navigation (all interactive elements accessible)
- ✅ Focus indicators (visible :focus-visible styles)
- ✅ Color contrast: 4.5:1 for normal text, 3:1 for large text
- ✅ Alt text for images
- ✅ ARIA labels for icon-only buttons
- ✅ Form labels associated with inputs
- ⚠️ Screen reader testing needed

**Component Accessibility**:

- ✅ Radix UI (WCAG-compliant primitives)
- ✅ Button: Proper focus, hover, active states
- ✅ Forms: Error announcements, field validation
- ✅ Modals: Focus trapping, ESC to close
- ✅ Dropdowns: Keyboard navigation
- ⚠️ Toast notifications: aria-live regions

**Internationalization** (i18n):

- ✅ next-intl configured for an English launch baseline
- ✅ Message files structure created
- ⚠️ Swedish runtime parity deferred until post-launch
- ⚠️ RTL support (Arabic, Hebrew) - Post-MVP
- ⚠️ CJK support (Chinese, Japanese, Korean) - Post-MVP

**Responsive Design**:

- ✅ Mobile-first approach
- ✅ Breakpoints: mobile (0px), tablet (768px), desktop (1024px), wide (1280px)
- ✅ Touch-friendly tap targets (44×44px minimum)
- ⚠️ Mobile PWA (Progressive Web App) - Post-MVP

#### Future Accessibility Enhancements

**Post-MVP**:

- High contrast mode
- Font size adjustment
- Screen reader optimization
- Keyboard shortcuts
- Voice control support (mobile)
- Accessibility statement page
- Annual accessibility audit

---

## 2. DATA MODEL (HIGH-LEVEL)

### 2.1 Core Entities

#### Profiles & Identity

**`profiles`** (Base table for all users):

```
Primary Key: id (UUID, references auth.users)
Fields: handle, displayName, avatarUrl, locale, persona, deletionRequestedAt, deleted
Relationships:
  → individualProfiles (1:1)
  → organizationMembers (1:many)
  → skills, capabilities, matches
```

**`individual_profiles`** (Individual-specific data):

```
Primary Key: userId (UUID, FK → profiles.id)
Fields: headline, bio, skills[], location, visibility, tagline, mission, coverImageUrl, verified, values, causes[]
Tier: Tier 3 (Semi-Public, user-controlled)
```

**`organizations`** (Organization entities):

```
Primary Key: id (UUID)
Unique: slug (for routing)
Fields: legalName, displayName, type, logoUrl, coverImageUrl, tagline, mission, vision, website, industry, organizationSize, impactArea, legalForm, foundedDate, registrationCountry, organizationNumber, locations[], values, workCulture
Tier: Tier 4 (Public)
Relationships:
  → organizationMembers (1:many)
  → assignments (1:many)
  → projects (1:many)
```

**`organization_members`** (Membership + RBAC):

```
Composite PK: (orgId, userId)
Fields: role (owner/admin/member/viewer), status (active/invited/suspended), joinedAt
Relationships:
  → organizations (many:1)
  → profiles (many:1)
```

**`org_candidate_invites`** (Bring-your-own-candidate intake):

```
Primary Key: id (UUID)
Fields: orgId, inviteeEmail, inviteeEmailNormalized, tokenHash, status (pending/claimed/proof_submitted/revoked/expired), expiresAt, invitedBy, claimedByProfileId, claimedAt, proofSnippetId, proofShareToken, proofSubmittedAt, revokedAt
Constraints: one active invite per (orgId, inviteeEmailNormalized) for pending/claimed states
Relationships:
  → organizations (many:1)
  → profiles (many:1, invitedBy)
  → profiles (many:1, claimedByProfileId)
Security: tokenHash-only storage for invite links (raw tokens are never persisted)
```

#### Proof & Verification

**Canonical proof-first model**

**`proof_artifacts`** (Atomic evidence units):

```
Primary Key: id (UUID)
Fields: ownerType, ownerId, subjectType, subjectId, artifactKind, lifecycleState, title, description, sourceUrl, storagePath, issuedAt, expiresAt, visibility, revealGate, metadata, provenance pointers
Purpose: One atomic piece of evidence such as a file, link, image, credential, reference, or assessment
```

**`proof_packs`** (Canonical reviewable work units):

```
Primary Key: id (UUID)
Fields: ownerType, ownerId, packKind, title, summary, visibility, revealGate, shareTokenHash, shareExpiresAt, createdBy, metadata, lifecycle timestamps, export flags
Purpose: The canonical proof object tying together brief, contribution, outputs, artifacts, outcomes, trust state, privacy, and portability
```

**`proof_pack_items`** (Artifact membership inside a pack):

```
Primary Key: id (UUID)
Fields: packId, artifactId, position, includedFields
Purpose: Ordered inclusion of one or more artifacts inside a Proof Pack
```

**`verification_records`** (Canonical trust judgments):

```
Primary Key: id (UUID)
Fields: ownerType, ownerId, subjectType, subjectId, proofArtifactId, verificationSlot, verificationKind, status, verifierClass, integrityStatus, disputeState, verifiedAt, expiresAt, lastRefreshedAt, metadata
Purpose: Verification, contradiction, downgrade, dispute, and expiry judgments over a subject and its linked proof context
```

**`submissions`** (Contextual proof delivery):

```
Primary Key: id (UUID)
Fields: submissionKind, status, ownerType, ownerId, assignmentId, proofPackId, requestContextType, requestContextId, matchId, introId, submittedAt, reviewedAt, withdrawnAt, supersededAt, metadata
Purpose: Delivery of a Proof Pack into assignment, invite, match, intro, verification, or manual review contexts
```

**Subject records linked to packs**

**`impact_stories`**:

```
Primary Key: id (UUID)
Fields: userId, title, orgDescription, problem, solution, outcome, impact, duration, role, skills[], verified, visibility
Role in model: A subject that can be supported by one or more Proof Packs
```

**`experiences`**:

```
Primary Key: id (UUID)
Fields: userId, title, orgName, orgDescription, duration, keyLearnings, skillsGained[], verified, visibility
Role in model: A subject that can be referenced by a Proof Pack
```

**`education`**:

```
Primary Key: id (UUID)
Fields: userId, institution, degree, fieldOfStudy, startDate, endDate, description, skillsGained[], projectsCompleted[], verified, visibility
Role in model: A subject that can be referenced by a Proof Pack
```

**`volunteering`**:

```
Primary Key: id (UUID)
Fields: userId, orgName, role, cause, description, impact, duration, skillsGained[], personalConnection, verified, visibility
Role in model: A subject that can be referenced by a Proof Pack
```

**Canonical Proof Pack rules**:

- Proof Pack is the canonical storage and product-logic object for portfolio, matching, org review, exports, and BYOC proof-card flows.
- Every Proof Pack has exactly one primary linked subject in MVP: role, assignment, capability, or domain.
- Artifacts are atomic evidence units and may appear in multiple packs when the context differs.
- Verification and freshness are judgments over a pack or its linked artifacts, not loose counts of uploaded evidence.

#### Skills & Capabilities

**`skills`** (Structured skill records):

```
Primary Key: id (UUID)
Unique: (profileId, skillId)
Fields: profileId, skillId (taxonomy code), level (0-5), monthsExperience
Constraints: level CHECK (level >= 0 AND level <= 5), monthsExperience >= 0
```

**`capabilities`** (Skill wrappers with privacy):

```
Primary Key: id (UUID)
Fields: profileId, skillRecordId, privacyLevel (only_me/team/organization/public), verificationStatus, verificationSource, summary, highlights[], metadata, evidenceCount, lastValidatedAt
Tier: Tier 3 (user-controlled)
```

**Capability evidence model**:

- Capabilities are supported canonically by linked Proof Packs and their child proof artifacts.
- `evidenceCount` is a compatibility summary derived from linked proof context, not the primary evidence storage model.
- Legacy evidence-style rows may remain for compatibility, but new product logic should reason over `proof_packs`, `proof_artifacts`, `verification_records`, and `submissions`.

**`skill_endorsements`** (Peer validation):

```
Primary Key: id (UUID)
Fields: capabilityId, endorserProfileId, ownerProfileId, message, status (pending/accepted/declined/revoked), visibility, respondedAt
```

**`growth_plans`** (Development goals):

```
Primary Key: id (UUID)
Fields: profileId, capabilityId, title, goal, targetLevel, targetDate, status (planned/in_progress/blocked/completed/archived), milestones, supportNeeds
```

**Expertise Atlas Taxonomy** (See detailed specification in Section 2.1.5 below)

#### 2.1.5 Expertise Atlas Taxonomy (Detailed Specification)

**Purpose**: Standardized, hierarchical skill classification enabling precise matching, skill discovery, and career development. Based on ESCO/O\*NET occupational frameworks and OECD transferable skills taxonomy.

**Overall Structure**:

- **L1 Domains**: 6 fixed meta-domains (Universal, Functional, Tools, Languages, Methods, Domain)
- **L2 Categories**: 177 curated categories across all domains
- **L3 Subcategories**: 1,424 specific subcategories
- **L4 Granular Skills**: 19,936 curated skills (production-ready dataset)

**Total Taxonomy Size**: 6 + 177 + 1,424 + 19,936 = **21,543 taxonomy entries**

---

**`skills_categories` (L1 Domains - 6 fixed)**:

```sql
CREATE TABLE skills_categories (
    cat_id INTEGER PRIMARY KEY CHECK (cat_id BETWEEN 1 AND 6),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL,
    description_i18n JSONB,
    icon TEXT,
    display_order INTEGER NOT NULL,
    version INTEGER DEFAULT 1
);
```

**L1 Domain Definitions**:

1. **U - Universal Capabilities** (2,688 L4 skills)
   - Transferable cognitive, interpersonal, and personal effectiveness skills
   - Examples: Communication, Leadership, Critical Thinking, Time Management
   - Color: #3B82F6 (Blue)
   - L2 Categories: 24 (U-COMM, U-COLL, U-LEAD, U-COACH, etc.)

2. **F - Functional Competencies** (5,040 L4 skills)
   - Professional and specialized functional capabilities
   - Examples: Software Engineering, Data Science, Marketing, Finance, Operations
   - Color: #10B981 (Green)
   - L2 Categories: 45 (F-OPS, F-IT, F-DATA, F-SALES, F-HR, etc.)

3. **T - Tools & Technologies** (3,920 L4 skills)
   - Specific tools, platforms, frameworks, and technologies
   - Examples: PostgreSQL, React, AWS, Figma, Docker, Kubernetes
   - Color: #8B5CF6 (Purple)
   - L2 Categories: 35 (T-OFFICE, T-COLLAB, T-CLOUD, T-DATA, T-DESIGN, etc.)

4. **L - Languages & Culture** (1,568 L4 skills)
   - Natural languages and cultural competencies
   - Examples: English (C1), Spanish (B2), Cross-cultural Communication
   - Color: #F59E0B (Orange)
   - L2 Categories: 13 (L-LANG, L-SIGN, L-INT, L-L10N, L-REGION, etc.)

5. **M - Methods & Practices** (3,248 L4 skills)
   - Methodologies, frameworks, and best practices
   - Examples: Scrum, Lean, Six Sigma, Design Thinking, Agile
   - Color: #EF4444 (Red)
   - L2 Categories: 29 (M-PMBOK, M-AGILE, M-LEAN, M-UX, M-DEVOPS, etc.)

6. **D - Domain Knowledge** (3,472 L4 skills)
   - Industry and domain-specific expertise
   - Examples: Healthcare, Finance, Education, Climate, Energy Systems
   - Color: #EC4899 (Pink)
   - L2 Categories: 31 (D-MATH, D-CS, D-HEALTH, D-FIN, D-ENERGY, etc.)

---

**`skills_subcategories` (L2 Categories - 177 total)**:

```sql
CREATE TABLE skills_subcategories (
    cat_id INTEGER NOT NULL REFERENCES skills_categories(cat_id),
    subcat_id INTEGER NOT NULL CHECK (subcat_id > 0),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL,
    description_i18n JSONB,
    display_order INTEGER NOT NULL,
    version INTEGER DEFAULT 1,
    PRIMARY KEY (cat_id, subcat_id)
);
```

**Example L2 Categories**:

- `U-COMM` - Communication (Verbal, Written, Visual, Collaboration)
- `U-LEAD` - Leadership & People Enablement
- `F-IT` - Software Engineering
- `F-DATA` - Data Engineering & Analytics
- `T-CLOUD` - Cloud Platforms (AWS, Azure, GCP)
- `T-DESIGN` - Design & Prototyping Tools
- `L-LANG` - Natural Languages
- `M-AGILE` - Agile Frameworks
- `D-HEALTH` - Medical & Health Sciences

---

**`skills_l3` (L3 Subcategories - 1,424 total)**:

```sql
CREATE TABLE skills_l3 (
    cat_id INTEGER NOT NULL,
    subcat_id INTEGER NOT NULL,
    l3_id INTEGER NOT NULL CHECK (l3_id > 0),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL,
    description_i18n JSONB,
    display_order INTEGER NOT NULL,
    version INTEGER DEFAULT 1,
    PRIMARY KEY (cat_id, subcat_id, l3_id),
    FOREIGN KEY (cat_id, subcat_id) REFERENCES skills_subcategories(cat_id, subcat_id)
);
```

**Example L3 Subcategories**:

- `U-COMM` → Verbal communication, Written communication, Active listening
- `F-IT` → System architecture, Testing, Code review, Performance optimization
- `T-CLOUD` → Compute & containers, Networking & identity, Cost controls
- `L-LANG` → Language families & branches, CEFR proficiency mapping
- `M-AGILE` → Scrum events & roles, Kanban flow & WIP, Estimation & planning

**Distribution by L3**:

- Each L2 has 3-15 L3 subcategories (average: 8 per L2)
- Total: 1,424 L3 subcategories across all domains
- Each L3 contains 5-50 L4 skills (average: 14 per L3)

---

**`skills_taxonomy` (L4 Granular Skills - 19,936 curated)**:

```sql
CREATE TABLE skills_taxonomy (
    code TEXT PRIMARY KEY,              -- Format: "01.03.01.142" (zero-padded L1.L2.L3.L4)
    cat_id INTEGER NOT NULL,
    subcat_id INTEGER NOT NULL,
    l3_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL CHECK (skill_id > 0),
    slug TEXT UNIQUE NOT NULL,
    name_i18n JSONB NOT NULL,          -- {"en": "PostgreSQL", "sv": "PostgreSQL"}
    aliases_i18n JSONB DEFAULT '[]',    -- {"en": ["Postgres", "PSQL"], "sv": [...]}
    description_i18n JSONB,
    tags TEXT[],                        -- ['database', 'sql', 'relational', 'postgres']
    embedding VECTOR(768),              -- Multilingual sentence embedding (OpenAI ada-002)
    status TEXT DEFAULT 'active',       -- 'active' | 'deprecated' | 'merged'
    alias_of TEXT REFERENCES skills_taxonomy(code),
    merged_into TEXT REFERENCES skills_taxonomy(code),
    version INTEGER DEFAULT 1,
    FOREIGN KEY (cat_id, subcat_id, l3_id) REFERENCES skills_l3(cat_id, subcat_id, l3_id)
);
```

**Skill Code Format**: `"01.03.01.142"` = `L1.L2.L3.L4` (zero-padded)

- Example: `"01.03.01.001"` = PostgreSQL
  - `01` = L1 (Technical/Tools domain)
  - `03` = L2 (Databases category)
  - `01` = L3 (Relational Databases subcategory)
  - `001` = L4 (PostgreSQL specific skill)

**Example L4 Skills by Domain**:

**Universal (U)**:

- "Verbal communication - Foundational"
- "Verbal communication - Advanced"
- "Public Speaking"
- "Active Listening for Teams"
- "Team Leadership - Strategic Planning"
- "Time Management with Pomodoro Technique"

**Functional (F)**:

- "Python Programming - Advanced"
- "React - Component Design"
- "PostgreSQL - Query Optimization"
- "Financial Modeling - DCF Analysis"
- "Marketing - SEO Strategy"

**Tools (T)**:

- "AWS Lambda - Setup & Configuration"
- "Docker - Container Orchestration"
- "Figma - Prototyping"
- "PostgreSQL - Performance Tuning"
- "Kubernetes - Production Deployment"

**Languages (L)**:

- "English - Business Communication (C1)"
- "Spanish - Technical Writing (B2)"
- "Mandarin Chinese - Conversational (A2)"
- "American Business Etiquette"

**Methods (M)**:

- "Scrum - Sprint Planning (Advanced)"
- "Design Thinking - Ideation Facilitation"
- "Six Sigma - DMAIC Lifecycle"
- "Agile - Retrospective Facilitation"

**Domain (D)**:

- "Healthcare - Clinical Trials Management"
- "Finance - Investment Banking Analysis"
- "Climate Science - GHG Accounting"
- "Machine Learning - Model Training"

**Skill Status Lifecycle**:

- `active` - Currently valid, searchable, matchable
- `deprecated` - Outdated, must have `alias_of` pointing to replacement
- `merged` - Combined into another skill, must have `merged_into` set

**Example Deprecation**:

```sql
-- AngularJS (v1) deprecated → Angular (v2+)
UPDATE skills_taxonomy
SET status = 'deprecated', alias_of = '01.02.03.045'
WHERE code = '01.02.03.012';
```

---

**`skill_adjacency` (Graph for "Near-Skill" Matching)**:

```sql
CREATE TABLE skill_adjacency (
    from_code TEXT NOT NULL REFERENCES skills_taxonomy(code),
    to_code TEXT NOT NULL REFERENCES skills_taxonomy(code),
    relation_type TEXT NOT NULL,        -- 'is_a' | 'related_to' | 'adjacent_to' | 'prerequisite_of'
    distance INTEGER CHECK (distance BETWEEN 1 AND 3),
    strength NUMERIC DEFAULT 1.0 CHECK (strength BETWEEN 0 AND 1),
    PRIMARY KEY (from_code, to_code),
    CHECK (from_code != to_code)
);
```

**Adjacency Distance Rules**:

- **Distance 1**: Same L3, different L4 (e.g., PostgreSQL ↔ MySQL)
- **Distance 2**: Same L2, different L3 (e.g., PostgreSQL ↔ MongoDB)
- **Distance 3**: Same L1, different L2 (e.g., PostgreSQL ↔ Redis)

**Adjacency Factor for Matching**: `exp(-λ × distance)` where λ = 0.7 (default)

- Distance 1: Factor = 0.50 (50% credit)
- Distance 2: Factor = 0.25 (25% credit)
- Distance 3: Factor = 0.12 (12% credit)

**Example Adjacencies**:

```sql
-- PostgreSQL ↔ MySQL (same L3: Relational Databases)
INSERT INTO skill_adjacency VALUES
('01.03.01.001', '01.03.01.002', 'related_to', 1, 0.85);

-- PostgreSQL → SQL Query Optimization (prerequisite)
INSERT INTO skill_adjacency VALUES
('01.03.01.001', '01.03.01.003', 'prerequisite_of', 1, 0.95);

-- PostgreSQL ↔ MongoDB (different L3: Relational vs NoSQL)
INSERT INTO skill_adjacency VALUES
('01.03.01.001', '01.03.02.001', 'adjacent_to', 2, 0.60);
```

---

**User Skill Attributes** (Extensions to `skills` table):

```sql
ALTER TABLE skills ADD COLUMN skill_code TEXT REFERENCES skills_taxonomy(code);
ALTER TABLE skills ADD COLUMN competency_label TEXT CHECK (competency_label IN ('C1', 'C2', 'C3', 'C4', 'C5'));
ALTER TABLE skills ADD COLUMN evidence_strength NUMERIC CHECK (evidence_strength BETWEEN 0 AND 1);
ALTER TABLE skills ADD COLUMN recency_multiplier NUMERIC CHECK (recency_multiplier BETWEEN 0 AND 1);
ALTER TABLE skills ADD COLUMN impact_score NUMERIC CHECK (impact_score BETWEEN 0 AND 1);
ALTER TABLE skills ADD COLUMN last_used_at TIMESTAMP;
```

**Competency Levels (C1-C5 Rubric)**:

- **C1 (Novice)**: Basic awareness, theoretical knowledge, can perform with guidance
- **C2 (Advanced Beginner)**: Limited experience, can perform routine tasks independently
- **C3 (Competent)**: Applied experience, can troubleshoot, handles non-routine situations
- **C4 (Proficient)**: Deep expertise, can mentor others, contributes to best practices
- **C5 (Expert)**: Recognized authority, innovates, defines industry standards

**Mapping**: `level` (0-5 integer) → `competency_label` (C1-C5 text)

- level 0 = NULL (awareness only)
- level 1 = C1 (Novice)
- level 2 = C2 (Advanced Beginner)
- level 3 = C3 (Competent)
- level 4 = C4 (Proficient)
- level 5 = C5 (Expert)

---

**Multilingual Support (i18n)**:

All taxonomy tables use JSONB fields for internationalization:

```json
{
  "name_i18n": {
    "en": "Communication",
    "sv": "Kommunikation",
    "es": "Comunicación",
    "de": "Kommunikation"
  },
  "description_i18n": {
    "en": "Verbal, written, and visual communication skills",
    "sv": "Muntliga, skriftliga och visuella kommunikationsfärdigheter"
  },
  "aliases_i18n": {
    "en": ["Comms", "Communication Skills"],
    "sv": ["Kommunikationsförmåga"]
  }
}
```

**Supported Languages** (MVP):

- English (en) - Primary
- Swedish (sv) - Deferred from launch runtime parity; keep message assets only until explicitly activated

**Post-MVP**:

- Spanish (es), German (de), French (fr), Portuguese (pt)
- RTL: Arabic (ar), Hebrew (he)
- CJK: Chinese (zh), Japanese (ja), Korean (ko)

---

**Semantic Search with Embeddings**:

**Vector Embeddings** (VECTOR(768) column):

- Model: OpenAI `text-embedding-ada-002` (768 dimensions)
- Purpose: Semantic skill matching ("React developer" matches "Frontend engineer")
- Index: IVFFlat with cosine similarity (pgvector extension)
- Cost: ~$0.10 per 1M tokens (one-time for 20k skills)

**Search Query Example**:

```sql
SELECT code, name_i18n->>'en' as name,
       1 - (embedding <=> query_embedding) AS similarity
FROM skills_taxonomy
WHERE 1 - (embedding <=> query_embedding) > 0.7
ORDER BY similarity DESC
LIMIT 10;
```

**Use Cases**:

- Fuzzy skill search ("javascrpt" → JavaScript)
- Semantic matching ("data scientist" → Python, Statistics, ML)
- Adjacent skill discovery (PostgreSQL → Database design, SQL)

---

**Taxonomy Versioning & Evolution**:

**Version Control**:

- `version` column tracks taxonomy schema changes
- Skills never deleted, only deprecated or merged
- Audit trail preserved for compliance

**Deprecation Workflow**:

1. Mark skill as `status = 'deprecated'`
2. Set `alias_of` to new/replacement skill
3. Update user skills to point to new skill (migration)
4. Keep deprecated skill in DB for historical reference

**Merge Workflow**:

1. Identify duplicate/similar skills
2. Mark duplicates as `status = 'merged'`
3. Set `merged_into` to canonical skill
4. Consolidate user skill records

**User-Created L4 Skills** (Future):

```sql
-- Users can create custom L4 skills
INSERT INTO skills_taxonomy (cat_id, subcat_id, l3_id, name_i18n, is_curated, created_by)
VALUES (1, 3, 1, '{"en": "PostgreSQL 17 Advanced Features"}', false, 'user_uuid');
```

**Curation Process**:

- Track `usage_count` for custom skills
- Promote popular skills (>50 users) to curated status
- Deduplicate and consolidate variants

---

**Data Files & Seeding**:

**Taxonomy Structure**:

- Definition: `/Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md` (1,632 lines)
- Contains: All 6 L1 domains, 177 L2 categories, 1,424 L3 subcategories

**L4 Skills Dataset**:

- File: `/data/expertise-atlas-20k-l4-final.json`
- Size: 19,936 L4 skills (JSON format)
- Generated: 2025-10-30 via `/scripts/generate-20k-from-existing-taxonomy.py`

**Database Migration**:

- File: `/src/db/migrations/20250130_add_skills_taxonomy.sql`
- Creates: skills_categories, skills_subcategories, skills_l3, skills_taxonomy, skill_adjacency
- Adds: Extensions to `skills` table (skill_code, competency_label, etc.)

**Seeding Process**:

1. Run migration to create tables
2. Import L1/L2/L3 from markdown structure
3. Import L4 from JSON dataset (19,936 skills)
4. Generate skill adjacency graph (Post-MVP)
5. Generate embeddings (Post-MVP, ~$2 cost)

---

**Performance & Indexing**:

**Indexes** (from migration):

```sql
-- Taxonomy hierarchy traversal
CREATE INDEX idx_skills_subcategories_cat ON skills_subcategories(cat_id);
CREATE INDEX idx_skills_l3_cat_subcat ON skills_l3(cat_id, subcat_id);
CREATE INDEX idx_skills_taxonomy_cat_subcat_l3 ON skills_taxonomy(cat_id, subcat_id, l3_id);

-- Search & filtering
CREATE INDEX idx_skills_taxonomy_slug ON skills_taxonomy(slug);
CREATE INDEX idx_skills_taxonomy_status ON skills_taxonomy(status);
CREATE INDEX idx_skills_taxonomy_tags ON skills_taxonomy USING GIN(tags);

-- Semantic search (Post-MVP)
CREATE INDEX idx_skills_taxonomy_embedding ON skills_taxonomy
  USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Adjacency graph
CREATE INDEX idx_skill_adjacency_from ON skill_adjacency(from_code);
CREATE INDEX idx_skill_adjacency_to ON skill_adjacency(to_code);
CREATE INDEX idx_skill_adjacency_distance ON skill_adjacency(distance);
```

**Query Performance Targets**:

- L1 domain list: <5ms
- L2 categories by L1: <10ms
- L3 subcategories by L2: <20ms
- L4 skills by L3: <50ms (with pagination)
- Fuzzy search (no embeddings): <200ms
- Semantic search (with embeddings): <500ms (Post-MVP)

---

**Storage Estimates**:

**Taxonomy Data**:

- L1 (6 records × 500 bytes): ~3KB
- L2 (177 records × 800 bytes): ~140KB
- L3 (1,424 records × 1KB): ~1.4MB
- L4 (19,936 records × 1.5KB): ~30MB
- Adjacency graph (est. 50K edges × 200 bytes): ~10MB (Post-MVP)
- **Taxonomy Total**: ~42MB

**User Skills** (per 1,000 users):

- Skills per user: ~20 average
- 20,000 skill records × 500 bytes = ~10MB
- **Per 1K users**: ~10MB
- **At 100K users**: ~1GB

**Embeddings** (Post-MVP):

- 19,936 skills × 768 floats × 4 bytes = ~61MB
- Plus metadata overhead: ~75MB total

---

**API Endpoints** (Taxonomy Access):

**Read-Only Endpoints** (Public):

- `GET /api/taxonomy/l1` - List all L1 domains
- `GET /api/taxonomy/l2?l1={code}` - L2 categories by domain
- `GET /api/taxonomy/l3?l2={code}` - L3 subcategories by category
- `GET /api/taxonomy/l4?l3={id}&limit=50` - L4 skills by subcategory (paginated)
- `GET /api/taxonomy/search?q={query}&limit=20` - Fuzzy skill search
- `GET /api/taxonomy/skill/{code}` - Get skill details by code

**Admin Endpoints** (Service Role):

- `POST /api/admin/taxonomy/deprecate` - Deprecate a skill
- `POST /api/admin/taxonomy/merge` - Merge duplicate skills
- `POST /api/admin/taxonomy/curate` - Promote user skill to curated

---

**References**:

- Taxonomy structure: `/Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md`
- L4 skills dataset: `/data/expertise-atlas-20k-l4-final.json`
- Generation script: `/scripts/generate-20k-from-existing-taxonomy.py`
- Database migration: `/src/db/migrations/20250130_add_skills_taxonomy.sql`
- User documentation: `/Expertise_Atlas_Product_Documentation_For_Individuals.md`
- Scientific basis: ESCO/O\*NET occupational frameworks, OECD transferable skills

#### Matching System

**`matching_profiles`** (Matching preferences):

```
Primary Key: profileId (UUID, FK → profiles.id)
Fields: valuesTags[], causeTags[], timezone, languages, verified{}, rightToWork, country, city, availabilityEarliest, availabilityLatest, workMode, radiusKm, hoursMin, hoursMax, compMin, compMax, currency, weights{}
Tier: Tier 2 (Sensitive - compensation masked in UI)
```

**`assignments`** (Job/project postings):

```
Primary Key: id (UUID)
Fields: orgId, role, description, status (draft/active/paused/closed), valuesRequired[], causeTags[], mustHaveSkills[], niceToHaveSkills[], minLanguage, locationMode, country, city, radiusKm, compMin, compMax, currency, hoursMin, hoursMax, startEarliest, startLatest, verificationGates[], weights{}
Tier: Tier 4 (Public when status='active')
```

**`matches`** (Cached scoring results):

```
Primary Key: id (UUID)
Unique: (assignmentId, profileId)
Fields: assignmentId, profileId, score, scoreTotal, scoreState, scoreVersion, modelVersion, explanationVersion, fairnessCheckVersion, fairnessStatus, inputsHash, reasonCodes[], staleReasonCodes[], generatedAt, staleAt, hiddenDueToPolicyAt, subscoresJson, scoreSnapshotJson, vector{}, weights{}, createdAt
Purpose: Pre-computed ranking decision plus audit-ready score trace for performance, explainability, and review governance
TTL: Refresh daily (employment) or weekly (volunteering)
```

**`match_reason_ledger`** (Canonical explanation source of truth):

```
Primary Key: id (UUID)
Fields: matchId, assignmentId, profileId, category, reasonCode, source (system/reviewer/policy), payloadJson, importance, createdBy, noteHash, createdAt
Purpose: Immutable internal reason-code ledger used to render user explanations, support audits, and preserve reviewer or policy annotations without mutating the original score artifact
```

**`fairness_notes`** (Release-level monitoring output):

```
Primary Key: id (UUID)
Fields: releaseVersion, generatedAt, cohortData, findings, recommendations, status (draft/published/archived), minSampleSize, hasSignificantGaps, pValue, createdBy, publishedAt
Purpose: Release-scoped fairness note with sample thresholds, observed gaps, limitations, and explicit insufficient-data handling
```

**`match_interest`** (User actions for mutual reveal):

```
Primary Key: id (UUID)
Unique: (actorProfileId, assignmentId, targetProfileId)
Fields: actorProfileId, assignmentId, targetProfileId, createdAt
Purpose: Track downstream interest and intro intent. It may support reveal requests, but it does not itself grant identity reveal.
```

**`match_review_states`** (Blind review source of truth):

```
Primary Key: matchId (UUID, FK → matches.id)
Fields: matchId, assignmentId, profileId, orgId, reviewStage, revealScope, shortlistedAt, shortlistedBy, decisionAt, decisionBy, fullIdentityUnlockedAt, fullIdentityUnlockedBy, fullIdentityUnlockTrigger, createdAt, updatedAt
Purpose: Persist blind review posture and reveal scope for each match
Canonical mapping:
  - reviewStage `blind_review` + revealScope `blind` cover product Stage 0 and Stage 1
  - revealScope `shortlist_identity` covers product Stage 2 contextual reveal
  - revealScope `full_identity` covers product Stage 3 intro-approved reveal and Stage 4 interview coordination reveal
```

**`reveal_events`** (Reveal audit contract):

```
Primary Key: id (UUID)
Fields: matchId, assignmentId, profileId, orgId, actorId, actorRole, actorType, triggerType, requestedScope, grantedScope, reasonCode, sourceSurface, contextJson, outcome, occurredAt
Purpose: Immutable audit trail for reveal_requested, reveal_granted, reveal_denied, and related override or policy actions
```

**Matching Algorithm** (Multi-factor):

```
Allowed score components:
- skills_fit
- proof_fit
- constraints_fit
- verification_fit
- purpose_fit

PAC treatment:
- PAC is a bounded, positive-only contribution inside purpose_fit
- PAC may improve ranking only when real values/causes overlap exists
- Missing PAC data is neutral
- PAC must never override failed hard constraints or required verification gates

Forbidden score components:
- protected or proxy demographic attributes
- Zen or wellbeing data
- names, photos, direct identity fields, school/employer prestige, social graph popularity, engagement metrics
- reviewer preference notes or manual overrides as score inputs

User-facing explanation model:
- reasonSummary: 1-3 plain-language bullets
- reasonSections: why this match / what may hold it back / what you can improve next / fairness or policy limits when relevant
- rankPresentation: band by default, exact only in tightly scoped org review when pool and fairness guardrails pass, hidden when policy suppression is active

Decision trace stored per ranking output:
- score_version
- model_version
- explanation_version
- fairness_check_version
- inputs_hash
- top-level component scores
- component applicability or missing-data status
- reason codes
- rank presentation mode
- fairness status
- generated timestamp
- gating outcomes and stale-policy state
- reviewer override linkage when present

Results: Top 5-10 matches per assignment
Explainability: user-facing detail is plain-language and non-numeric by default; exact scores remain internal
Cold-start: Editorial matches if <5 results
```

#### Verification System

**`verification_requests`** (Email workflow):

```
Primary Key: id (UUID)
Fields: claimType, claimId, profileId, verifierEmail, verifierName, verifierOrg, status (pending/accepted/declined/cannot_verify/expired/appealed), token (unique), sentAt, expiresAt (14 days), lastNudgedAt, respondedAt
Tier: Tier 1 (PII - verifier email protected)
SLA: Target 72h response, auto-nudge at 48h & 7d, expire at 14d
```

**`verification_responses`** (Referee response):

```
Primary Key: id (UUID)
Fields: requestId, responseType, reason, verifierSeniority (not visible), notes (private), ipAddress, userAgent, respondedAt
Privacy: Public status + role/org, private: emails, notes, IP
```

**`verification_appeals`** (Contest declined verification):

```
Primary Key: id (UUID)
Fields: requestId, profileId, context (≤500 words), status (pending/reviewing/approved/rejected), reviewerId, reviewNotes, reviewedAt
SLA: Human review ≤72 hours
```

**`org_verification`** (Organization entity checks):

```
Primary Key: id (UUID)
Fields: orgId, verificationType (domain_email/website/registry/manual), domain, registryNumber, status (pending/verified/failed/expired), verifiedBy, verifiedAt, expiresAt, metadata
Requirement: Organization must be verified before matching
```

#### Messaging System

**`conversations`** (Chat threads between matched users):

```
Primary Key: id (UUID)
Unique: matchId
Fields: matchId, assignmentId, participantOneId, participantTwoId, stage (1=masked, 2=revealed), status (active/archived/closed), lastMessageAt
Staged Reveal:
  - Conversation `stage=1` is the masked messaging state downstream of blind review and early reveal stages
  - Conversation `stage=2` is the identified messaging state entered only after the reveal policy grants identity-bearing access
  - Product reveal stages 0-4 are governed by `match_review_states` and `reveal_events`; conversation stage is not the source of truth for review permissions
```

**`messages`** (Individual messages):

```
Primary Key: id (UUID)
Fields: conversationId, senderId, content, attachments{type, url, name, size}[], isSystemMessage, readAt, flaggedForModeration, sentAt
Tier: Tier 2 (Private to conversation participants)
Attachments: Links + PDF ≤5MB only
```

**`blocked_users`** (Prevent unwanted communication):

```
Composite PK: (blockerId, blockedId)
Fields: blockerId, blockedId, reason, createdAt
```

#### Moderation & Safety

**`content_reports`** (User and AI-flagged content):

```
Primary Key: id (UUID)
Fields: reporterId, contentType, contentId, contentOwnerId, reason (≤50 words), category (spam/harassment/misinformation/inappropriate/political/other), status (pending/reviewing/actioned/dismissed), aiFlag, aiConfidence (0-1), reviewedBy, reviewedAt
Political Policy: Factual roles OK, advocacy/proselytizing disallowed
```

**`moderation_actions`** (Actions on reports):

```
Primary Key: id (UUID)
Fields: reportId, moderatorId, actionType (warning/content_removed/account_suspended/dismissed), reason, isAppealable, appealDeadline
```

**`user_violations`** (Violation history):

```
Primary Key: id (UUID)
Fields: userId, reportId, violationType, severity (low/medium/high/critical), actionTaken (warning/content_removed/timed_suspension/permanent_ban), suspensionExpiresAt, notes
Escalation: 1st = warning, 2nd critical = suspension, repeated = ban
```

#### Analytics & Supporting

**`analytics_events`** (User action tracking):

```
Primary Key: id (UUID)
Fields: eventType, userId, orgId, entityType, entityId, properties{}, sessionId, ipAddress (auto-delete 90d), userAgent, createdAt
Core Events: signed_up, profile_ready_for_match, match_accepted, verification_completed, etc.
Tier: Tier 1 (PII - anonymized for ML training)
```

**`editorial_matches`** (Curated matches for cold-start):

```
Primary Key: id (UUID)
Fields: assignmentId, profileId, curatorId (admin), reason, notes, priority, isActive
```

**`match_suggestions`** (Improvement tips):

```
Primary Key: id (UUID)
Fields: matchId, profileId, suggestionType, description, estimatedImpact (percentage points), actionUrl, isDismissed
Example: "Add proof X to increase score by ~8-12%"
```

**`active_ties`** (Cluster snapshot for algorithms):

```
Primary Key: id (UUID)
Fields: userId, tieType (match/verification/endorsement/conversation), relatedUserId, relatedOrgId, strength (0-1), lastInteractionAt, isLegacy (>60 days)
Visibility: Private only, algorithm use, no public UI in MVP
```

**`audit_logs`** (All significant actions):

```
Primary Key: id (bigserial)
Fields: actorId, orgId, action, targetType, targetId, meta{}, createdAt
Retention: 2 years for compliance
```

**`feature_flags`** (Gradual rollout):

```
Primary Key: key (text)
Fields: key, enabled, audience{userIds[], orgs[]}
```

**`rate_limits`** (Rate limiting per IP/route):

```
Primary Key: id (text, composite of IP + route)
Fields: id, attempts (bigserial), resetAt
Limits: 60 req/min per IP, 120 req/min per user token
```

### 2.2 Entity Relationships

```
profiles (1) ←→ (1) individual_profiles
profiles (1) ←→ (many) organization_members ←→ (many) organizations
profiles (1) ←→ (many) skills
profiles (1) ←→ (many) capabilities ←→ (many) proof_packs ←→ (many) proof_artifacts
profiles (1) ←→ (many) impact_stories, experiences, education, volunteering

organizations (1) ←→ (many) assignments
organizations (1) ←→ (many) projects
organizations (1) ←→ (many) org_candidate_invites
profiles (1) ←→ (many) org_candidate_invites (as inviter or claimant)
organizations (1) ←→ (many) proof_packs ←→ (many) proof_artifacts

profiles (1) ←→ (1) matching_profiles
assignments (1) ←→ (many) matches ←→ (1) profiles
matches (1) ←→ (1) conversations ←→ (many) messages

proof_packs (1) ←→ (many) proof_pack_items ←→ (1) proof_artifacts
proof_packs (1) ←→ (many) submissions
proof_artifacts (1) ←→ (many) verification_records
proof_packs (many) ←→ (many) public portfolio surfaces and org review contexts

profiles (1) ←→ (many) verification_requests ←→ (1) verification_responses
profiles (1) ←→ (many) content_reports ←→ (1) moderation_actions

assignments (1) ←→ (many) opportunities (applications)
opportunities (1) ←→ (many) applications
```

### 2.3 Data Storage Estimates

**MVP (5K users)**:

- Profiles: ~5K records × 2KB = 10MB
- Skills: ~50K records × 0.5KB = 25MB
- Assignments: ~500 records × 5KB = 2.5MB
- Matches: ~10K records × 1KB = 10MB
- Messages: ~5K records × 2KB = 10MB
- Analytics: ~100K events × 1KB = 100MB
- **Total**: ~200MB

**Scale (100K users)**:

- Profiles: 200MB
- Skills: 5GB
- Assignments: 500MB
- Matches: 2GB
- Messages: 2GB
- Analytics: 20GB
- **Total**: ~30GB

---

## 3. INTEGRATIONS

### 3.1 Current Integrations (MVP)

#### Supabase (Backend Platform)

**Services Used**:

- **PostgreSQL 15**: Primary database with 30+ tables
- **Auth**: Email/password + OAuth (Google, LinkedIn)
- **Storage**: File uploads for proofs, avatars, covers (buckets: `proofs`, `avatars`, `covers`, `logos`)
- **Realtime**: WebSocket subscriptions (future use for messaging)

**Configuration**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]
DATABASE_URL=postgresql://[connection_string]
```

**RLS Policies**: All 30+ tables have Row-Level Security enabled

**Connection**: Drizzle ORM via postgres.js client

---

#### Resend (Transactional Email)

**Email Templates** (React Email):

- Email verification (`VerifyEmail.tsx`, separate for Individual/Organization)
- Password reset (`ResetPassword.tsx`)
- Organization invitation (`OrgInvite.tsx`)
- Account deletion (scheduled, reminder, complete)

**Configuration**:

```env
RESEND_API_KEY=re_[api_key]
RESEND_FROM_EMAIL=noreply@proofound.io
```

**Email Flows**:

- Verification request → Referee
- Verification response → User
- Match notification → User
- Organization invite → Invitee
- Candidate invite (BYOC) → Candidate
- Deletion reminders → User (7 days, 1 day before)

**Pricing**: $20/month for 50K emails (MVP sufficient)

---

#### Vercel (Hosting + CI/CD)

**Services**:

- **Hosting**: Next.js 15 deployment
- **Edge Network**: Global CDN (automatic)
- **Analytics**: Web Vitals tracking
- **Preview Deploys**: Every GitHub PR
- **Cron Jobs**: 2 scheduled tasks (vercel.json)
  - Deletion reminders: Daily 01:00 UTC
  - Process deletions: Daily 02:00 UTC

**Configuration**:

- Auto-deploy on push to `main` branch
- Environment variables managed in Vercel dashboard
- Build command: `npm run build`
- Output directory: `.next`

---

#### Vercel Analytics (Web Vitals)

**Metrics Tracked**:

- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

**Integration**: `@vercel/analytics` package (already installed)

---

### 3.2 Planned Integrations (Post-MVP)

#### Authentication Providers

**OAuth Providers** (Phase 1):

- Apple Sign In
- GitHub OAuth
- Facebook Login

**Enterprise Auth** (Phase 2):

- SSO: SAML 2.0, OIDC (Auth0 or WorkOS)
- SCIM provisioning (user/group sync)
- JIT (Just-in-Time) provisioning

---

#### Communication Services

**SMS Notifications** (Phase 2):

- Twilio or Vonage
- Use cases: Verification codes, critical alerts
- Cost: ~$0.01-0.05 per SMS

**Video Calls** (Phase 3):

- Daily.co or Vonage Video API
- Use cases: Interviews, team meetings
- Integration: Embedded video rooms in conversations

**Voice Calls** (Phase 3):

- Twilio Voice
- Use cases: Phone interviews

---

#### Payment Processing

**Stripe Connect** (Phase 3):

- Organization payment accounts
- Milestone-based escrow
- Platform fees (5%)
- Payout handling
- Invoice generation

**Use Cases**:

- Assignment payments
- Verification credits
- Subscription billing (Development Hub, Zen Hub)

**Configuration**:

```env
STRIPE_SECRET_KEY=sk_[key]
STRIPE_PUBLISHABLE_KEY=pk_[key]
STRIPE_WEBHOOK_SECRET=whsec_[secret]
```

---

#### Search & Discovery

**Typesense** (Phase 1):

- Fast full-text search
- Typo tolerance
- Faceted search (skills, location, values)
- Use cases: Profile search, assignment search

**Elasticsearch** (Phase 3, 50K+ assignments):

- Advanced full-text search
- Aggregations for analytics
- Geo-spatial search
- Cost: ~$95/month (Elastic Cloud)

**pgvector** (Phase 1):

- Semantic search for mission/vision
- OpenAI embeddings (text-embedding-ada-002)
- ANN (Approximate Nearest Neighbor) index
- Cost: ~$5/month for embeddings

---

#### ML & AI Services

**OpenAI API** (Phase 2):

- Embeddings: text-embedding-ada-002 ($0.0001 per 1K tokens)
- GPT-4: Profile analysis, match explanations, AI Co-founder
- Use cases: Semantic matching, profile suggestions, career advice

**Custom ML Models** (Phase 3):

- Learning-to-Rank (LTR) for matching
- Fraud detection
- Content moderation
- Deployed via Supabase Edge Functions (Deno + TensorFlow.js)

---

#### Analytics & Monitoring

**Sentry** (Phase 1):

- Error tracking (frontend + backend)
- Performance monitoring
- Release tracking
- Cost: Free tier → $26/month (Team)

**Mixpanel or Amplitude** (Phase 2):

- Product analytics
- Funnel analysis
- Cohort analysis
- A/B testing
- Cost: ~$25-50/month

**Datadog** (Archived from launch scope; revisit only after MVP saturation):

- Infrastructure monitoring
- APM (Application Performance Monitoring)
- Log aggregation
- Custom dashboards
- Cost: ~$100-200/month

---

#### Infrastructure Services

**Redis** (Archived from launch scope):

- Not part of the canonical MVP launch stack
- Reconsider only if Postgres-backed queues and direct reads show measured bottlenecks
- Session storage remains Supabase-managed cookies at launch

**Kafka** (Phase 3, 100K+ users):

- Event streaming
- Analytics pipeline
- Webhook delivery
- Cost: Confluent Cloud $100/month or AWS MSK $150/month

**CDN** (Phase 2):

- Cloudflare (free or $20/month)
- Use cases: User-generated content, video streaming

---

### 3.3 API Integrations

#### Internal APIs (Current)

**Implemented API Routes**:

- `/api/assignments/[id]` - Assignment CRUD
- `/api/core/matching/profile` - Profile matching
- `/api/core/matching/assignment` - Assignment matching
- `/api/core/matching/near-matches` - Near-match suggestions for cold start
- `/api/core/matching/interest` - Express interest
- `/api/core/matching/matching-profile` - Matching profile CRUD
- `/api/expertise/profile` - Expertise profile
- `/api/organizations/[orgId]/candidate-invites` - Candidate invite list/create
- `/api/organizations/[orgId]/candidate-invites/[inviteId]` - Candidate invite resend/revoke
- `/api/candidate-invites/[token]` - Public candidate invite metadata
- `/api/candidate-invites/[token]/claim` - Candidate invite claim
- `/api/candidate-invites/[token]/proof-card` - Candidate proof card submission
- `/api/taxonomy/[kind]` - Skills taxonomy
- `/api/user/account` - User account management
- `/api/user/export` - GDPR data export
- `/api/user/audit-log` - User audit log
- `/api/user/consent` - Consent management

**Matching and Intro Trust Contract**:

- `POST /api/core/matching/profile` and `POST /api/core/matching/near-matches` return `200` for authenticated users even when the profile is not yet match-visible or intro-eligible.
- When trust requirements are unmet, payload includes:
  - `items` (may be empty)
  - `eligibility` (full criteria and legacy compatibility state)
  - `trustLevel`
  - `introEligibility` with `status`, `reasonCodes`, `missingRequirements`, `nextActions`, `profileEligible`, and `assignmentEligible`
  - `topActions` (next best actions)
  - `meta.softGated=true`
- `POST /api/core/matching/interest` returns `409 INTRO_QUALIFICATION_NOT_MET` when profile-level or assignment-level introduction gates are not satisfied, with blocked-state copy and remediation guidance while browse remains available.
- `GET /api/core/matching/matching-profile` auto-bootstraps a baseline profile row if one does not exist, so new users avoid null-profile dead ends.

**Cron Endpoints** (Vercel Cron):

- `/api/cron/send-deletion-reminders` - Daily 01:00 UTC
- `/api/cron/process-deletions` - Daily 02:00 UTC

---

#### External APIs (Planned)

**LinkedIn API** (Phase 2):

- Import work experience
- Verify employment
- OAuth already implemented

**GitHub API** (Phase 2):

- Import repositories as proofs
- Contribution graph
- OAuth integration

**Google Calendar API** (Phase 3):

- Meeting scheduling
- Availability sync

**Notion API** (Phase 3):

- Import artifacts as proofs

**Behance API** (Phase 3):

- Import portfolio projects

---

### 3.4 Webhooks

**Outbound Webhooks** (Phase 3):

- Organization events: New application, match accepted, message received
- User events: Profile verified, match suggested
- System events: Moderation action, verification completed

**Webhook Security**:

- HMAC signature verification
- Retry logic (3 attempts, exponential backoff)
- Delivery status tracking

---

## 4. DEPENDENCIES & CONSTRAINTS

### 4.1 Technology Dependencies

#### Core Stack

**Runtime & Framework**:

- Node.js: ≥18.x (LTS)
- Next.js: 15.5.4 (App Router)
- React: 19.x
- TypeScript: 5.x

**Backend**:

- Supabase: Latest (PostgreSQL 15, Auth, Storage)
- Drizzle ORM: 0.29.4+
- postgres.js: 3.4.3+

**UI & Styling**:

- Tailwind CSS: 3.4.1+
- Radix UI: Latest (accessible primitives)
- Framer Motion: 11.15.0+ (animations)
- next-themes: 0.2.1+ (dark mode)

**Validation & Forms**:

- Zod: 3.22.4+
- React Hook Form: 7.50.1+

**Email**:

- Resend: 3.2.0+
- React Email: 4.3.0+

**Infrastructure**:

- Vercel: Latest (hosting)
- GitHub Actions: CI/CD

---

### 4.2 External Service Dependencies

**Critical (MVP cannot function without)**:

- Supabase (database, auth, storage)
- Vercel (hosting)
- Resend (email delivery)

**Important (Reduced functionality)**:

- OAuth providers (Google, LinkedIn) - fallback to email/password

**Optional (Enhanced features)**:

- Vercel Analytics - fallback to basic logging
- Future services (Stripe, Redis, etc.) - graceful degradation

---

### 4.3 Technical Constraints

#### Browser Support

**Minimum Supported Versions**:

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari (iOS): 15+
- Chrome Mobile (Android): Last 2 versions

**Progressive Enhancement**:

- JavaScript required (React SPA)
- Cookies required (auth sessions)
- LocalStorage recommended (preferences)

---

#### Database Constraints

**Supabase Limits (Pro Tier)**:

- Database size: 8GB (MVP sufficient)
- Bandwidth: 250GB/month
- Storage: 100GB
- Edge Functions: 2M invocations/month

**PostgreSQL Constraints**:

- Max connections: 500 (PgBouncer pooling)
- Max query execution time: 60s (configurable)
- Statement timeout: 30s (API queries)
- Max row size: 1.6TB (theoretical, not practical)

**Schema Constraints**:

- Skills level: 0-5 (CHECK constraint)
- Persona: individual | org_member | unknown
- Organization role: owner | admin | member | viewer
- RLS: All tables must have policies (security requirement)

---

#### API Rate Limits

**Platform Limits**:

- General: 60 requests/min per IP
- Authenticated: 120 requests/min per user token
- Auth endpoints: 10 requests/min per IP (stricter)
- Burst: 2× limit for 10 seconds

**External Service Limits**:

- Resend: 100 emails/hour (free), 1000/hour (starter)
- OpenAI (future): 3500 requests/min (Tier 3)
- Stripe (future): 100 requests/sec

---

#### File Upload Constraints

**Supabase Storage**:

- Max file size: 5MB (PDFs for proofs)
- Max total storage (Pro): 100GB
- Allowed MIME types: PDF, JPEG, PNG, WebP
- Virus scanning: Not included (manual review for MVP)

**Image Optimization**:

- next/image automatic optimization
- Max dimensions: 3840×2160 (4K)
- Formats: JPEG, PNG, WebP, AVIF

---

### 4.4 Compliance Constraints

#### Data Residency

**MVP**: Single region (US-East or EU-West, Supabase default)

**Post-MVP**: Multi-region support

- EU users → EU database (GDPR requirement)
- US users → US database
- AP users → AP database

---

#### GDPR Requirements

**Must-Have (Legal Obligation)**:

- Data export within 30 days (we target <48h)
- Data deletion within 30 days (we do 30-day grace + hard delete)
- Consent management (version tracking)
- Data Processing Agreements with vendors
- Privacy policy (clear, accessible)
- Cookie consent (analytics opt-in)

**Penalties for Non-Compliance**:

- Up to €20M or 4% annual revenue (whichever is higher)
- Reputational damage

---

#### CCPA Requirements (California)

**Must-Have**:

- "Do Not Sell My Personal Information" link (footer)
- Data disclosure (what we collect, why, who we share with)
- Deletion request handling
- Non-discrimination (same service if user opts out)

**Penalties**:

- $2,500 per unintentional violation
- $7,500 per intentional violation

---

### 4.5 Performance Constraints

**MVP Targets** (must meet for public launch):

- LCP <2.5s (75th percentile)
- INP <200ms (75th percentile)
- CLS <0.1
- API P95 <1200ms (writes), <800ms (reads)
- Matching <5s (cold start)

**Infrastructure Limits** (Vercel Pro):

- Serverless function timeout: 60s (Edge: 30s)
- Serverless function memory: 3008MB
- Build time: 45 minutes
- Deployment limit: Unlimited (Pro)

---

### 4.6 Security Constraints

**Password Requirements**:

- Minimum 8 characters
- Must include: 1 uppercase, 1 lowercase, 1 number
- No common passwords (Supabase checks against list)
- Bcrypt hashing (cost factor: 10)

**Session Security**:

- Interactive sessions use Supabase-managed SSR cookies
- No app-issued access/refresh JWT contract is documented for launch
- Logout, password reset, and admin invalidation must revoke the active session server-side
- Cookie-auth mutating requests require CSRF validation

**RLS Enforcement**:

- Cannot be bypassed by client
- Service role only for admin operations (server-side)
- Policies tested before deployment

---

## 5. LAUNCH PLAN

### 5.1 Environments

**Development**:

- URL: `localhost:3000`
- Database: Supabase Dev project
- Purpose: Active feature development
- Access: Engineering team
- Data: Seed data only (not production)

**Staging**:

- URL: `staging.proofound.io` (Vercel preview)
- Database: Supabase Staging project (separate from prod)
- Purpose: QA, stakeholder review, pre-launch testing
- Access: Engineering, Product, selected testers
- Data: Production-like seed data, test accounts

**Production**:

- URL: `proofound.io` (+ `www.proofound.io`)
- Database: Supabase Production project
- Purpose: Live users
- Access: Public (gated by beta codes initially)
- Data: Real user data (GDPR/CCPA compliant)

---

### 5.2 Deployment Strategy

**MVP Launch (Private Beta)**:

- Deployment: Vercel (main branch → production)
- Database: Supabase Pro tier
- CDN: Vercel Edge Network (automatic)
- SSL: Automatic via Vercel (Let's Encrypt)

**Release Process**:

1. Feature development on branch
2. PR review + CI checks (lint, typecheck, build)
3. Merge to `main`
4. Vercel auto-deploys to production
5. Smoke tests (manual for MVP)
6. Monitor Sentry for errors

**Rollback**:

- Vercel instant rollback to previous deployment (1-click)
- Database migrations: Manual rollback SQL (version controlled)

---

### 5.3 Analytics & Tracking

#### Core Metrics (MVP)

**North Star Metric**:

- **Time-to-First-Accepted-Match** (median)
- Target: <24 hours

**North Star #2**:

- **% assignments with ≥3 qualified matches in 7 days**
- Target: ≥50%

**First 10 Minutes Activation Success (MVP)**:

- **Individual**: success requires both actions within 10 minutes after `individual_onboarding_completed`:
  - `portfolio_share_link_copied`
  - `portfolio_pdf_export_succeeded`
- **Company**: success requires `portfolio_share_link_copied` within 10 minutes after `organization_onboarding_completed`.
- **Boundary rule**: events at exactly 10:00 are included (`<= 10 minutes`).
- **Formulas**:
  - Individual activation rate (10m) = successful individuals in 10m / new individuals
  - Company activation rate (10m) = successful organization creators in 10m / new organization creators

**Public Portfolio Route Contracts (MVP)**:

- Public individual URL: `GET /portfolio/{handle}`
- Public organization URL: `GET /portfolio/org/{slug}`
- Authenticated convenience routes:
  - `GET /app/i/portfolio` -> redirect to `/portfolio/{handle}`
  - `GET /app/o/{slug}/portfolio` -> redirect to `/portfolio/org/{slug}`

**Day-1 Admin Dashboard**:

1. Time-to-first-match (median)
2. % profiles "Ready for Match" within 24h of signup
3. Organization verification completion rate
4. Match acceptance rate (+ decline reasons)
5. Safety: Report rate & resolution SLA
6. Individual first-10-minute activation rate
7. Company first-10-minute activation rate

---

#### Event Tracking

**Core Events** (instrumented via `analytics_events` table):

- `signed_up` - User completes registration
- `created_profile` - Profile created
- `profile_ready_for_match` - Profile meets matching criteria
- `org_verified` - Organization verification approved
- `individual_onboarding_completed` - Individual onboarding completed
- `organization_onboarding_completed` - Organization onboarding completed
- `portfolio_share_link_copied` - Portfolio share link copied
- `portfolio_pdf_export_succeeded` - Portfolio PDF export returns 200
- `assignment_template_applied` - Assignment template applied in builder
- `assignment_publish_succeeded` - Assignment publish route returns 200
- `assignment_published` - Assignment status → active
- `match_suggested` - Match computed and shown to user
- `match_viewed` - User views match details
- `match_accepted` - User expresses interest
- `match_declined` - User declines match (with reason)
- `message_sent` - Message sent in conversation
- `verification_requested` - User requests proof verification
- `verification_completed` - Verifier responds (with status)
- `content_reported` - User reports content
- `candidate_invite_sent` - Organization sends BYOC candidate invite
- `candidate_invite_opened` - Candidate opens invite link
- `candidate_invite_claimed` - Candidate claims invite with email match
- `candidate_proof_card_submitted` - Candidate submits proof card

**Event Schema**:

```json
{
  "eventType": "match_accepted",
  "userId": "uuid",
  "orgId": "uuid",
  "entityType": "match",
  "entityId": "uuid",
  "properties": {
    "score": 82.5,
    "actorType": "individual"
  },
  "sessionId": "session_uuid",
  "ipAddress": "xxx.xxx.xxx.xxx",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2025-10-30T12:00:00Z"
}
```

**Privacy**:

- IP addresses auto-deleted after 90 days
- Analytics events anonymized for ML training (hash userId)
- Users can opt-out (no tracking except critical security events)

---

#### Funnel Analysis (90-day targets)

**Acquisition Funnel**:

- Landing page view → Signup: ≥10%
- Signup → Profile created: ≥90%
- Profile created → Profile ready: ≥60% within 24h

**Matching Funnel**:

- Profile ready → First match shown: <24h
- Match shown → Match viewed: ≥40%
- Match viewed → Interest expressed: ≥20%

**Verification Funnel**:

- Verification requested → Response received: ≥60% within 72h
- Response received → Accepted: ≥70%
- Verified users by D+14: ≥30%

**Safety**:

- Content report rate: <1%
- Report resolution SLA: <24h

---

### 5.4 Monitoring & Alerting

**Uptime Monitoring**:

- Tool: UptimeRobot (free) or Pingdom ($15/month)
- Endpoints: `/`, `/api/health` (needs creation)
- Frequency: 5-minute checks
- Alerts: Email + SMS for downtime >5 minutes

**Error Tracking**:

- Tool: Sentry (needs setup)
- Coverage: Frontend + API routes
- Alert: Email for error rate >5% or new critical errors

**Performance Monitoring**:

- Tool: Vercel Analytics (built-in)
- Metrics: LCP, INP, CLS, TTFB
- Alert: Slack notification if P75 exceeds targets

**Database Monitoring**:

- Tool: Supabase Dashboard
- Metrics: CPU usage, connection count, query performance
- Alert: Email if CPU >80% for 10 minutes

---

### 5.5 Support & Operations

**Support Channels (MVP)**:

- Email: support@proofound.io
- In-app feedback form (future)
- Status page: status.proofound.io (future)

**Response SLAs**:

- Business hours (CET 09:00-17:00): <8 hours human response
- Off-hours: Next business day
- Critical issues (Sev-1): <1 hour (on-call)

**On-Call Rotation** (Post-MVP):

- PagerDuty integration
- 24/7 coverage for Sev-1 incidents
- Weekly rotation among engineering team

---

### 5.6 Beta Launch Criteria

**MVP Exit Criteria** (before opening to public):

- ✅ All critical flows working (auth, onboarding, profile, matching, messaging)
- ✅ RLS policies deployed and tested
- ✅ Email flows tested (verification, invites, password reset)
- ✅ Performance targets met (LCP <2.5s, API <1200ms)
- ✅ Security audit passed (RLS, OWASP Top 10)
- ✅ GDPR compliance features (export, delete, consent)
- ✅ Monitoring set up (Sentry, uptime checks)
- ✅ Privacy policy published
- ✅ Terms of service published

**Beta Waves**:

- **Wave 1**: 5 NGOs, 20 SMEs, 1,000 individuals (invite-only)
- **Wave 2**: +10 NGOs, +30 SMEs, +2,000 individuals (referral codes)

**Public Launch Criteria** (after beta):

- ≥50% assignments with ≥3 qualified matches in 7d
- Match acceptance rate ≥20%
- Report rate <1% with <24h resolution SLA
- All SLOs met for 30 consecutive days
- NPS (Net Promoter Score) ≥0

**Kill/Pivot Criteria**:

- Match acceptance <10% after 2 iterations
- Organization verification <30% after 2 outreach cycles
- NPS <0 for 2 consecutive cycles

---

## 6. DOCUMENT SUMMARY

### What This Document Contains

This PRD Technical Requirements document provides comprehensive specifications for Proofound's technical architecture, covering:

1. **Non-Functional Requirements** (Section 1)
   - Security architecture with 4-tier data classification
   - Privacy-by-design principles with GDPR/CCPA compliance
   - Performance targets across web vitals and API response times
   - Reliability SLAs and incident response procedures
   - Scalability architecture from 5K to 500K+ users
   - Accessibility standards (WCAG 2.1 AA)

2. **Data Model** (Section 2)
   - Complete schema documentation for 30+ database tables
   - Entity relationships and constraints
   - Data tier classifications for privacy compliance
   - Storage estimates for MVP through scale

3. **Integrations** (Section 3)
   - Current integrations: Supabase, Resend, Vercel
   - Planned integrations: Stripe, OpenAI, Elasticsearch
   - API architecture (13 endpoints currently implemented)
   - Webhook strategy for external integrations

4. **Dependencies & Constraints** (Section 4)
   - Technology stack dependencies (Node.js, Next.js, React, etc.)
   - Service dependencies and fallback strategies
   - Browser support matrix
   - Rate limits and file upload constraints
   - Compliance requirements (GDPR, CCPA)

5. **Launch Plan** (Section 5)
   - Environment strategy (dev, staging, production)
   - Deployment process via Vercel
   - Analytics tracking with 15 core events
   - Monitoring and alerting setup
   - Beta launch criteria and public launch thresholds

### Why Each Section Was Included

**Non-Functional Requirements (NFRs)**:

- **Source**: Extracted from `DATA_SECURITY_PRIVACY_ARCHITECTURE.md` (3,150 lines), `TECHNOLOGY_STACK_AUDIT.md` (885 lines), and `SYSTEM_ARCHITECTURE_COMPREHENSIVE.md` (2,560 lines)
- **Rationale**: NFRs are critical for production readiness and often overlooked in PRDs. Security and privacy are core platform values (stated in MVP PRD line 19), requiring detailed specifications
- **Verification**: All security measures cross-referenced with existing RLS policies in `src/db/schema.ts` and privacy documentation

**Data Model**:

- **Source**: Direct extraction from `src/db/schema.ts` (1,521 lines) with 30+ table definitions
- **Rationale**: Understanding data relationships is essential for feature development and third-party integrations. Provides engineering teams with clear entity structures
- **Verification**: All table definitions, foreign keys, and constraints verified in actual schema file. Data tier classifications match those defined in privacy architecture document

**Integrations**:

- **Source**: `package.json` dependencies (89 total packages), existing API routes in `src/app/api/`, and `FULL_PRODUCT_ARCHITECTURE_PLAN.md` (1,795 lines)
- **Rationale**: Clear integration roadmap prevents vendor lock-in and enables realistic effort estimation. Distinguishes MVP (critical) from future (nice-to-have) integrations
- **Verification**: All current integrations confirmed via `package.json` and implemented API routes. Planned integrations sourced from Full Product PRD

**Dependencies & Constraints**:

- **Source**: `TECHNOLOGY_STACK_AUDIT.md` (cost analysis, alternatives evaluation), Supabase documentation, Vercel limits
- **Rationale**: Constraints often become bottlenecks. Documenting them upfront enables proactive planning and prevents surprises during development
- **Verification**: All limits verified against official documentation (Supabase Pro tier specs, Vercel serverless limits, browser compatibility matrix)

**Launch Plan**:

- **Source**: `Proofound_PRD_MVP.md` (lines 186-192), `MVP_STATUS.md` (367 lines), `vercel.json` (cron jobs), analytics events from PRD
- **Rationale**: Operationalizes the product launch with concrete metrics, monitoring, and success criteria. Provides clear go/no-go decision framework
- **Verification**: All metrics match North Star definitions from MVP PRD (lines 142-145). Beta wave numbers confirmed from PRD line 52. Cron jobs verified in `vercel.json`

### Fact-Checking & Traceability

**All specifications traced to source documents**:

- Database tables: `src/db/schema.ts` (lines 1-1521)
- Security requirements: `DATA_SECURITY_PRIVACY_ARCHITECTURE.md` (lines 1-3150)
- Performance targets: `Proofound_PRD_MVP.md` (lines 162-168)
- Technology stack: `TECHNOLOGY_STACK_AUDIT.md` + `package.json`
- MVP scope: `Proofound_PRD_MVP.md` (lines 23-36)
- Analytics events: `Proofound_PRD_MVP.md` (lines 153-155)

**No timelines included per user request** - All implementation can be done faster with Cursor, so effort estimates omitted

**MVP vs Future clearly delineated** - MVP requirements marked with ✅, future enhancements clearly labeled "Post-MVP" throughout document

## 7. BLOCK 12: CANONICAL LAUNCH SECURITY, NFR HARDENING, AND SPEC RECONCILIATION APPENDIX

This appendix is the single implementation-ready launch contract. It turns prior aspirational language into enforceable MVP controls and archives older contradictory launch assumptions.

### A. Canonical launch architecture decision

**Canonical launch stack**

- Runtime and hosting: Next.js App Router on Vercel.
- Identity and data: Supabase Auth, Supabase Postgres, Supabase Storage.
- Database access: Drizzle ORM against Postgres with RLS plus server-side authorization checks.
- Email: Resend for transactional mail.
- Observability: Sentry for errors and release health, Vercel Analytics for web vitals, Supabase dashboard for database health.
- Scheduled work: Vercel Cron for daily or coarse schedules, `cron-job.org` for the approved minute-level worker trigger paths already wired in the repo.
- Async work: Postgres-backed queue tables and workers. No launch Redis, no external broker.
- Document intelligence: the existing internal Python CV and document-intelligence service only where already integrated behind internal routes and shared contracts.

**Reconciled launch decision**

- Canonical auth and session model is Supabase-managed SSR cookies. Launch does not document or require an app-managed access-token plus refresh-token contract.
- Canonical async architecture is Postgres-backed queues with retries and terminal-failure states. Redis session brokers, Redis Pub/Sub, and external queue brokers are non-canonical for launch.
- Canonical monitoring stack is Sentry, Vercel Analytics, Supabase dashboard, and one external uptime monitor. Datadog, LogDNA, and broader observability stacks are post-launch only.
- Canonical locale baseline is English only. Swedish assets may remain in source, but Swedish runtime parity is deferred and must not be represented as launch-ready.
- Canonical public-portfolio posture is privacy-first publication with explicit publish actions and non-indexed defaults until publication criteria are met.

**In scope for the canonical stack**

- Public marketing pages, public portfolio pages, proof-sharing pages, exports, uploads, auth, onboarding, matching, messaging, verification, organization workflows, cron jobs, and the wired Python extraction path.
- Server-side authorization checks, RLS, structured logging, backup checkpoints, restore drills, accessibility baseline, and rollout metrics.

**Explicitly archived or non-canonical**

- App-managed JWT access and refresh token lifecycle as the primary launch session model.
- Redis for session storage, queue brokering, or required cache infrastructure.
- GraphQL as a launch API surface.
- Datadog, LogDNA, or similar optional monitoring stacks as launch dependencies.
- Multi-locale launch commitments beyond English.
- Public-by-default storage or remote-fetch-on-render behavior for portfolio surfaces.

**Why this is the safest MVP choice**

- It matches the code that already exists, avoids adding new trust boundaries late in launch prep, and reduces operational surface area.
- It keeps the security model server-enforced and testable.
- It preserves proof-first and privacy-first product intent without forcing enterprise-grade infrastructure before the MVP proves load or workflow needs.

### B. Authentication, session, and cookie model

**Interactive sign-in methods**

- Launch web sign-in methods are email/password, Google OAuth, and LinkedIn OAuth.
- General interactive login by magic link is not a separate launch session model.
- Magic-link-style URLs are limited to scoped external actions such as email verification, password recovery, invite claim, proof response, and equivalent capability-token flows.

**Session model**

- Interactive web sessions are Supabase-managed SSR sessions carried in HttpOnly cookies.
- The server is the source of truth for session state. Client-side storage must not be treated as the authoritative session store.
- Authorization requires both authenticated identity and server-side resource checks. RLS is necessary but not sufficient on its own.

**Cookie and session security settings**

- Session cookies: `HttpOnly`, `Secure`, `Path=/`, and `SameSite=Lax` at minimum. `SameSite=Strict` may be used only if it does not break OAuth, recovery, or verification callback flows.
- Session cookies must not be readable by client JavaScript.
- Cookie lifetime is managed by Supabase session policy. Launch code must not mint parallel app session cookies for the same browser session.
- Logout must revoke the current server session and clear session cookies.
- Password reset and admin-initiated session invalidation must revoke all active sessions for the affected user.

**Email verification, invite, and attestation token behavior**

- All external-action tokens must be represented as capability tokens with:
  - Random high-entropy secret values.
  - Hash-at-rest storage. Only the hash and metadata are persisted.
  - Explicit scope metadata such as `email_verification`, `password_recovery`, `candidate_invite`, `proof_response`, or `public_snippet`.
  - Actor binding where applicable: user ID, email, organization ID, or target resource ID.
- Single-use is the default for invite claim, email verification, password recovery completion, and verifier response tokens.
- Multi-use tokens are allowed only for explicitly documented read-only public sharing scopes and must still have explicit expiry.
- Legacy plaintext token columns are transitional only. They must either be migrated to hashed capability-token storage before launch or be wrapped behind server logic that hashes, revokes, and enforces single-use semantics equivalent to capability tokens.

**TTL, revocation, replay protection, and actor binding**

- Default TTLs:
  - Email verification: 24 hours.
  - Password recovery initiation: 60 minutes to complete the reset.
  - Candidate invite claim: 7 days unless a shorter business rule is set.
  - Proof and verification response tokens: 7 days unless product rules require shorter windows.
  - Read-only public snippet tokens: 30 days maximum, renewable by issuing a new token.
- Replay protection:
  - Single-use tokens must be atomically redeemed once and thereafter fail closed.
  - Redemption must record `usedAt`, `usedBy`, and target binding metadata.
  - A redeemed, revoked, expired, or scope-mismatched token must return a generic invalid-or-expired response.
- Actor binding:
  - When a token is issued for a known email, user, or organization, redemption must verify the same actor context before completing the action.
  - Cross-account redemption is denied by default.

**CSRF protection strategy**

- All cookie-authenticated mutating HTTP requests must pass CSRF validation using the repo’s double-submit token pattern.
- Exemptions are limited to:
  - Cron routes authenticated with `CRON_SECRET`.
  - Verified inbound webhooks authenticated by provider signature or shared secret.
  - Bearer-token mobile or internal API routes that do not rely on browser cookies.
- `SameSite` cookies are defense-in-depth only and are not treated as the primary CSRF control.

### C. Input, rich-text, and rendering safety

**Sanitization rules**

- Plain text is the default for user-generated fields.
- Raw HTML is disallowed by default on both private and public surfaces.
- If rich text is needed, it must go through an approved allowlist sanitizer before storage and again before render if content may have been created under older rules.

**Allowed markup**

- Launch allowlist, if rich text is enabled for a field, is limited to structural and inline formatting tags such as `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `code`, and safe `a`.
- Disallowed content includes `script`, `style`, `iframe`, `object`, `embed`, `svg`, inline event handlers, `javascript:` URLs, `data:` URLs other than explicitly approved image transforms, and arbitrary class or style attributes.
- Links must be normalized to `https` or `mailto` only, with `rel="nofollow noopener noreferrer"` when rendered publicly.

**Escaping and rendering requirements**

- All user-generated strings rendered in React must rely on normal escaping. `dangerouslySetInnerHTML` is prohibited except inside approved sanitizer wrappers.
- Public portfolio pages, proof cards, verifier notes, and exports must use pre-sanitized or plain-text renderers only.
- Markdown, if introduced, must render through a restricted parser with HTML disabled by default.

**Stored-vs-render-time strategy**

- On ingest:
  - Validate schema and length.
  - Normalize whitespace and Unicode control characters.
  - Sanitize any rich-text field to the approved allowlist before persistence.
- On render:
  - Escape all plain text.
  - Re-sanitize or reject stored legacy HTML content until migration is complete.
- Launch does not permit trusting historical stored HTML without revalidation.

**XSS and injection protections**

- Reject inline scripts, event-handler attributes, SVG payloads, CSS expressions, and active content in user-provided markup.
- Do not interpolate user content into script blocks, JSON script tags, CSS, or metadata tags without escaping.
- Public pages must not hydrate remote third-party user content directly.

### D. Upload, storage, and remote-content security

**Upload quarantine and promotion**

- All browser uploads land in a quarantine bucket or quarantine prefix first.
- Presigned upload URLs may only write to quarantine storage, for one object key, with short expiry and size constraints.
- Quarantine objects are not user-visible until the server validates and promotes them.
- Promotion to a canonical bucket is server-side only after validation succeeds.

**Storage access control after presigned upload**

- Presigned upload does not grant presigned read.
- After upload, the server re-reads the object, verifies MIME and signature, records metadata, and decides the destination bucket and visibility.
- Canonical object paths must be server-generated and scoped by tenant or user ownership. Clients must not choose final public paths.

**Object visibility rules**

- Default visibility is private.
- Proof documents, resumes, attestation files, exported data packages, and temp extraction files remain private.
- Only explicitly approved safe image classes, currently avatar and cover images, may be promoted to the public asset bucket.
- Public bucket objects must not contain PDFs, HTML, SVG, archives, office docs, or other active or ambiguous content types.
- Private object reads require authenticated server-side authorization plus short-lived signed read URLs or server-streamed downloads.

**AV, MIME, and size limits**

- The server must validate:
  - Declared MIME type.
  - File signature or magic bytes.
  - Maximum size by upload class.
- Launch defaults:
  - Avatar and cover images: JPEG, PNG, WebP; maximum 10 MB.
  - Resume or proof documents: PDF only unless a route explicitly documents another type; maximum 25 MB.
  - Temporary CV extraction uploads: PDF only; maximum 25 MB.
- MIME mismatch, missing signature, encrypted archives, executable formats, macro-enabled office files, and unsupported containers fail closed.
- If antivirus scanning is not available at launch, the quarantine validator plus file-type restrictions are mandatory and public promotion remains limited to safe image formats only.

**Remote URL preview and import rules**

- Public portfolio rendering must never fetch arbitrary remote URLs during request handling.
- Remote preview or import is allowed only in backend jobs or backend endpoints built for that purpose.
- Remote fetches may retrieve only a safe metadata subset:
  - Normalized final URL.
  - HTTP status.
  - Page title.
  - Description.
  - Canonical URL.
  - Approved preview image URL if it independently passes the same URL safety policy.
- Fetched HTML, scripts, or embeds must not be rendered raw.

**SSRF protection and fetch boundaries**

- Allowed schemes: `https` only.
- Deny:
  - `http`.
  - Loopback, link-local, multicast, and RFC1918 private IP space.
  - Cloud metadata endpoints.
  - `.local` hostnames and raw IP literals unless explicitly allowlisted for internal service-to-service use.
- DNS resolution must be performed server-side and rechecked on each redirect.
- Redirect limit: 3 maximum.
- Timeouts:
  - Connect timeout: 2 seconds.
  - Total request timeout: 5 seconds.
- Response-size cap:
  - Metadata preview fetch: 2 MB maximum body read.
- The fetcher must use a dedicated outbound client with redirects, size, and timeout limits enforced in code rather than by convention.

### E. Privacy, PII isolation, and logging standards

**What data may appear in logs, analytics, traces, and alerts**

- Request ID, event name, route, status code, latency, coarse feature flag names, queue or job IDs, entity IDs, organization IDs, and stable internal user IDs.
- Aggregated counters and percentiles.
- Hashed or truncated network markers only where strictly required for abuse control or audit correlation.

**What must never appear**

- Raw email addresses, phone numbers, full names, verifier identities, freeform proof text, message bodies, portfolio draft content, password material, tokens, cookies, Authorization headers, refresh or session secrets, raw IP addresses, raw user-agent strings, or secret environment values.
- Full exported payloads, backup contents, or document text in observability sinks.

**Structured logging standard**

- All application logs must be structured events.
- Each log event must include a stable event name and timestamp.
- Request-scoped logs must include `requestId`.
- Authenticated request logs may include internal `userId` or `orgId`, but not human-readable identity fields.
- Freeform string interpolation that can accidentally embed PII is disallowed for application logging.

**PII redaction and masking**

- Redaction must happen before logs leave the application boundary.
- Any field that can contain user-entered text is deny-by-default for observability export.
- Network identifiers, if retained for abuse or audit purposes, must be stored as:
  - Salted hash for IP.
  - Parsed browser family or device family only, not raw user-agent.
- Retention for abuse-linked hashes should be limited and documented. Launch default: 30 days unless legal or incident handling requires less.

**Audit logging vs observability logging boundaries**

- Audit logs record security-relevant actions such as role change, invite issuance, verification decision, publication change, export generation, and destructive admin actions.
- Audit logs are product records, not troubleshooting logs.
- Audit logs may store actor ID, target ID, action, timestamp, result, and reason code. They must not store raw secret material or raw content payloads.
- Observability logs are for runtime health and debugging only and must remain PII-minimized.

**Specially protected data classes**

- Work email verification state, verifier relationships, demographic opt-ins, wellbeing and Zen data, exports, and uploaded proof artifacts are specially protected data classes.
- These classes must stay out of analytics payloads and out of general-purpose logs.
- Zen and wellbeing data must remain isolated from ranking, matching, and public rendering, and any audit trail for that data must use the same least-PII rules above.

### F. Reliability, queues, and operational hardening

**Minimum reliability expectations**

- Monthly availability target: 99.5% for launch-critical user-facing surfaces.
- Health endpoints and smoke tests must cover auth, profile reads, portfolio rendering, uploads, and core org workflows.
- Sentry alerting, uptime monitoring, and database health review are mandatory before launch sign-off.

**Idempotency and retry standards**

- Queue consumers and webhook-like handlers must be idempotent.
- State-changing background jobs must have:
  - Stable job identifier.
  - Attempt counter.
  - Lease or claim ownership.
  - Safe retry behavior for duplicate delivery.
- Backoff must be bounded and explicit. Launch default: exponential or stepped retry with maximum 3 attempts unless a queue documents a lower cap.
- User-triggered exports, invite sends, proof requests, and remote imports must reject duplicate submissions or coalesce them by idempotency key where practical.

**Timeout budgets, DLQ expectations, alert thresholds, and queue ownership rules**

- API route timeout budget must remain within Vercel plan limits and should target:
  - Read routes: complete within 10 seconds hard timeout.
  - Write routes: complete within 15 seconds hard timeout.
  - Remote preview or import endpoints: 5 seconds total outbound budget per remote request.
- Long-running work must move to queue-backed async processing.
- DLQ expectation for MVP:
  - A terminal-failed queue row with preserved error summary is the DLQ.
  - Terminal failures must be queryable, alertable, and replayable only by an authorized operator workflow.
- Alert thresholds:
  - Any launch-critical cron failing 2 consecutive runs must page the operator channel.
  - Any queue with more than 25 terminal failures in 15 minutes must alert.
  - Any error-rate alert breaching 5% for a critical route over 5 minutes must alert.
- Every queue must have a named owning module or team path and a documented replay method.

**Backup, restore, RTO, RPO, and reconciliation**

- Canonical launch durability target:
  - RPO: 24 hours.
  - RTO: 8 hours.
- Daily automated database backups are required.
- A checkpoint backup must be taken before risky production DDL or destructive data repair.
- Restore drill evidence is required before launch and then at least monthly for the MVP operating period.
- Restore verification must include:
  - Schema presence.
  - Critical row-count spot checks.
  - Auth or login smoke test.
  - Upload metadata integrity checks.
- If an incident requires partial restore or manual repair, a reconciliation pass must compare restored counts and key invariants before reopening writes.

**Safe deploy, rollback, and feature-flag usage expectations**

- Production deploys require passing lint, typecheck, docs freshness, and the repo’s launch gates.
- Risky launches must be wrapped in feature flags or config gates where feasible.
- Rollback must prefer:
  - Disabling the feature flag.
  - Reverting the Vercel deployment.
  - Restoring data only after impact assessment and checkpoint review.
- New launch-critical security controls must fail closed by default.

### G. Abuse prevention and rate limiting

**Rate-limit classes and abuse controls**

- Anonymous browser traffic: baseline per-IP or per-IP-hash limits.
- Authenticated user actions: per-user limits with optional secondary IP-based guard.
- Sensitive token redemption: per-token, per-email-hash, and per-IP-hash throttles.
- Public portfolio fetches: per-IP-hash and per-route scraping controls.
- Notification sends: per-actor, per-target, and daily cap.

**Launch abuse controls**

- Auth:
  - Login, signup, password reset start, and verification resend endpoints must be rate-limited.
  - Repeated failed auth attempts trigger temporary lockout or progressive backoff.
- Invite and token redemption:
  - Single-use token redemption must be throttled and logged.
  - Invalid-token bursts from the same source must trigger alerts or temporary blocks.
- Uploads:
  - Per-user daily upload count caps.
  - Per-file size caps by route.
  - Quarantine cleanup for abandoned uploads.
- Exports:
  - Per-user daily export caps and one active export job per scope unless explicitly overridden.
- Public page scraping:
  - Basic bot heuristics, IP-hash throttling, caching, and non-index-by-default posture for private or semi-private public pages.
- Notification abuse:
  - Proof request, invite send, and resend endpoints require cooldowns and daily caps.

**Bot and spam protections appropriate for MVP**

- Launch uses server-side rate limiting, CSRF, capability-token replay protection, and allowlist-based publication controls as the primary anti-abuse layers.
- CAPTCHA is optional for launch and should be enabled only on endpoints that show abuse pressure.
- Content moderation is heuristic and report-driven for MVP, not full ML moderation.

**Safest defaults where precision is not yet known**

- If exact traffic thresholds are not yet known, start conservative and tune upward with observed metrics.
- Sensitive flows fail closed with `429` or generic invalid responses rather than leaking whether an account, token, or invite exists.

### H. Accessibility, i18n, and timezone baseline

**Launch accessibility baseline**

- Launch-critical user flows must meet WCAG 2.1 AA:
  - Auth and recovery.
  - Onboarding.
  - Portfolio editing and publication.
  - Upload and export flows.
  - Organization posting, review, and invite flows.

**Required accessibility behaviors**

- Full keyboard navigation for interactive controls.
- Visible focus indicators with logical focus order.
- Form inputs with persistent labels, programmatic descriptions, and accessible error messages.
- Dialogs, menus, and drawers with focus trapping and ESC dismissal where appropriate.
- Screen-reader-accessible button names for icon-only controls.
- Color contrast at or above WCAG AA thresholds.
- `aria-live` or equivalent announcement for async success and error states where the UI would otherwise be silent.
- Upload progress, validation failure, and rate-limit errors must be perceivable without color alone.

**Basic i18n and timezone rules**

- Launch runtime locale is English only.
- The codebase may retain locale-ready abstractions and untranslated message assets, but no non-English locale is part of launch acceptance.
- Deferred locales must remain behind an explicit product decision and QA pass before activation.
- All server-side persistence uses UTC.
- User-facing times render in the viewer’s or account-selected timezone, with a clear timezone label where ambiguity matters.
- Audit logs, exports, and ops runbooks must preserve UTC timestamps.
- Relative time copy is optional. Exact timestamps must remain available for security, audit, and scheduling events.

**Deferred features**

- Full runtime Swedish parity.
- RTL support.
- Broad localization QA beyond English.

### I. Security / NFR acceptance criteria

Launch is not complete until the following checks pass:

**Session security**

- Interactive browser login uses Supabase SSR cookies and no parallel app-managed JWT refresh flow is required for web auth.
- Logout invalidates the current session and subsequent authenticated requests fail until re-authentication.
- Password reset invalidates prior sessions.

**CSRF**

- Every cookie-authenticated mutating route rejects requests missing a valid CSRF token.
- Allowed exemptions are documented and covered by bearer-secret or signature verification.

**XSS and rendering safety**

- User-entered HTML, script tags, event handlers, and `javascript:` URLs do not execute on public or private surfaces.
- Any field using rich text is sanitized to the approved allowlist before storage and before render for legacy content.
- `dangerouslySetInnerHTML` appears only in approved sanitizer wrappers.

**Upload quarantine and storage privacy**

- Uploads land in quarantine first.
- Unsupported MIME or signature mismatches are rejected and never promoted.
- Proof documents, resumes, and temp extraction files remain private after upload.
- Only approved safe image types can become public objects.

**Token hashing and replay protection**

- Capability tokens are stored hashed at rest.
- Single-use tokens cannot be redeemed twice.
- Expired, revoked, or actor-mismatched tokens fail closed.
- Transitional plaintext token paths are either removed or wrapped behind equivalent hash and single-use enforcement before launch.

**SSRF controls**

- Public page render paths do not perform arbitrary remote fetches.
- Remote preview or import endpoints reject `http`, private IP targets, loopback targets, metadata endpoints, and over-limit redirects or bodies.
- Timeout and response-size caps are enforced in code.

**Storage privacy**

- Direct object listing is unavailable to anonymous clients for private buckets.
- Post-presigned-upload promotion determines final visibility server-side.
- Public objects are limited to approved safe image classes only.

**PII-safe logging**

- Structured logs omit raw emails, names, tokens, raw IPs, raw user-agent strings, message bodies, and proof text.
- Audit records and observability logs remain distinct and least-PII.
- Zen and other specially protected datasets do not appear in analytics payloads or general logs.

**Rate limiting**

- Auth, invite, token redemption, uploads, exports, public portfolio fetches, and notification sends all have enforced rate limits.
- Repeated invalid-token or brute-force attempts produce throttling without account enumeration.

**Backup, restore, and operational readiness**

- Lint, typecheck, and docs freshness pass in CI and before launch sign-off.
- A documented restore drill has been executed successfully against a recent backup.
- Queue workers show bounded retries and terminal-failure visibility.
- Health checks and smoke tests cover launch-critical flows.

**Accessibility baseline**

- Keyboard-only traversal succeeds through auth, onboarding, portfolio publication, and upload flows.
- Screen-reader labels exist for all critical controls.
- Launch-critical forms expose accessible validation and error recovery.
- Contrast and focus indicators meet WCAG 2.1 AA.

### J. Spec reconciliation ledger

**Main contradictions from prior docs and canonical decisions**

- Session model:
  - Older text: app-managed JWT access and refresh tokens.
  - Canonical decision: Supabase-managed SSR cookies for interactive web auth.
  - Remove or archive: JWT refresh-token launch language from active docs.
- CSRF:
  - Older text: SameSite cookies as the primary CSRF control.
  - Canonical decision: double-submit CSRF token on all cookie-auth mutating routes, with narrow exemptions.
  - Remove or archive: SameSite-only CSRF language.
- Storage:
  - Older text: vague signed-URL or public-profile assumptions.
  - Canonical decision: quarantine first, private by default, public promotion only for approved safe image classes.
  - Remove or archive: ambiguous public-by-default storage wording.
- Remote content:
  - Older text: public portfolio and proof surfaces described without explicit remote-fetch constraints.
  - Canonical decision: no arbitrary remote fetch in public render paths. Backend-only preview or import with SSRF controls.
  - Remove or archive: any wording that implies arbitrary remote embeds or fetch-on-render.
- Logging:
  - Older text: observability docs allowed broader log aggregation patterns without firm privacy boundaries.
  - Canonical decision: structured logs only, deny-by-default for PII, hashed network identifiers only where required.
  - Remove or archive: raw-PII logging allowance and Datadog or LogDNA as launch dependencies.
- Monitoring:
  - Older text: broad optional monitoring stack.
  - Canonical decision: Sentry, Vercel Analytics, Supabase dashboard, one uptime checker.
  - Remove or archive: optional launch dependency language for larger monitoring platforms.
- Async architecture:
  - Older text: Redis session broker and Pub/Sub as near-term architecture.
  - Canonical decision: Postgres-backed queues and workers for MVP launch.
  - Remove or archive: Redis or session-broker launch assumptions.
- Locale baseline:
  - Older text: English and Swedish described as launch-ready.
  - Canonical decision: English-only launch runtime. Swedish deferred.
  - Remove or archive: bilingual launch claims.
- Recovery targets:
  - Older text: conflicting RTO targets of 2h, 4h, and 8h.
  - Canonical decision: RTO 8h, RPO 24h for launch.
  - Remove or archive: faster RTO claims unless supported by tested evidence.

**What should be removed or archived from the active spec**

- Launch references to JWT refresh-token architecture.
- SameSite-only CSRF claims.
- Redis as required launch infrastructure.
- GraphQL as a planned launch API surface.
- Datadog or LogDNA as part of launch readiness.
- Swedish runtime parity as a launch expectation.
- Any backup target stricter than the tested 8h RTO and 24h RPO launch contract.

### K. Risks / tradeoffs

**Biggest security, operability, and documentation risks**

- Transitional plaintext token paths are the most obvious gap between current repo reality and the desired launch-standard token model.
- Upload validation without a dedicated AV engine depends on strict file-type allowlists and public-promotion constraints.
- Logging policy can still drift if new code paths bypass structured log helpers or write raw audit context.
- Broader historical docs can reintroduce ambiguity if future changes update them without also updating this appendix.

**Where MVP simplification could weaken safety**

- Relying only on RLS without server-side resource checks would weaken privacy and org-boundary enforcement.
- Treating SameSite as sufficient CSRF protection would leave browser-cookie routes exposed.
- Allowing remote content fetches in public render paths would create SSRF and availability risks.

**Where too much hardening could slow launch unnecessarily**

- Introducing Redis, a new queue broker, or a parallel session platform would add operational risk without launch evidence that the current queue model is insufficient.
- Requiring a full enterprise observability stack before launch would slow delivery without materially improving early MVP safety if Sentry, structured logs, and uptime checks are already enforced.
- Full multilingual launch QA would expand scope without improving launch safety.

**Safest MVP recommendation where ambiguity exists**

- Prefer server-side enforcement, narrow allowlists, private-by-default storage, hashed tokens, structured logs, and tested restore drills.
- Add new infrastructure only after measured operational pain, not in anticipation of it.

---

**Document Status**: ✅ Complete  
**Sources**: 10 architecture documents, codebase analysis (30+ tables, 89 dependencies, 13 API routes)  
**Coverage**: MVP through 500K+ user scale  
**Compliance**: GDPR, CCPA, WCAG 2.1 AA, OWASP Top 10
