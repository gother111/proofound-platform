# Proofound — Comprehensive System Architecture

> Reference note: this file is reference or historical design material. It is not the canonical MVP launch contract.
> Current precedence: `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`, `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`, then fresh repo-grounded evidence. This document is reference context only.

**Document Version:** 1.0
**Last Updated:** 2025-10-29
**Status:** Complete MVP Schema + Partial Implementation

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [System Architecture & Tech Stack](#2-system-architecture--tech-stack)
3. [Database Schema Deep Dive](#3-database-schema-deep-dive)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [User Journeys & Core Flows](#5-user-journeys--core-flows)
6. [File Structure & Code Organization](#6-file-structure--code-organization)
7. [Feature Implementation Status Matrix](#7-feature-implementation-status-matrix)
8. [Integration Points & External Services](#8-integration-points--external-services)
9. [Key Process Documentation](#9-key-process-documentation)
10. [Development Guidelines](#10-development-guidelines)

---

## 1. Executive Overview

### 1.1 What is Proofound?

**Proofound** is a credibility engineering platform that connects individuals with meaningful opportunities based on verified proof, not vanity metrics. The platform facilitates impactful connections for work, business, and individual transformation by prioritizing evidence-backed credentials over traditional resume metrics.

### 1.2 Core Differentiators

- **Proof-Based Profiles**: Every claim requires up to 3 pieces of verification (referee, link/file, credential)
- **Staged Identity Reveal**: Messaging starts with masked basics, reveals full identity after mutual acceptance
- **Explainable Matching**: Multi-factor algorithm with transparent scoring breakdown
- **Verification Workflow**: Email-based referee verification with appeal process
- **Dual-Persona Architecture**: Separate experiences for individuals (`/app/i/*`) and organizations (`/app/o/[slug]/*`)
- **Zero Tolerance for Bias**: No race/gender/age/YOE filters; bias-safe early views

### 1.3 MVP Scope (Current Status)

**Live Features:**

- ✅ Authentication (Email/Password, Google, LinkedIn OAuth)
- ✅ Dual-persona routing (individual vs org_member)
- ✅ Profile system (individual profiles with proof structure)
- ✅ Organization management (create, invite, roles)
- ✅ Assignment creation (job/project postings)
- ✅ Advanced matching algorithm (multi-factor scoring)
- ✅ Expertise Atlas (skills + capabilities + evidence)

**Schema Complete, Implementation Pending:**

- 🟡 Verification workflow (tables exist, API/UI pending)
- 🟡 Post-match messaging (tables exist, API/UI pending)
- 🟡 Content moderation (tables exist, API/UI pending)
- 🟡 Analytics tracking (tables exist, events pending)

### 1.4 Tech Stack at a Glance

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.x
- **UI**: React 18.2, Tailwind CSS, Framer Motion
- **Database**: Supabase (PostgreSQL 15)
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth
- **Deployment**: Vercel
- **Email**: Resend

---

## 2. System Architecture & Tech Stack

### 2.1 Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (React)                    │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  Individual UI  │              │ Organization UI  │       │
│  │  /app/i/*       │              │ /app/o/[slug]/*  │       │
│  └─────────────────┘              └─────────────────┘       │
└──────────────────────┬────────────────────┬─────────────────┘
                       │                    │
┌──────────────────────┴────────────────────┴─────────────────┐
│                   Server Components & Actions                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Auth Actions   │  │ Matching Logic │  │ Verification   │ │
│  │ /actions/auth  │  │ /lib/matching  │  │ /lib/verify    │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────┬────────────────────┬─────────────────┘
                       │                    │
┌──────────────────────┴────────────────────┴─────────────────┐
│                      API Layer (Next.js)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Route Handlers: /app/api/*                            │ │
│  │  - /api/matching/suggest                               │ │
│  │  - /api/assignments/[id]/matches                       │ │
│  │  - /api/expertise/capabilities                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬────────────────────┬─────────────────┘
                       │                    │
┌──────────────────────┴────────────────────┴─────────────────┐
│                   Data Access Layer (Drizzle ORM)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Schema: /src/db/schema.ts (30+ tables)                │ │
│  │  Queries: Type-safe SQL via Drizzle                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬────────────────────┬─────────────────┘
                       │                    │
┌──────────────────────┴────────────────────┴─────────────────┐
│              Database Layer (Supabase/PostgreSQL)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - Row-Level Security (RLS) policies                   │ │
│  │  - Triggers & Functions                                │ │
│  │  - Indexes for performance                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Dual-Persona Routing Architecture

The platform separates individuals and organizations at the routing level:

**Individual Routes** (`/app/i/*`):

- `/app/i/home` - Individual dashboard
- `/app/i/profile` - Profile management
- `/app/i/matches` - Match suggestions
- `/app/i/expertise` - Expertise Atlas management

**Organization Routes** (`/app/o/[slug]/*`):

- `/app/o/[slug]/home` - Organization dashboard
- `/app/o/[slug]/assignments` - Job/project postings
- `/app/o/[slug]/matches` - Candidate matches
- `/app/o/[slug]/settings` - Org settings & team management

**Shared Routes**:

- `/onboarding` - Initial account setup & persona selection
- `/settings` - Global user settings (persona toggle)

### 2.3 Technology Stack Details

#### Frontend Stack

```json
{
  "framework": "Next.js 15.5.4",
  "react": "18.2.0",
  "typescript": "5.x",
  "styling": "Tailwind CSS 3.4.1",
  "animations": "Framer Motion 11.15.0",
  "ui_components": "shadcn/ui + Radix UI",
  "icons": "Lucide React",
  "forms": "React Hook Form + Zod validation"
}
```

#### Backend Stack

```json
{
  "database": "Supabase (PostgreSQL 15)",
  "orm": "Drizzle ORM",
  "auth": "Supabase Auth (JWT)",
  "api": "Next.js App Router (Route Handlers + Server Actions)",
  "file_storage": "Signed URLs + CDN",
  "email": "Resend"
}
```

#### Infrastructure

```json
{
  "hosting": "Vercel",
  "database_hosting": "Supabase Cloud",
  "cdn": "Vercel Edge Network",
  "monitoring": "Vercel Analytics",
  "ci_cd": "GitHub Actions + Vercel"
}
```

### 2.4 Security Architecture

**Authentication**: Supabase Auth with JWT sessions

- Email/password with bcrypt hashing
- OAuth (Google, LinkedIn)
- Session cookies with HttpOnly, Secure flags

**Authorization**: Row-Level Security (RLS)

- Every table has RLS policies
- Policies check `auth.uid()` against ownership/membership
- Service role bypasses RLS for admin operations

**Data Protection**:

- Encrypted at rest (PostgreSQL)
- TLS 1.3 in transit
- Rate limiting (60 req/min IP, 120 req/min user)
- OWASP Top-10 compliance

**Privacy by Design**:

- Masked data in Stage 1 messaging
- Granular visibility controls (public/network/private)
- GDPR-aligned data retention (180d logs, 2y audit logs)
- Soft-delete with 30d purge

---

## 3. Database Schema Deep Dive

### 3.1 Schema Overview

The database consists of **30+ tables** organized into 8 functional domains:

| Domain                  | Tables    | Purpose                                          |
| ----------------------- | --------- | ------------------------------------------------ |
| **Core Profiles**       | 10 tables | User profiles, organizations, members            |
| **Matching System**     | 5 tables  | Match preferences, assignments, results          |
| **Expertise System**    | 5 tables  | Skills, capabilities, evidence, endorsements     |
| **Verification System** | 4 tables  | Verification workflow, appeals, org verification |
| **Messaging System**    | 3 tables  | Conversations, messages, blocks                  |
| **Moderation System**   | 3 tables  | Reports, actions, violations                     |
| **Analytics**           | 4 tables  | Events, editorial matches, suggestions, ties     |
| **Platform**            | 3 tables  | Audit logs, feature flags, rate limits           |

### 3.2 Core Profile Tables

#### `profiles` (Base Table)

Extends Supabase `auth.users` with platform-specific fields.

```typescript
{
  id: uuid (PK, references auth.users)
  handle: text (unique)
  displayName: text
  avatarUrl: text
  locale: text (default: 'en')
  persona: 'individual' | 'org_member' | 'unknown' (default: 'unknown')
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Key Relationships**:

- One-to-one with `individual_profiles`
- One-to-many with `organization_members`
- One-to-many with `skills`, `capabilities`, `matches`

#### `individual_profiles`

Extended profile data for individuals.

```typescript
{
  userId: uuid (PK, FK -> profiles.id)
  headline: text
  bio: text
  skills: text[]
  location: text
  visibility: 'public' | 'network' | 'private'
  tagline: text
  mission: text
  coverImageUrl: text
  verified: boolean
  joinedDate: timestamp
  values: jsonb // [{icon: string, label: string, verified: boolean}]
  causes: text[]
}
```

#### `organizations`

Organization entities (companies, NGOs, networks, and other lean organizations).

```typescript
{
  id: uuid (PK)
  slug: text (unique, for routing)
  legalName: text
  displayName: text
  type: 'company' | 'ngo' | 'network' | 'other'
  logoUrl: text
  mission: text
  website: text
  createdBy: uuid (FK -> profiles.id)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `organization_members` (Join Table)

Links users to organizations with roles.

```typescript
{
  orgId: uuid (PK, FK -> organizations.id)
  userId: uuid (PK, FK -> profiles.id)
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'invited' | 'suspended'
  joinedAt: timestamp
}
```

#### Proof Tables (4 tables)

All proof tables follow similar structure:

**`impact_stories`**: Verified projects with real outcomes
**`experiences`**: Work experience focused on growth/learning
**`education`**: Academic credentials with skills/projects
**`volunteering`**: Service work with personal connection

Common fields across all proof tables:

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> profiles.id)
  title: text
  orgDescription: text
  duration: text
  verified: boolean (default: false)
  createdAt: timestamp
  updatedAt: timestamp
  // + type-specific fields
}
```

### 3.3 Matching System Tables

#### `matching_profiles`

One-to-one with profiles; stores matching preferences.

```typescript
{
  profileId: uuid (PK, FK -> profiles.id)
  valuesTags: text[] // Values alignment
  causeTags: text[] // Cause alignment
  timezone: text
  languages: jsonb // [{code: 'en', level: 'C1'}]
  verified: jsonb // {id: true, education: false}
  rightToWork: 'yes' | 'no' | 'conditional'
  country: text
  city: text
  availabilityEarliest: date
  availabilityLatest: date
  workMode: 'remote' | 'onsite' | 'hybrid'
  radiusKm: integer
  hoursMin: integer
  hoursMax: integer
  compMin: integer // Masked in UI
  compMax: integer // Masked in UI
  currency: text
  weights: jsonb // User's preferred matching weights
}
```

#### `skills`

Many-to-one with profiles; structured skill records.

```typescript
{
  id: uuid (PK)
  profileId: uuid (FK -> profiles.id)
  skillId: text // Key from taxonomy (e.g., 'typescript')
  level: integer // 0-5 (checked constraint)
  monthsExperience: integer // Must be >= 0
  createdAt: timestamp
  updatedAt: timestamp

  // Unique constraint: (profileId, skillId)
}
```

#### `assignments`

Job/project postings from organizations.

```typescript
{
  id: uuid (PK)
  orgId: uuid (FK -> organizations.id)
  role: text
  description: text
  status: 'draft' | 'active' | 'paused' | 'closed'
  valuesRequired: text[]
  causeTags: text[]
  mustHaveSkills: jsonb // [{id: 'typescript', level: 4}]
  niceToHaveSkills: jsonb
  minLanguage: jsonb // {code: 'en', level: 'B2'}
  locationMode: 'remote' | 'onsite' | 'hybrid'
  radiusKm: integer
  country: text
  city: text
  compMin: integer // Masked
  compMax: integer // Masked
  currency: text
  hoursMin: integer
  hoursMax: integer
  startEarliest: date
  startLatest: date
  verificationGates: text[] // Required verifications
  weights: jsonb // Assignment-specific weights
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `matches` (Cached Results)

Stores computed match scores.

```typescript
{
  id: uuid (PK)
  assignmentId: uuid (FK -> assignments.id)
  profileId: uuid (FK -> profiles.id)
  score: numeric // 0-100
  vector: jsonb // {values: 28, skills: 35, location: 10, ...}
  weights: jsonb // Weights used for this match
  createdAt: timestamp

  // Unique constraint: (assignmentId, profileId)
}
```

#### `match_interest`

Tracks "Interested" actions for mutual reveal.

```typescript
{
  id: uuid (PK)
  actorProfileId: uuid (FK -> profiles.id)
  assignmentId: uuid (FK -> assignments.id)
  targetProfileId: uuid (FK -> profiles.id, nullable)
  createdAt: timestamp

  // Unique constraint: (actorProfileId, assignmentId, targetProfileId)
}
```

### 3.4 Expertise System Tables

#### `capabilities`

Skill wrappers with privacy and verification.

```typescript
{
  id: uuid (PK)
  profileId: uuid (FK -> profiles.id)
  skillRecordId: uuid (FK -> skills.id, nullable)
  privacyLevel: 'only_me' | 'team' | 'organization' | 'public'
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected'
  verificationSource: text
  summary: text
  highlights: text[]
  metadata: jsonb
  evidenceCount: integer
  lastValidatedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `evidence`

Proofs for capabilities.

```typescript
{
  id: uuid (PK)
  capabilityId: uuid (FK -> capabilities.id)
  profileId: uuid (FK -> profiles.id)
  title: text
  description: text
  evidenceType: 'document' | 'link' | 'assessment' | 'peer_review' | 'credential'
  url: text (nullable)
  filePath: text (nullable)
  issuedAt: timestamp
  verified: boolean
  metadata: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `skill_endorsements`

Peer validation for capabilities.

```typescript
{
  id: uuid (PK)
  capabilityId: uuid (FK -> capabilities.id)
  endorserProfileId: uuid (FK -> profiles.id)
  ownerProfileId: uuid (FK -> profiles.id)
  message: text
  status: 'pending' | 'accepted' | 'declined' | 'revoked'
  visibility: 'private' | 'owner_only' | 'shared' | 'public'
  respondedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `growth_plans`

Development goals for skills.

```typescript
{
  id: uuid (PK)
  profileId: uuid (FK -> profiles.id)
  capabilityId: uuid (FK -> capabilities.id, nullable)
  title: text
  goal: text
  targetLevel: integer
  targetDate: date
  status: 'planned' | 'in_progress' | 'blocked' | 'completed' | 'archived'
  milestones: jsonb
  supportNeeds: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3.5 Verification System Tables

#### `verification_requests`

Workflow for proof verification.

```typescript
{
  id: uuid (PK)
  claimType: 'experience' | 'education' | 'volunteering' | 'impact_story' | 'capability'
  claimId: uuid // ID of the claim being verified
  profileId: uuid (FK -> profiles.id)
  verifierEmail: text
  verifierName: text (nullable)
  verifierOrg: text (nullable)
  status: 'pending' | 'accepted' | 'declined' | 'cannot_verify' | 'expired' | 'appealed'
  token: text (unique) // For magic link
  sentAt: timestamp
  expiresAt: timestamp // 14 days from sentAt
  lastNudgedAt: timestamp (nullable) // For 48h & 7d nudges
  respondedAt: timestamp (nullable)
  createdAt: timestamp
}
```

**SLA Targets** (from PRD):

- Target response: 72 hours
- Auto-nudge: 48 hours & 7 days
- Expiry: 14 days

#### `verification_responses`

Referee's response to verification request.

```typescript
{
  id: uuid (PK)
  requestId: uuid (FK -> verification_requests.id)
  responseType: 'accept' | 'decline' | 'cannot_verify'
  reason: text (nullable, required for decline/cannot_verify)
  verifierSeniority: integer (nullable) // Derived from Expertise Atlas, not visible
  notes: text (nullable) // Private notes for appeal process
  ipAddress: text (nullable)
  userAgent: text (nullable)
  respondedAt: timestamp
}
```

#### `verification_appeals`

User contests a declined verification.

```typescript
{
  id: uuid (PK)
  requestId: uuid (FK -> verification_requests.id)
  profileId: uuid (FK -> profiles.id)
  context: text // User's explanation (≤500 words)
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  reviewerId: uuid (FK -> profiles.id, nullable) // Admin who reviews
  reviewNotes: text (nullable)
  reviewedAt: timestamp (nullable)
  createdAt: timestamp
}
```

**Human Review SLA**: ≤72 hours

#### `org_verification`

Organization domain and entity checks.

```typescript
{
  id: uuid (PK)
  orgId: uuid (FK -> organizations.id)
  verificationType: 'domain_email' | 'website' | 'registry' | 'manual'
  domain: text (nullable)
  registryNumber: text (nullable)
  status: 'pending' | 'verified' | 'failed' | 'expired'
  verifiedBy: uuid (FK -> profiles.id, nullable)
  verifiedAt: timestamp (nullable)
  expiresAt: timestamp (nullable)
  metadata: jsonb
  createdAt: timestamp
}
```

**PRD Requirement**: Organization must be verified before matching.

### 3.6 Messaging System Tables

#### `conversations`

Chat threads between matched users.

```typescript
{
  id: uuid (PK)
  matchId: uuid (FK -> matches.id, unique)
  assignmentId: uuid (FK -> assignments.id)
  participantOneId: uuid (FK -> profiles.id)
  participantTwoId: uuid (FK -> profiles.id)
  stage: integer // 1 = masked basics, 2 = full reveal
  status: 'active' | 'archived' | 'closed'
  lastMessageAt: timestamp (nullable)
  createdAt: timestamp
}
```

**Staged Identity Reveal**:

- **Stage 1** (Initial): Masked names, generic titles, basic info
- **Stage 2** (After mutual accept): Full names, organization, contact details

#### `messages`

Individual messages in conversations.

```typescript
{
  id: uuid (PK)
  conversationId: uuid (FK -> conversations.id)
  senderId: uuid (FK -> profiles.id)
  content: text
  attachments: jsonb // [{type: 'link' | 'pdf', url: string, name: string, size?: number}]
  isSystemMessage: boolean // For stage transition notifications
  readAt: timestamp (nullable)
  flaggedForModeration: boolean
  sentAt: timestamp
}
```

**Attachment Rules** (PRD): Links + PDF ≤5 MB only

#### `blocked_users`

Prevent unwanted communication.

```typescript
{
  blockerId: uuid (PK, FK -> profiles.id)
  blockedId: uuid (PK, FK -> profiles.id)
  reason: text (nullable)
  createdAt: timestamp

  // Composite primary key: (blockerId, blockedId)
}
```

### 3.7 Moderation & Safety Tables

#### `content_reports`

User and AI-flagged content.

```typescript
{
  id: uuid (PK)
  reporterId: uuid (FK -> profiles.id)
  contentType: 'profile' | 'message' | 'assignment' | 'impact_story' | 'experience' | 'education' | 'volunteering'
  contentId: uuid
  contentOwnerId: uuid (FK -> profiles.id)
  reason: text // ≤50 words per PRD
  category: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'political' | 'other'
  status: 'pending' | 'reviewing' | 'actioned' | 'dismissed'
  aiFlag: boolean // True if AI-flagged
  aiConfidence: numeric (0-1)
  reviewedBy: uuid (FK -> profiles.id, nullable)
  reviewedAt: timestamp (nullable)
  createdAt: timestamp
}
```

**Political Content Policy** (PRD):

- ✅ Allowed: Factual role descriptions (e.g., "Policy analyst at Ministry X")
- ❌ Disallowed: Advocacy, proselytizing, "Vote for X", promotional campaign content

#### `moderation_actions`

Actions taken on reported content.

```typescript
{
  id: uuid (PK)
  reportId: uuid (FK -> content_reports.id)
  moderatorId: uuid (FK -> profiles.id)
  actionType: 'warning' | 'content_removed' | 'account_suspended' | 'dismissed'
  reason: text
  isAppealable: boolean
  appealDeadline: timestamp (nullable)
  createdAt: timestamp
}
```

#### `user_violations`

Violation history per user.

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> profiles.id)
  reportId: uuid (FK -> content_reports.id)
  violationType: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'political' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  actionTaken: 'warning' | 'content_removed' | 'timed_suspension' | 'permanent_ban'
  suspensionExpiresAt: timestamp (nullable)
  notes: text
  createdAt: timestamp
}
```

**Violation Escalation** (PRD):

1. First violation → **Warning**
2. Second critical violation → **Timed suspension**
3. Repeated critical violations → **Permanent ban**

### 3.8 Analytics & Supporting Tables

#### `analytics_events`

Track key user actions.

```typescript
{
  id: uuid (PK)
  eventType: text // 'signed_up', 'match_accepted', 'verification_requested', etc.
  userId: uuid (FK -> profiles.id, nullable)
  orgId: uuid (FK -> organizations.id, nullable)
  entityType: text (nullable) // 'match', 'assignment', 'profile', etc.
  entityId: uuid (nullable)
  properties: jsonb // Additional event data
  sessionId: text (nullable)
  ipAddress: text (nullable)
  userAgent: text (nullable)
  createdAt: timestamp
}
```

**Core Events** (from PRD):

- `signed_up`, `created_profile`, `profile_ready_for_match`
- `org_verified`, `assignment_published`
- `match_suggested`, `match_viewed`, `match_accepted`, `match_declined(reason)`
- `message_sent`
- `verification_requested`, `verification_completed(status)`
- `content_reported`

#### `editorial_matches`

Curated matches for cold-start.

```typescript
{
  id: uuid (PK)
  assignmentId: uuid (FK -> assignments.id)
  profileId: uuid (FK -> profiles.id)
  curatorId: uuid (FK -> profiles.id) // Admin who created match
  reason: text
  notes: text (nullable)
  priority: integer (default: 0)
  isActive: boolean
  createdAt: timestamp
}
```

#### `match_suggestions`

Improvement tips for users.

```typescript
{
  id: uuid (PK)
  matchId: uuid (FK -> matches.id)
  profileId: uuid (FK -> profiles.id)
  suggestionType: 'add_proof' | 'add_skill' | 'update_value' | 'complete_profile'
  description: text
  estimatedImpact: numeric // 0-100 (percentage points)
  actionUrl: text (nullable)
  isDismissed: boolean
  createdAt: timestamp
}
```

**Example** (from PRD): "Add proof X to increase score by ~8-12%"

#### `active_ties`

Cluster snapshot for algorithms (private).

```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> profiles.id)
  tieType: 'match' | 'verification' | 'endorsement' | 'conversation'
  relatedUserId: uuid (FK -> profiles.id, nullable)
  relatedOrgId: uuid (FK -> organizations.id, nullable)
  strength: numeric (0-1)
  lastInteractionAt: timestamp
  isLegacy: boolean // True if >60 days old
  createdAt: timestamp
}
```

**Visibility** (PRD): Private only; used by algorithms. No public UI in MVP.

### 3.9 Platform Tables

#### `audit_logs`

Tracks all significant actions.

```typescript
{
  id: bigserial(PK);
  actorId: uuid(nullable); // null for system actions
  orgId: uuid(nullable); // null for non-org actions
  action: text;
  targetType: text(nullable);
  targetId: text(nullable);
  meta: jsonb;
  createdAt: timestamp;
}
```

**Retention** (PRD): 2 years

#### `feature_flags`

Toggle features for gradual rollout.

```typescript
{
  key: text(PK);
  enabled: boolean;
  audience: jsonb; // Rules for targeting (e.g., {userIds: [...], orgs: [...]})
}
```

#### `rate_limits`

Track rate limiting per IP/route.

```typescript
{
  id: text(PK); // Composite of IP + route
  attempts: bigserial;
  resetAt: timestamp;
}
```

**Limits** (PRD):

- 60 req/min per IP
- 120 req/min per user token (burst 2×)
- Stricter for auth/verification endpoints

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

**Supported Methods**:

1. Email/Password (Supabase Auth)
2. OAuth (Google, LinkedIn)
3. Future: Apple, GitHub, Facebook, MFA, SSO (SAML/OIDC)

**Sign-Up Flow**:

```
1. User enters email/password or clicks OAuth button
2. Supabase Auth creates auth.users record
3. Database trigger creates profiles record (persona: 'unknown')
4. User redirected to /onboarding
5. User selects "Individual" or "Organization"
6. Profile updated with persona: 'individual' or 'org_member'
7. User redirected to appropriate dashboard
```

**Sign-In Flow**:

```
1. User authenticates via Supabase Auth
2. Server queries profiles table for persona
3. If persona = 'individual' → redirect to /app/i/home
4. If persona = 'org_member':
   a. Query organization_members table for first active org
   b. Redirect to /app/o/{slug}/home
5. If persona = 'unknown' → redirect to /onboarding
```

**Implementation**: `./src/components/auth/SignIn.tsx:41-76`

### 4.2 Authorization Model

**Row-Level Security (RLS)**:
Every table has RLS policies that check:

- `auth.uid()` - Current authenticated user ID
- Ownership (e.g., `profile_id = auth.uid()`)
- Membership (via JOIN with `organization_members`)

**Example RLS Policies**:

```sql
-- Users can view their own verification requests
CREATE POLICY "Users can view their own verification requests"
ON verification_requests
FOR SELECT
USING (auth.uid() = profile_id);

-- Participants can view messages in their conversations
CREATE POLICY "Participants can view messages"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
  )
);

-- Org members can view org verification
CREATE POLICY "Org members can view org verification"
ON org_verification
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.org_id = org_verification.org_id
    AND om.user_id = auth.uid()
  )
);
```

### 4.3 Persona System

The `persona` field on `profiles` table determines routing and UI:

| Persona      | Routes            | Capabilities                                             |
| ------------ | ----------------- | -------------------------------------------------------- |
| `individual` | `/app/i/*`        | Create profile, get matched, message after mutual accept |
| `org_member` | `/app/o/[slug]/*` | Create assignments, review matches, invite team          |
| `unknown`    | `/onboarding`     | Must select persona before accessing platform            |

**Persona Assignment**:

- Set during onboarding flow (`/onboarding`)
- Can be toggled in settings (`/settings`)
- One user can have BOTH personas (individual + org_member) via multiple profiles/memberships

### 4.4 Organization Roles

Within organizations, users have one of four roles:

| Role     | Permissions                                               |
| -------- | --------------------------------------------------------- |
| `owner`  | Full control: delete org, transfer ownership, manage all  |
| `admin`  | Manage members, assignments, settings (cannot delete org) |
| `member` | Create assignments, view matches, message candidates      |
| `viewer` | Read-only access to org dashboard                         |

**Implementation**: `organization_members.role` enum

### 4.5 Privacy Levels

Individual profile data has granular visibility controls:

| Level     | Visible To                                     |
| --------- | ---------------------------------------------- |
| `public`  | Everyone (search engines, non-logged-in users) |
| `network` | Logged-in users on platform (default)          |
| `private` | Only the user                                  |

**Implementation**: `individual_profiles.visibility` enum

Capabilities have separate privacy levels:

- `only_me` - Private development tracking
- `team` - Share with org members
- `organization` - Visible to entire organization
- `public` - Visible to all platform users

---

## 5. User Journeys & Core Flows

### 5.1 Individual User Journey

#### A. Onboarding Flow

```
1. Sign up (email/password or OAuth)
   ├─> Create auth.users record
   ├─> Create profiles record (persona: 'unknown')
   └─> Redirect to /onboarding

2. Select "I'm an Individual"
   ├─> Update profiles.persona = 'individual'
   ├─> Create individual_profiles record
   └─> Redirect to /app/i/profile/edit

3. Complete profile
   ├─> Fill required fields (mission, values, causes)
   ├─> Add skills to Expertise Atlas
   ├─> Add 1-3 proof items (experiences, education, volunteering, impact stories)
   └─> Create matching_profile record

4. Ready for matching
   ├─> Profile marked "Ready for Match"
   ├─> Fire analytics event: profile_ready_for_match
   └─> Redirect to /app/i/home
```

#### B. Matching Flow

```
1. User toggles "Available for Match" on dashboard
   └─> Update matching_profiles with preferences

2. System runs matching algorithm
   ├─> Query active assignments
   ├─> Compute scores for user × assignment pairs
   ├─> Store top 5-10 results in matches table
   └─> Fire analytics event: match_suggested

3. User views matches on /app/i/matches
   ├─> See "Why this match" breakdown
   ├─> See improvement suggestions (e.g., "Add proof X → +8-12%")
   └─> Fire analytics event: match_viewed

4. User clicks "Interested"
   ├─> Create match_interest record
   ├─> Fire analytics event: match_accepted
   └─> Notify organization

5. Organization reciprocates interest
   ├─> Create conversation record (stage: 1)
   └─> Both parties can message (Stage 1: masked)

6. After mutual comfort, conversation moves to Stage 2
   ├─> Update conversation.stage = 2
   ├─> Full identity reveal
   └─> Exchange contact details
```

#### C. Verification Flow (Individual Requests Verification)

```
1. User adds experience/education/volunteering
   └─> Record created with verified: false

2. User clicks "Request Verification"
   ├─> Modal opens: "Who can verify this?"
   ├─> User enters verifier email + name + org (optional)
   └─> Submit form

3. System sends verification email
   ├─> Create verification_requests record
   ├─> Generate unique token
   ├─> Send email with magic link: /verify?token=...
   ├─> Set expiresAt = sentAt + 14 days
   └─> Fire analytics event: verification_requested

4. Verifier receives email
   ├─> Clicks magic link
   └─> Lands on verification page (no auth required)

5. Verifier reviews claim
   ├─> Views claim details + artifact (if provided)
   └─> Chooses: Accept | Decline | Cannot Verify

6. Verifier submits response
   ├─> Create verification_responses record
   ├─> Update verification_requests.status
   ├─> Update claim's verified field (if accepted)
   ├─> Send confirmation email to user
   └─> Fire analytics event: verification_completed(status)

7. If declined, user can appeal
   ├─> Submit context (≤500 words)
   ├─> Create verification_appeals record
   └─> Human review within 72 hours
```

**Auto-Nudge System**:

- **48 hours**: First reminder email if status = 'pending'
- **7 days**: Second reminder email if status = 'pending'
- **14 days**: Expire request if status = 'pending'

**Implementation Guide**: `./IMPLEMENTATION_GUIDE_MVP_SYSTEMS.md:1-200`

### 5.2 Organization User Journey

#### A. Onboarding Flow

```
1. Sign up (email/password or OAuth)
   └─> Same as individual (auth.users + profiles created)

2. Select "I'm an Organization"
   ├─> Update profiles.persona = 'org_member'
   └─> Redirect to /onboarding/org

3. Create organization
   ├─> Enter legal name, display name, website
   ├─> Choose type (company, NGO, network, other)
   ├─> System generates slug (e.g., "acme-corp")
   ├─> Create organizations record
   ├─> Create organization_members record (role: 'owner')
   └─> Redirect to /app/o/{slug}/verify

4. Verify organization (required before matching)
   ├─> Verification type: domain_email
   │   └─> Enter work email → send verification link
   ├─> OR: website check
   │   └─> Upload file to website root → system verifies
   ├─> OR: registry number
   │   └─> Manual review by admin
   └─> Create org_verification record

5. Verification approved
   ├─> Update org_verification.status = 'verified'
   ├─> Fire analytics event: org_verified
   └─> Redirect to /app/o/{slug}/home
```

#### B. Assignment Creation Flow

```
1. User navigates to /app/o/{slug}/assignments/new
   └─> See assignment creation form

2. Fill required fields
   ├─> Role title (with title-inflation guardrails)
   ├─> Description
   ├─> Expected outcomes/impact
   ├─> Mission/values alignment
   ├─> Location (remote/onsite/hybrid)
   ├─> Timeline (start earliest/latest)
   ├─> Compensation range (masked in UI)
   └─> Proof requirements

3. Define matching criteria
   ├─> Must-have skills (from taxonomy)
   ├─> Nice-to-have skills
   ├─> Languages (min level)
   ├─> Verification gates (e.g., "Must have verified education")
   └─> Custom weights (optional, ±15pp from defaults)

4. Save as draft
   ├─> Create assignments record (status: 'draft')
   └─> Review before publishing

5. Publish assignment
   ├─> Update assignments.status = 'active'
   ├─> Fire analytics event: assignment_published
   └─> System starts matching within 24 hours
```

**Default Matching Weights** (PRD):

- Mission/Values: **30%**
- Core Expertise: **40%**
- Tools: **10%**
- Logistics: **10%**
- Recency: **10%**

Adjustable ±15pp by organization.

#### C. Reviewing Matches Flow

```
1. Navigate to /app/o/{slug}/assignments/[id]/matches
   └─> See top 5-10 matches (configurable)

2. For each match, see:
   ├─> Overall score (0-100)
   ├─> Breakdown: {values: 28, skills: 35, location: 10, ...}
   ├─> Profile preview (Stage 1: masked)
   └─> "Why this match" explanation

3. Mark candidates of interest
   ├─> Click "Interested"
   ├─> Create match_interest record (actor: org, target: profile)
   ├─> Fire analytics event: match_accepted
   └─> Notify candidate

4. Candidate reciprocates
   ├─> Conversation created
   └─> Both can message (Stage 1: masked)

5. Move to Stage 2 (mutual decision)
   ├─> Full identity reveal
   └─> Exchange contact details
```

### 5.3 Messaging Flow (Post-Match)

#### Stage 1: Masked Basics

```
Participant One sees:          Participant Two sees:
- "Experienced Developer"      - "Senior Growth Lead at Mid-size NGO"
- "Mid-size Tech Company"      - "Climate Justice sector"
- Skills aligned               - Skills aligned
- Values aligned               - Values aligned
```

Both can:

- Send text messages
- Share links
- Attach PDFs (≤5 MB)

Neither sees:

- Full names
- Organization names
- Email addresses
- Phone numbers

#### Stage 2: Full Reveal

```
Triggered by: Mutual decision to advance conversation

Participant One sees:          Participant Two sees:
- "Alex Johnson"               - "Sarah Chen"
- "Acme Corp"                  - "Climate Action Network"
- alex@acmecorp.com           - sarah@climateaction.org
- +1 555-0123                 - +44 20 1234 5678
```

**Implementation**: `conversations.stage` (1 or 2) + conditional rendering in UI

### 5.4 Moderation Flow

#### User Reports Content

```
1. User sees inappropriate content
   └─> Clicks "Report" button

2. User fills report form
   ├─> Select category (spam, harassment, misinformation, inappropriate, political, other)
   ├─> Enter reason (≤50 words)
   └─> Submit

3. System creates content_reports record
   ├─> reporterId, contentType, contentId, contentOwnerId
   ├─> status: 'pending'
   └─> Fire analytics event: content_reported

4. AI system reviews content (optional)
   ├─> Run keyword/ML flagging
   ├─> Set aiFlag: true if flagged
   ├─> Set aiConfidence: 0-1
   └─> High confidence → auto-escalate to 'reviewing'
```

#### Moderator Reviews Report

```
1. Moderator logs into moderation queue
   └─> /admin/moderation (admin-only route)

2. Moderator reviews report
   ├─> View content, context, reporter's reason
   ├─> Check user's violation history (user_violations table)
   └─> Decide action

3. Moderator takes action
   ├─> Dismissed: No violation found
   ├─> Warning: First offense, low severity
   ├─> Content Removed: Violates policy
   ├─> Account Suspended: Critical violation + prior warning
   └─> Create moderation_actions record

4. System applies action
   ├─> Send email notification to user
   ├─> Create user_violations record
   ├─> If suspension: set suspensionExpiresAt
   └─> Update content_reports.status = 'actioned'
```

**Violation Escalation** (PRD):

1. First violation → **Warning**
2. Second critical violation → **Timed suspension** (e.g., 7 days)
3. Repeated critical violations → **Permanent ban**

### 5.5 Analytics Event Tracking

**Key Events to Track** (PRD):

| Event                     | Trigger                            | Properties                                                       |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `signed_up`               | User completes registration        | {persona, method: 'email' \| 'oauth'}                            |
| `created_profile`         | Profile created                    | {persona, profileId}                                             |
| `profile_ready_for_match` | Profile meets matching criteria    | {profileId, completionScore}                                     |
| `org_verified`            | Organization verification approved | {orgId, verificationType}                                        |
| `assignment_published`    | Assignment status → 'active'       | {assignmentId, orgId}                                            |
| `match_suggested`         | Match computed and shown           | {matchId, score}                                                 |
| `match_viewed`            | User views match details           | {matchId}                                                        |
| `match_accepted`          | User expresses interest            | {matchId, actorType: 'individual' \| 'org'}                      |
| `match_declined`          | User declines match                | {matchId, reason}                                                |
| `message_sent`            | Message sent in conversation       | {conversationId, stage}                                          |
| `verification_requested`  | User requests verification         | {claimType, claimId}                                             |
| `verification_completed`  | Verifier responds                  | {requestId, status: 'accepted' \| 'declined' \| 'cannot_verify'} |
| `content_reported`        | User reports content               | {contentType, category}                                          |

**Storage**: All events stored in `analytics_events` table.

**Targets** (90-day goals, PRD):

- Profile completion ≥60% within D+1
- First suggestion <24h
- Match acceptance ≥20%
- ≥50% assignments with ≥3 qualified matches in 7d
- Verified users ≥30% by D+14
- Report rate <1% with <24h SLA

---

## 6. File Structure & Code Organization

### 6.1 Directory Overview

```
./
├── src/
│   ├── actions/           # Server Actions (mutations)
│   ├── app/               # Next.js App Router (pages + API)
│   ├── components/        # React components
│   ├── db/                # Database (Drizzle ORM)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── docs/                  # Documentation
└── migrations/            # Database migration SQL files
```

### 6.2 `/src/app` - Routes & Pages

#### Authentication Routes

```
/src/app/
├── page.tsx                    # Landing page (marketing)
├── signin/
│   └── page.tsx                # Sign-in page (standalone)
├── signup/
│   └── page.tsx                # Sign-up page (account type selection)
├── reset-password/
│   └── page.tsx                # Password reset request
├── update-password/
│   └── page.tsx                # Password reset confirmation
└── onboarding/
    └── page.tsx                # Persona selection + initial profile setup
```

#### Individual Routes (`/app/i/*`)

```
/src/app/i/
├── home/
│   └── page.tsx                # Individual dashboard
├── profile/
│   ├── page.tsx                # View own profile
│   └── edit/
│       └── page.tsx            # Edit profile
├── matches/
│   └── page.tsx                # Match suggestions list
├── expertise/
│   ├── page.tsx                # Expertise Atlas overview
│   └── capabilities/
│       └── page.tsx            # Manage capabilities + evidence
└── messages/
    └── page.tsx                # Conversations list (pending implementation)
```

#### Organization Routes (`/app/o/[slug]/*`)

```
/src/app/o/[slug]/
├── home/
│   └── page.tsx                # Organization dashboard
├── assignments/
│   ├── page.tsx                # Assignments list
│   ├── new/
│   │   └── page.tsx            # Create assignment
│   └── [id]/
│       ├── page.tsx            # Assignment details
│       ├── edit/
│       │   └── page.tsx        # Edit assignment
│       └── matches/
│           └── page.tsx        # Review matches for assignment
├── settings/
│   ├── page.tsx                # Organization settings
│   ├── team/
│   │   └── page.tsx            # Team management (invite, roles)
│   └── verification/
│       └── page.tsx            # Organization verification
└── messages/
    └── page.tsx                # Conversations (pending implementation)
```

#### Shared Routes

```
/src/app/
├── settings/
│   └── page.tsx                # Global user settings (persona toggle)
└── verify/
    └── page.tsx                # Verification landing page (magic link)
```

### 6.3 `/src/app/api` - API Routes

```
/src/app/api/
├── matching/
│   ├── suggest/
│   │   └── route.ts            # POST /api/matching/suggest (run matching)
│   └── weights/
│       └── route.ts            # GET/POST /api/matching/weights (manage weights)
├── assignments/
│   ├── [id]/
│   │   ├── route.ts            # GET/PATCH /api/assignments/[id]
│   │   └── matches/
│   │       └── route.ts        # GET /api/assignments/[id]/matches
│   └── route.ts                # POST /api/assignments (create)
├── expertise/
│   ├── capabilities/
│   │   └── route.ts            # GET/POST /api/expertise/capabilities
│   └── evidence/
│       └── route.ts            # POST /api/expertise/evidence (upload)
├── verification/
│   ├── request/
│   │   └── route.ts            # POST /api/verification/request (send email)
│   └── respond/
│       └── route.ts            # POST /api/verification/respond (verifier action)
├── messaging/
│   ├── conversations/
│   │   └── route.ts            # GET /api/messaging/conversations
│   └── messages/
│       └── route.ts            # GET/POST /api/messaging/messages
└── taxonomy/
    └── route.ts                # GET /api/taxonomy (skills taxonomy)
```

### 6.4 `/src/components` - React Components

**Component Organization by Domain:**

```
/src/components/
├── auth/                      # Authentication
│   ├── SignIn.tsx             # Sign-in form (email/password)
│   ├── SignupForm.tsx         # Sign-up form (dual theme: green/terracotta)
│   ├── social-sign-in-buttons.tsx  # OAuth buttons
│   └── account-type-card.tsx  # Individual vs Organization selection
├── profile/                   # Individual profiles
│   ├── ProfileCard.tsx        # Profile preview card
│   ├── ProfileEditor.tsx      # Edit profile form
│   ├── ProofSection.tsx       # List proofs (experiences, education, etc.)
│   └── VerificationBadge.tsx  # Verified/pending status badge
├── matching/                  # Matching system
│   ├── MatchCard.tsx          # Single match result card
│   ├── MatchList.tsx          # List of matches
│   ├── MatchExplanation.tsx   # "Why this match" breakdown
│   └── MatchSuggestions.tsx   # Improvement tips
├── assignments/               # Organizations - assignments
│   ├── AssignmentCard.tsx     # Assignment preview card
│   ├── AssignmentForm.tsx     # Create/edit assignment
│   └── WeightsEditor.tsx      # Adjust matching weights
├── expertise/                 # Expertise Atlas
│   ├── CapabilityCard.tsx     # Single capability card
│   ├── EvidenceUpload.tsx     # Upload evidence
│   └── SkillSelector.tsx      # Select skills from taxonomy
├── messaging/                 # Post-match messaging (pending)
│   ├── ConversationList.tsx   # List of conversations
│   ├── MessageThread.tsx      # Chat interface
│   └── StageIndicator.tsx     # Stage 1 vs Stage 2 indicator
├── moderation/                # Moderation (pending)
│   ├── ReportForm.tsx         # Report content form
│   └── ModerationQueue.tsx    # Admin moderation dashboard
├── ui/                        # Shared UI components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   ├── label.tsx
│   ├── separator.tsx
│   └── ...
└── NetworkBackground.tsx      # Animated network background (brand element)
```

### 6.5 `/src/actions` - Server Actions

```
/src/actions/
├── auth.ts                    # Sign-in, sign-up, sign-out
├── profile.ts                 # Create/update profile
├── assignments.ts             # Create/update/delete assignments
├── matching.ts                # Run matching algorithm
├── verification.ts            # Request/respond to verification
└── moderation.ts              # Report content, moderate
```

### 6.6 `/src/lib` - Utility Libraries

```
/src/lib/
├── auth.ts                    # Auth utilities (resolveUserHomePath, getSession)
├── supabase/
│   ├── client.ts              # Supabase client factory
│   └── server.ts              # Server-side Supabase client
├── matching/
│   ├── algorithm.ts           # Core matching algorithm
│   ├── scoring.ts             # Scoring functions (values, skills, location, etc.)
│   └── weights.ts             # Weight management + guardrails
├── taxonomy/
│   └── skills.ts              # Skills taxonomy (hierarchical structure)
├── verification/
│   └── email.ts               # Send verification emails (Resend)
├── utils.ts                   # General utilities (cn, formatDate, etc.)
└── validations.ts             # Zod schemas for form validation
```

### 6.7 `/src/db` - Database Layer

```
/src/db/
├── schema.ts                  # Drizzle schema (30+ tables)
├── migrations/                # Migration SQL files
│   ├── 20250129_add_verification_messaging_moderation.sql
│   └── ...
└── index.ts                   # Database connection + query helpers
```

### 6.8 `/src/types` - TypeScript Types

```
/src/types/
├── matching.ts                # Matching types (MatchScore, MatchVector, etc.)
├── profile.ts                 # Profile types (extended from schema)
├── api.ts                     # API request/response types
└── index.ts                   # Exported types
```

---

## 7. Feature Implementation Status Matrix

### 7.1 Authentication & Accounts [MVP]

| Feature             | Schema | API | UI  | Status       |
| ------------------- | ------ | --- | --- | ------------ |
| Email/password auth | ✅     | ✅  | ✅  | **Complete** |
| Google OAuth        | ✅     | ✅  | ✅  | **Complete** |
| LinkedIn OAuth      | ✅     | ✅  | ✅  | **Complete** |
| Sign-out            | ✅     | ✅  | ✅  | **Complete** |
| Password reset      | ✅     | ✅  | ✅  | **Complete** |
| Session management  | ✅     | ✅  | ✅  | **Complete** |
| Device recognition  | ✅     | ⚠️  | ❌  | Partial      |
| Apple OAuth         | ❌     | ❌  | ❌  | Post-MVP     |
| GitHub OAuth        | ❌     | ❌  | ❌  | Post-MVP     |
| MFA                 | ❌     | ❌  | ❌  | Post-MVP     |
| SSO (SAML/OIDC)     | ❌     | ❌  | ❌  | Post-MVP     |

### 7.2 Profiles (Individual) [MVP]

| Feature                   | Schema | API | UI  | Status       |
| ------------------------- | ------ | --- | --- | ------------ |
| Basic profile fields      | ✅     | ✅  | ✅  | **Complete** |
| Mission/Vision/Values     | ✅     | ✅  | ✅  | **Complete** |
| Causes                    | ✅     | ✅  | ✅  | **Complete** |
| Expertise Atlas (skills)  | ✅     | ✅  | ✅  | **Complete** |
| Impact Stories            | ✅     | ✅  | ⚠️  | Partial      |
| Experiences               | ✅     | ✅  | ⚠️  | Partial      |
| Education                 | ✅     | ✅  | ⚠️  | Partial      |
| Volunteering              | ✅     | ✅  | ⚠️  | Partial      |
| Avatar upload             | ✅     | ✅  | ✅  | **Complete** |
| Privacy controls          | ✅     | ⚠️  | ⚠️  | Partial      |
| Profile preview (WYSIWYG) | ❌     | ❌  | ⚠️  | Partial      |
| Rich portfolios           | ❌     | ❌  | ❌  | Post-MVP     |

### 7.3 Organizations & Assignments [MVP]

| Feature              | Schema | API | UI  | Status       |
| -------------------- | ------ | --- | --- | ------------ |
| Create organization  | ✅     | ✅  | ✅  | **Complete** |
| Invite team members  | ✅     | ✅  | ✅  | **Complete** |
| Role management      | ✅     | ✅  | ✅  | **Complete** |
| Create assignments   | ✅     | ✅  | ✅  | **Complete** |
| Draft/Publish/Close  | ✅     | ✅  | ✅  | **Complete** |
| Masked budgets       | ✅     | ✅  | ✅  | **Complete** |
| Proof requirements   | ✅     | ⚠️  | ⚠️  | Partial      |
| Edit history         | ✅     | ❌  | ❌  | Not Started  |
| Audit log            | ✅     | ⚠️  | ❌  | Partial      |
| Contracts/milestones | ❌     | ❌  | ❌  | Post-MVP     |

### 7.4 Matching & Recommendations [MVP]

| Feature                   | Schema | API | UI  | Status              |
| ------------------------- | ------ | --- | --- | ------------------- |
| Matching algorithm        | ✅     | ✅  | ⚠️  | **Mostly Complete** |
| Multi-factor scoring      | ✅     | ✅  | ✅  | **Complete**        |
| Explainability            | ✅     | ✅  | ✅  | **Complete**        |
| Improvement suggestions   | ✅     | ⚠️  | ⚠️  | Partial             |
| Weight adjustments        | ✅     | ✅  | ✅  | **Complete**        |
| Weight guardrails (±15pp) | ✅     | ✅  | ⚠️  | Partial             |
| Top 5-10 results          | ✅     | ✅  | ✅  | **Complete**        |
| Editorial matches         | ✅     | ❌  | ❌  | Not Started         |
| Near matches              | ✅     | ❌  | ❌  | Not Started         |
| Refresh schedules         | ❌     | ❌  | ❌  | Not Started         |
| Adaptive weights          | ❌     | ❌  | ❌  | Post-MVP            |
| Team/role matching        | ❌     | ❌  | ❌  | Post-MVP            |

### 7.5 Verification v1.0 [MVP]

| Feature                      | Schema | API | UI  | Status          |
| ---------------------------- | ------ | --- | --- | --------------- |
| Verification requests        | ✅     | ❌  | ❌  | **Schema Only** |
| Email workflow               | ✅     | ❌  | ❌  | Not Started     |
| Verifier landing page        | ✅     | ❌  | ❌  | Not Started     |
| Accept/Decline/Cannot Verify | ✅     | ❌  | ❌  | Not Started     |
| Auto-nudge (48h, 7d)         | ✅     | ❌  | ❌  | Not Started     |
| Expiry (14d)                 | ✅     | ❌  | ❌  | Not Started     |
| Appeals                      | ✅     | ❌  | ❌  | Not Started     |
| Domain verification (orgs)   | ✅     | ❌  | ⚠️  | Partial         |
| Seniority weighting          | ✅     | ❌  | ❌  | Not Started     |
| Multi-ref trees              | ❌     | ❌  | ❌  | Post-MVP        |
| Registry lookups             | ❌     | ❌  | ❌  | Post-MVP        |

### 7.6 Cluster Snapshot v1.0 [MVP]

| Feature              | Schema | API | UI  | Status          |
| -------------------- | ------ | --- | --- | --------------- |
| Active ties tracking | ✅     | ❌  | ❌  | **Schema Only** |
| Legacy ties (>60d)   | ✅     | ❌  | ❌  | Not Started     |
| Algorithm use        | ❌     | ❌  | ❌  | Not Started     |
| Personal UI          | ❌     | ❌  | ❌  | Post-MVP        |
| Graph analytics      | ❌     | ❌  | ❌  | Post-MVP        |

### 7.7 Messaging (Post-Match) [MVP]

| Feature                | Schema | API | UI  | Status          |
| ---------------------- | ------ | --- | --- | --------------- |
| Conversations          | ✅     | ❌  | ❌  | **Schema Only** |
| Messages               | ✅     | ❌  | ❌  | Not Started     |
| Stage 1 (masked)       | ✅     | ❌  | ❌  | Not Started     |
| Stage 2 (reveal)       | ✅     | ❌  | ❌  | Not Started     |
| Link attachments       | ✅     | ❌  | ❌  | Not Started     |
| PDF attachments (≤5MB) | ✅     | ❌  | ❌  | Not Started     |
| Block users            | ✅     | ❌  | ❌  | Not Started     |
| Report messages        | ✅     | ❌  | ❌  | Not Started     |
| Voice/video            | ❌     | ❌  | ❌  | Post-MVP        |
| Scheduling             | ❌     | ❌  | ❌  | Post-MVP        |

### 7.8 Admin & Moderation [MVP]

| Feature                  | Schema | API | UI  | Status          |
| ------------------------ | ------ | --- | --- | --------------- |
| Content reports          | ✅     | ❌  | ❌  | **Schema Only** |
| User reports             | ✅     | ❌  | ❌  | Not Started     |
| AI flagging              | ✅     | ❌  | ❌  | Not Started     |
| Moderation queue         | ✅     | ❌  | ❌  | Not Started     |
| Moderation actions       | ✅     | ❌  | ❌  | Not Started     |
| Violation history        | ✅     | ❌  | ❌  | Not Started     |
| Warning system           | ✅     | ❌  | ❌  | Not Started     |
| Suspensions              | ✅     | ❌  | ❌  | Not Started     |
| Political content policy | ✅     | ❌  | ❌  | Not Started     |
| Appeals portal           | ❌     | ❌  | ❌  | Post-MVP        |
| Transparency reports     | ❌     | ❌  | ❌  | Post-MVP        |

### 7.9 Analytics & Metrics [MVP]

| Feature               | Schema | API | UI  | Status          |
| --------------------- | ------ | --- | --- | --------------- |
| Event tracking table  | ✅     | ❌  | ❌  | **Schema Only** |
| Core events           | ✅     | ⚠️  | ❌  | Partial         |
| Admin dashboard       | ❌     | ❌  | ❌  | Not Started     |
| North Star metrics    | ❌     | ❌  | ❌  | Not Started     |
| Time-to-first-match   | ❌     | ❌  | ❌  | Not Started     |
| Profile readiness     | ❌     | ❌  | ❌  | Not Started     |
| Match acceptance rate | ❌     | ❌  | ❌  | Not Started     |

---

## 8. Integration Points & External Services

### 8.1 Supabase Integration

**Services Used**:

- **Auth**: Email/password, OAuth (Google, LinkedIn)
- **Database**: PostgreSQL 15 with RLS
- **Storage**: (Future) File uploads for evidence/avatars

**Configuration**: `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Client Factory**: `/src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Server Client**: `/src/lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

### 8.2 Resend Integration (Email)

**Purpose**: Transactional emails (verification requests, notifications)

**Configuration**: `.env.local`

```bash
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@proofound.io
```

**Usage**: `/src/lib/verification/email.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail({
  to,
  verifierName,
  claimTitle,
  token,
}: {
  to: string;
  verifierName: string;
  claimTitle: string;
  token: string;
}) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Verification request from ${verifierName}`,
    html: `
      <p>Hi ${verifierName},</p>
      <p>You've been asked to verify the following claim:</p>
      <p><strong>${claimTitle}</strong></p>
      <p><a href="${verifyUrl}">Click here to review and respond</a></p>
      <p>This link expires in 14 days.</p>
    `,
  });
}
```

### 8.3 Vercel Analytics

**Purpose**: Web vitals, performance monitoring

**Configuration**: Automatic (via Vercel deployment)

**Metrics Tracked**:

- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

**Targets** (PRD):

- LCP < 2.5s (P75)
- INP < 200ms (P75)
- CLS < 0.1

### 8.4 Drizzle ORM

**Purpose**: Type-safe database queries

**Configuration**: `/drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Generate Migration**:

```bash
npx drizzle-kit generate:pg
```

**Apply Migration**:

```bash
npx drizzle-kit push:pg
```

**Query Example**:

```typescript
import { db } from '@/db';
import { profiles, individualProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Type-safe query
const profile = await db
  .select()
  .from(profiles)
  .leftJoin(individualProfiles, eq(profiles.id, individualProfiles.userId))
  .where(eq(profiles.id, userId))
  .limit(1);
```

### 8.5 Future Integrations (Post-MVP)

| Service       | Purpose            | Status  |
| ------------- | ------------------ | ------- |
| Stripe        | Payment processing | Planned |
| Twilio/Vonage | SMS notifications  | Planned |
| Daily/Vonage  | Video calls        | Planned |
| Unleash/Flipt | Feature flags      | Planned |
| Sentry        | Error tracking     | Planned |
| LogRocket     | Session replay     | Planned |

---

## 9. Key Process Documentation

### 9.1 Matching Algorithm Deep Dive

**Location**: `/src/lib/matching/algorithm.ts`

**High-Level Flow**:

```
1. Query active assignments (status: 'active')
2. Query matching_profiles (availabilityEarliest ≤ assignment.startLatest)
3. For each (assignment, profile) pair:
   a. Compute hard filters (location, compensation, verification gates)
   b. If fails → skip
   c. Compute soft scores (values, skills, causes, etc.)
   d. Apply weights
   e. Compute final score (0-100)
4. Store top 5-10 results per assignment in matches table
5. Return results
```

**Scoring Components**:

| Component      | Weight (Default) | Description                                  |
| -------------- | ---------------- | -------------------------------------------- |
| Mission/Values | **30%**          | Alignment with org mission + personal values |
| Core Expertise | **40%**          | Must-have skills + proficiency levels        |
| Tools          | **10%**          | Nice-to-have skills                          |
| Logistics      | **10%**          | Location, timezone, hours, compensation      |
| Recency        | **10%**          | Profile freshness, recent activity           |

**Weight Guardrails** (PRD):

- Adjustable ±15pp from defaults
- Sum must = 100%
- Enforced at API level

**Scoring Functions** (`/src/lib/matching/scoring.ts`):

```typescript
// Values alignment (0-100)
function scoreValues(profileValues: string[], assignmentValues: string[]): number {
  const overlap = profileValues.filter((v) => assignmentValues.includes(v));
  return (overlap.length / assignmentValues.length) * 100;
}

// Skills alignment (0-100)
function scoreSkills(
  profileSkills: Skill[],
  requiredSkills: { id: string; level: number }[]
): number {
  let total = 0;
  for (const req of requiredSkills) {
    const profile = profileSkills.find((s) => s.skillId === req.id);
    if (!profile) continue; // Hard filter should catch this

    const levelDiff = profile.level - req.level;
    if (levelDiff >= 0)
      total += 100; // Meets/exceeds requirement
    else total += Math.max(0, 100 + levelDiff * 20); // Penalize deficit
  }
  return total / requiredSkills.length;
}

// Location alignment (0-100)
function scoreLocation(
  profileLocation: { country: string; city: string; workMode: string; radiusKm: number },
  assignmentLocation: { country: string; city: string; locationMode: string; radiusKm: number }
): number {
  if (assignmentLocation.locationMode === 'remote') return 100;
  if (profileLocation.country !== assignmentLocation.country) return 0;

  // Calculate distance between cities (simplified)
  const distance = calculateDistance(profileLocation.city, assignmentLocation.city);
  const maxRadius = Math.min(profileLocation.radiusKm, assignmentLocation.radiusKm);

  if (distance <= maxRadius) return 100;
  return Math.max(0, 100 - ((distance - maxRadius) / maxRadius) * 50);
}
```

**Final Score Calculation**:

```typescript
const score =
  scoreValues * weights.values +
  scoreSkills * weights.coreExpertise +
  scoreTools * weights.tools +
  scoreLocation * weights.logistics +
  scoreRecency * weights.recency;
```

**Explainability**:

```typescript
const vector = {
  values: scoreValues,
  skills: scoreSkills,
  tools: scoreTools,
  location: scoreLocation,
  recency: scoreRecency,
  finalScore: score,
};

// Stored in matches.vector for "Why this match" UI
```

### 9.2 Verification Workflow Technical Details

**Email Verification Request**:

```typescript
// 1. Create verification request
const request = await db
  .insert(verificationRequests)
  .values({
    claimType: 'experience',
    claimId: experienceId,
    profileId: userId,
    verifierEmail: 'referee@company.com',
    verifierName: 'Jane Doe',
    verifierOrg: 'Acme Corp',
    token: generateSecureToken(), // crypto.randomBytes(32).toString('hex')
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  })
  .returning();

// 2. Send email
await sendVerificationEmail({
  to: 'referee@company.com',
  verifierName: 'Jane Doe',
  claimTitle: 'Senior Developer at Acme Corp',
  token: request.token,
});

// 3. Schedule nudges
await scheduleNudge(request.id, 48 * 60 * 60 * 1000); // 48 hours
await scheduleNudge(request.id, 7 * 24 * 60 * 60 * 1000); // 7 days
```

**Verifier Landing Page** (`/verify?token=...`):

```typescript
// 1. Validate token
const request = await db
  .select()
  .from(verificationRequests)
  .where(eq(verificationRequests.token, token))
  .limit(1);

if (!request || request.status !== 'pending') {
  return <InvalidTokenPage />;
}

if (new Date() > request.expiresAt) {
  await db
    .update(verificationRequests)
    .set({ status: 'expired' })
    .where(eq(verificationRequests.id, request.id));
  return <ExpiredTokenPage />;
}

// 2. Load claim details
const claim = await loadClaim(request.claimType, request.claimId);

// 3. Render verification form
return (
  <VerificationPage
    request={request}
    claim={claim}
    onSubmit={handleVerificationResponse}
  />
);
```

**Verifier Response**:

```typescript
async function handleVerificationResponse({
  requestId,
  responseType, // 'accept' | 'decline' | 'cannot_verify'
  reason, // Required for decline/cannot_verify
}: VerificationResponseInput) {
  // 1. Create response record
  await db.insert(verificationResponses).values({
    requestId,
    responseType,
    reason,
    verifierSeniority: calculateSeniority(verifierEmail), // From Expertise Atlas
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    respondedAt: new Date(),
  });

  // 2. Update request status
  await db
    .update(verificationRequests)
    .set({
      status: responseType === 'accept' ? 'accepted' : 'declined',
      respondedAt: new Date(),
    })
    .where(eq(verificationRequests.id, requestId));

  // 3. Update claim's verified field (if accepted)
  if (responseType === 'accept') {
    await updateClaimVerificationStatus(claimType, claimId, true);
  }

  // 4. Send confirmation email to user
  await sendVerificationResultEmail({
    to: userEmail,
    claimTitle,
    result: responseType,
  });

  // 5. Fire analytics event
  await trackAnalyticsEvent({
    eventType: 'verification_completed',
    userId,
    properties: { requestId, status: responseType },
  });
}
```

### 9.3 Database Migration Process

**Creating a Migration**:

```bash
# 1. Update schema in src/db/schema.ts
# 2. Generate migration SQL
npx drizzle-kit generate:pg

# 3. Review generated SQL in src/db/migrations/
# 4. Apply migration to local database
npx drizzle-kit push:pg

# 5. Test locally
npm run dev

# 6. Commit migration files
git add src/db/migrations/
git commit -m "feat: add verification system tables"
```

**Manual Migration** (for complex changes):

```bash
# 1. Create migration file manually
touch src/db/migrations/20250129_add_verification_messaging_moderation.sql

# 2. Write SQL (see existing migration for reference)
# 3. Apply to Supabase
# Go to Supabase Dashboard → SQL Editor → Run migration SQL
```

**Rollback Strategy**:

```sql
-- Always include DROP statements at top of migration
-- for easy rollback

DROP TABLE IF EXISTS verification_requests;
DROP TABLE IF EXISTS verification_responses;
DROP TABLE IF EXISTS verification_appeals;
-- ... etc

-- Then CREATE statements
CREATE TABLE verification_requests (...);
-- ... etc
```

### 9.4 Deployment Process

**Continuous Deployment** (via Vercel):

```
1. Developer pushes to GitHub branch
2. Vercel detects push
3. Vercel runs build:
   - npm install
   - npm run build (Next.js production build)
4. Vercel deploys to preview URL
5. Developer reviews preview
6. Developer merges to master
7. Vercel deploys to production (proofound.io)
```

**Environment Variables** (Vercel Dashboard):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`

**Build Command**: `npm run build`
**Output Directory**: `.next`
**Install Command**: `npm install`
**Development Command**: `npm run dev`

### 9.5 Rate Limiting Implementation

**Strategy**: Token bucket algorithm

**Limits** (PRD):

- 60 req/min per IP
- 120 req/min per user token (burst 2×)
- Stricter for auth endpoints (10 req/min)

**Implementation** (Middleware):

```typescript
// /src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? 'unknown';
  const route = request.nextUrl.pathname;
  const limitKey = `${ip}:${route}`;

  // Check rate limit
  const { allowed, remaining, resetAt } = await checkRateLimit(limitKey);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toString(),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  return response;
}

async function checkRateLimit(key: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const now = Date.now();

  // Query rate_limits table
  const limit = await db.select().from(rateLimits).where(eq(rateLimits.id, key)).limit(1);

  if (!limit || now > limit.resetAt.getTime()) {
    // First request or window expired → reset
    await db
      .insert(rateLimits)
      .values({
        id: key,
        attempts: 1,
        resetAt: new Date(now + RATE_LIMIT_WINDOW),
      })
      .onConflictDoUpdate({
        target: rateLimits.id,
        set: {
          attempts: 1,
          resetAt: new Date(now + RATE_LIMIT_WINDOW),
        },
      });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt: new Date(now + RATE_LIMIT_WINDOW),
    };
  }

  if (limit.attempts >= RATE_LIMIT_MAX_REQUESTS) {
    // Exceeded limit
    return {
      allowed: false,
      remaining: 0,
      resetAt: limit.resetAt,
    };
  }

  // Increment attempts
  await db
    .update(rateLimits)
    .set({ attempts: limit.attempts + 1 })
    .where(eq(rateLimits.id, key));

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - limit.attempts - 1,
    resetAt: limit.resetAt,
  };
}
```

---

## 10. Development Guidelines

### 10.1 Code Style & Conventions

**TypeScript**:

- Strict mode enabled (`"strict": true` in tsconfig.json)
- Explicit return types for functions
- Avoid `any` type (use `unknown` + type guards)

**Naming Conventions**:

- Components: PascalCase (e.g., `ProfileCard.tsx`)
- Functions: camelCase (e.g., `calculateScore`)
- Constants: UPPER_SNAKE_CASE (e.g., `RATE_LIMIT_MAX`)
- Database tables: snake_case (e.g., `verification_requests`)
- API routes: kebab-case (e.g., `/api/matching/suggest`)

**Component Structure**:

```typescript
'use client'; // Only if client component

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ProfileCardProps {
  profile: Profile;
  onEdit?: () => void;
}

export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Component content */}
    </div>
  );
}
```

**Server Actions**:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(profiles).set(data).where(eq(profiles.id, userId));

    revalidatePath('/app/i/profile');
    return { success: true };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}
```

### 10.2 Testing Strategy

**Current State**: Minimal tests (MVP focus)

**Future Testing Stack**:

- Unit tests: Vitest
- Integration tests: Playwright
- E2E tests: Playwright
- Component tests: React Testing Library

**Priority Test Coverage**:

1. **Matching algorithm** - Critical business logic
2. **Verification workflow** - Complex state machine
3. **Auth flows** - Security-critical
4. **API endpoints** - Contract testing

### 10.3 Error Handling

**Server-Side**:

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);

  // Log to monitoring service (future)
  // Sentry.captureException(error);

  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  };
}
```

**Client-Side**:

```typescript
const [error, setError] = useState<string | null>(null);

const handleSubmit = async () => {
  setError(null);

  try {
    const result = await serverAction();
    if (!result.success) {
      setError(result.error ?? 'Something went wrong');
      return;
    }
    // Success handling
  } catch (err) {
    setError('Failed to submit. Please try again.');
    console.error(err);
  }
};
```

### 10.4 Performance Best Practices

**Next.js Optimizations**:

- Use Server Components by default
- Add `'use client'` only when needed (interactivity, hooks)
- Use `loading.tsx` for Suspense boundaries
- Leverage route segment caching

**Database Queries**:

- Use indexes (see migration SQL for index definitions)
- Avoid N+1 queries (use JOINs)
- Limit result sets (`.limit()` clause)
- Use select-specific columns (not `SELECT *`)

**Example: Optimized Query**:

```typescript
// ❌ Bad: N+1 query
const profiles = await db.select().from(profiles);
for (const profile of profiles) {
  const skills = await db.select().from(skills).where(eq(skills.profileId, profile.id));
  // Process skills
}

// ✅ Good: JOIN
const profilesWithSkills = await db
  .select({
    profile: profiles,
    skills: skills,
  })
  .from(profiles)
  .leftJoin(skills, eq(profiles.id, skills.profileId));
```

**Image Optimization**:

- Use Next.js `<Image>` component
- Provide `width` and `height` attributes
- Use WebP format where possible
- Lazy load below-the-fold images

### 10.5 Accessibility Guidelines

**Semantic HTML**:

- Use `<button>` for clickable elements (not `<div onClick>`)
- Use `<label>` for form inputs
- Use heading hierarchy (`<h1>` → `<h2>` → `<h3>`)

**ARIA Attributes**:

- `aria-label` for icon-only buttons
- `aria-describedby` for error messages
- `aria-live` for dynamic updates

**Keyboard Navigation**:

- All interactive elements must be keyboard-accessible
- Focus visible (`:focus-visible` styles)
- Logical tab order

**Color Contrast**:

- WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
- Don't rely on color alone to convey information

### 10.6 Security Checklist

**Every Feature Must**:

- [ ] Use RLS policies (never bypass with service role unless necessary)
- [ ] Validate all user input (Zod schemas)
- [ ] Sanitize user-generated content (DOMPurify for rich text)
- [ ] Rate limit API endpoints
- [ ] Log security-relevant events (audit_logs table)
- [ ] Use HTTPS in production (automatic via Vercel)
- [ ] Set secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Implement CSRF protection (Next.js built-in)

**Sensitive Data Handling**:

- Never log passwords, tokens, or PII
- Mask sensitive data in UI (e.g., compensation ranges)
- Use environment variables for secrets (never commit to Git)
- Rotate API keys periodically

### 10.7 Git Workflow

**Branch Naming**:

- Features: `feat/description` (e.g., `feat/messaging-system`)
- Bugs: `fix/description` (e.g., `fix/auth-redirect`)
- Refactoring: `refactor/description`
- Documentation: `docs/description`

**Commit Messages** (Conventional Commits):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:

```
feat(verification): implement email workflow

- Add verification request creation
- Send email via Resend
- Schedule auto-nudges at 48h and 7d

Closes #123
```

```
fix(auth): redirect users to correct dashboard based on persona

Previously, all users were redirected to /app/i/home regardless
of their persona. Now queries profiles table and redirects
org_member to /app/o/{slug}/home.

Fixes #124
```

**Pull Requests**:

- Title: Same format as commit message
- Description: What, why, how
- Screenshots for UI changes
- Link to related issues

### 10.8 Documentation

**When to Document**:

- New features (add to this file)
- API changes (update API reference)
- Database schema changes (update Section 3)
- Configuration changes (update .env.example)

**Where to Document**:

- System architecture: This file (`SYSTEM_ARCHITECTURE_COMPREHENSIVE.md`)
- Implementation guides: `IMPLEMENTATION_GUIDE_MVP_SYSTEMS.md`
- PRD: `Proofound_PRD_MVP.md`
- Code comments: For complex business logic only (prefer self-documenting code)

---

## Appendix

### A. Related Documents

- **PRD**: `./Proofound_PRD_MVP.md`
- **Implementation Guide**: `./IMPLEMENTATION_GUIDE_MVP_SYSTEMS.md`
- **Migration SQL**: `./src/db/migrations/20250129_add_verification_messaging_moderation.sql`
- **Schema**: `./src/db/schema.ts`

### B. Quick Reference Links

| Resource                           | Location                                    |
| ---------------------------------- | ------------------------------------------- |
| **Database Schema**                | `src/db/schema.ts:1-846`                    |
| **Sign-In Component**              | `src/components/auth/SignIn.tsx:40-256`     |
| **Matching Algorithm**             | `src/lib/matching/algorithm.ts` (pending)   |
| **Verification Workflow**          | `IMPLEMENTATION_GUIDE_MVP_SYSTEMS.md:1-200` |
| **PRD Section 4.4 (Matching)**     | `Proofound_PRD_MVP.md:84-93`                |
| **PRD Section 4.5 (Verification)** | `Proofound_PRD_MVP.md:95-102`               |

### C. Glossary

| Term                 | Definition                                                               |
| -------------------- | ------------------------------------------------------------------------ |
| **Persona**          | User type: `individual`, `org_member`, or `unknown`                      |
| **Proof**            | Evidence for a claim (experience, education, volunteering, impact story) |
| **Claim**            | Statement requiring verification (e.g., "Worked at Acme Corp 2019-2022") |
| **Match**            | Computed alignment between individual and assignment (0-100 score)       |
| **Assignment**       | Job/project posting from organization                                    |
| **Expertise Atlas**  | Structured skills system with levels, evidence, endorsements             |
| **Capability**       | Skill wrapper with privacy controls and verification status              |
| **Evidence**         | Proof for a capability (document, link, assessment, credential)          |
| **Stage 1**          | Initial messaging phase with masked identities                           |
| **Stage 2**          | Post-mutual-accept messaging with full identity reveal                   |
| **RLS**              | Row-Level Security (PostgreSQL access control)                           |
| **Cluster Snapshot** | Private graph of active ties (private, algorithm use only)               |
| **Editorial Match**  | Manually curated match for cold-start problem                            |
| **North Star**       | Primary success metric: Time-to-First-Accepted Match                     |

### D. Common Tasks Quick Reference

**Add a new database table**:

1. Add table definition to `src/db/schema.ts`
2. Run `npx drizzle-kit generate:pg`
3. Review generated migration in `src/db/migrations/`
4. Apply: `npx drizzle-kit push:pg`

**Create a new API endpoint**:

1. Create file in `/src/app/api/[route]/route.ts`
2. Export `GET`, `POST`, `PATCH`, `DELETE` functions
3. Use `createServerSupabaseClient()` for auth
4. Return `NextResponse.json()` with data

**Add a new page**:

1. Create `page.tsx` in appropriate route folder
2. Add to appropriate section (`/app/i/*` or `/app/o/[slug]/*`)
3. Update navigation if needed

**Debug auth issues**:

1. Check Supabase dashboard → Authentication → Users
2. Inspect cookies in browser DevTools (supabase-auth-token)
3. Check RLS policies in Supabase → Database → Policies
4. Test with service role key (bypasses RLS)

---

**Document End**

For questions or updates, contact the development team or refer to the [GitHub repository](https://github.com/proofound/proofound).
