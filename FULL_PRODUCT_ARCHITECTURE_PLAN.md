# PROOFOUND FULL PRODUCT ARCHITECTURE PLAN

**Document Version**: 1.0
**Scope**: Complete Product Vision (MVP → Production → Scale)
**Timeline**: 18-24 months
**Last Updated**: 2025-10-30

---

## EXECUTIVE SUMMARY

This document outlines the complete technical architecture for Proofound from MVP through production scale, covering all features in the Full Product PRD.

### Phased Approach

```
MVP (Months 0-2)          → Beta Launch
Phase 1 (Months 3-6)      → Public Launch
Phase 2 (Months 7-12)     → Feature Complete
Phase 3 (Months 13-18)    → Scale & Optimize
Phase 4 (Months 19-24)    → Mobile + Advanced Features
```

### Architecture Evolution

| Component | MVP | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|-----------|-----|---------|---------|---------|---------|
| **Auth** | Email + OAuth | +MFA | +SSO/SAML | +SCIM | +Biometric |
| **Matching** | Rule-based | +Embeddings | +Learning weights | +Team matching | +AI scoring |
| **Database** | Supabase PG | +Indexes | +Partitioning | +Read replicas | +Sharding |
| **Search** | Keyword | +pgvector | +Typesense | +Elasticsearch | +Hybrid |
| **Storage** | Supabase | +CDN | +Image optimization | +Video support | +Geo-dist |
| **Real-time** | Polling | +Supabase RT | +WebSockets | +Kafka | +Edge compute |
| **Mobile** | Responsive web | +PWA | +React Native | +Native | +Offline-first |
| **Analytics** | Basic events | +Dashboard | +Funnels | +Cohorts | +ML insights |
| **AI** | None | +Embeddings | +Recommendations | +Insights | +Co-founder |

---

## TABLE OF CONTENTS

1. [MVP Architecture](#1-mvp-architecture-months-0-2)
2. [Phase 1: Public Launch](#2-phase-1-public-launch-months-3-6)
3. [Phase 2: Feature Complete](#3-phase-2-feature-complete-months-7-12)
4. [Phase 3: Scale](#4-phase-3-scale-months-13-18)
5. [Phase 4: Advanced Features](#5-phase-4-advanced-features-months-19-24)
6. [System Architecture Diagrams](#6-system-architecture-diagrams)
7. [Database Evolution](#7-database-evolution)
8. [API Architecture](#8-api-architecture)
9. [Security & Compliance](#9-security--compliance)
10. [Performance & Scaling](#10-performance--scaling)
11. [DevOps & Infrastructure](#11-devops--infrastructure)
12. [Monitoring & Observability](#12-monitoring--observability)

---

## 1. MVP ARCHITECTURE (Months 0-2)

*See `MVP_IMPLEMENTATION_PLAN.md` for detailed implementation.*

### 1.1 Tech Stack (MVP)

**Frontend**:
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS
- Radix UI
- React Query (optional)

**Backend**:
- Next.js API Routes
- Supabase (Postgres 15 + Auth + Storage)
- Drizzle ORM
- Resend (email)

**Infrastructure**:
- Vercel (hosting)
- Supabase (database + auth + storage)
- GitHub (code)
- Vercel Analytics (web vitals)

### 1.2 Database (MVP)

**Tables** (30+):
- Core: profiles, organizations, assignments
- Matching: matching_profiles, matches, skills
- Verification: verification_requests, verification_responses
- Messaging: conversations, messages
- Moderation: content_reports, moderation_actions
- Analytics: analytics_events

**Features**:
- Row-Level Security (RLS)
- Foreign key constraints
- Indexes on primary/foreign keys
- JSONB for flexible data

### 1.3 Matching Algorithm (MVP)

**Approach**: Rules-based multi-factor scoring

**Scoring Functions**:
```typescript
Total Score =
  0.55 * SkillScore +
  0.25 * MissionValuesScore +
  0.20 * PracticalFitScore
```

**No ML/AI in MVP** - deterministic, explainable

---

## 2. PHASE 1: PUBLIC LAUNCH (Months 3-6)

### 2.1 Goals

- Launch to public (no beta restrictions)
- Support 10,000+ users
- Add critical missing features
- Improve performance

### 2.2 New Features

#### 2.2.1 Advanced Matching

**Semantic Search with pgvector**:
```sql
-- Enable extension
CREATE EXTENSION vector;

-- Add embedding columns
ALTER TABLE matching_profiles
  ADD COLUMN mission_embedding vector(384),
  ADD COLUMN vision_embedding vector(384);

ALTER TABLE assignments
  ADD COLUMN mission_embedding vector(384),
  ADD COLUMN vision_embedding vector(384);

-- Create HNSW index for fast ANN search
CREATE INDEX idx_matching_profiles_mission_embedding
  ON matching_profiles USING hnsw (mission_embedding vector_cosine_ops);
```

**Two-Stage Matching**:
1. Stage 1 (ANN): Fetch Top-500 via vector similarity
2. Stage 2 (Re-rank): Precise multi-factor scoring

**Implementation**:
```typescript
// /src/lib/matching/semantic.ts

import { pipeline } from '@xenova/transformers';

// Load embedding model (run once at startup)
const embedder = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

export async function generateEmbedding(text: string): Promise<number[]> {
  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data);
}

// Pre-compute embeddings for all profiles/assignments
export async function precomputeEmbeddings() {
  const supabase = createAdminClient();

  // Fetch all profiles without embeddings
  const { data: profiles } = await supabase
    .from('matching_profiles')
    .select('id, mission, vision')
    .is('mission_embedding', null);

  for (const profile of profiles) {
    const missionEmb = await generateEmbedding(profile.mission);
    const visionEmb = await generateEmbedding(profile.vision);

    await supabase
      .from('matching_profiles')
      .update({
        mission_embedding: missionEmb,
        vision_embedding: visionEmb,
      })
      .eq('id', profile.id);
  }
}

// Matching with ANN
export async function matchWithSemanticSearch(assignmentId: string) {
  const supabase = createAdminClient();

  // Get assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  // Stage 1: ANN retrieval (Top-500)
  const { data: candidates } = await supabase.rpc('match_profiles_vector', {
    query_embedding: assignment.mission_embedding,
    match_threshold: 0.5,
    match_count: 500,
  });

  // Stage 2: Precise re-ranking
  const results = [];
  for (const candidate of candidates) {
    const score = await computePreciseScore(assignment, candidate);
    results.push({ candidate, score });
  }

  // Sort and return Top-20
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20);
}
```

**SQL Function for Vector Search**:
```sql
-- /supabase/migrations/20250315_vector_search.sql

CREATE OR REPLACE FUNCTION match_profiles_vector(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  profile_id uuid,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    id AS profile_id,
    1 - (mission_embedding <=> query_embedding) AS similarity
  FROM matching_profiles
  WHERE 1 - (mission_embedding <=> query_embedding) > match_threshold
  ORDER BY mission_embedding <=> query_embedding
  LIMIT match_count;
$$;
```

#### 2.2.2 MFA (Multi-Factor Authentication)

**Implementation**:
```typescript
// Use Supabase Auth MFA
// https://supabase.com/docs/guides/auth/auth-mfa

import { createClient } from '@/lib/supabase/client';

// Enroll MFA
export async function enrollMFA() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });

  if (error) throw error;

  // Show QR code to user
  return {
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

// Verify MFA
export async function verifyMFA(code: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.challenge({
    factorId: '<factor_id>',
  });

  const { data: verified, error: verifyError } = await supabase.auth.mfa.verify({
    factorId: data.id,
    challengeId: data.challenge_id,
    code,
  });

  return verified;
}
```

#### 2.2.3 Real-time Messaging (Supabase Realtime)

Replace polling with WebSocket subscriptions:

```typescript
// /src/components/messaging/ConversationDetail.tsx

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ConversationDetail({ conversationId }) {
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Add new message to state
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // ...
}
```

#### 2.2.4 Advanced Analytics Dashboard

**Tools**: Add Metabase or build custom dashboard

```typescript
// /src/app/admin/analytics/page.tsx

export default async function AnalyticsDashboard() {
  const supabase = createAdminClient();

  // North Star Metric: Time-to-First-Accepted-Match
  const { data: matches } = await supabase.rpc('calculate_time_to_first_match');

  // Profile Completion Rate
  const { data: completion } = await supabase.rpc('profile_completion_rate');

  // Match Acceptance Rate
  const { data: acceptance } = await supabase.rpc('match_acceptance_rate');

  return (
    <Dashboard>
      <MetricCard
        title="Time to First Match"
        value={`${matches.median_hours}h`}
        trend="down"
        target="<24h"
      />
      <MetricCard
        title="Profile Completion D+1"
        value={`${completion.rate}%`}
        trend="up"
        target="≥60%"
      />
      {/* More metrics... */}
    </Dashboard>
  );
}
```

**SQL Functions**:
```sql
-- Calculate time to first accepted match (median)
CREATE OR REPLACE FUNCTION calculate_time_to_first_match()
RETURNS TABLE (median_hours float)
LANGUAGE sql
AS $$
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY time_diff) AS median_hours
  FROM (
    SELECT
      EXTRACT(EPOCH FROM (mi.created_at - mp.created_at)) / 3600 AS time_diff
    FROM match_interest mi
    JOIN matching_profiles mp ON mp.profile_id = mi.actor_profile_id
    WHERE mi.created_at = (
      SELECT MIN(created_at)
      FROM match_interest
      WHERE actor_profile_id = mi.actor_profile_id
    )
  ) AS first_matches;
$$;
```

### 2.3 Infrastructure Upgrades

**Database**:
- Add advanced indexes (see Section 7)
- Connection pooling (PgBouncer via Supabase)
- Query optimization

**Caching**:
```typescript
// Add React Query for client-side caching
import { useQuery } from '@tanstack/react-query';

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**CDN**:
- Enable Vercel Edge Network (automatic)
- Add `Cache-Control` headers for static assets

### 2.4 Performance Targets (Phase 1)

```
LCP:              < 2.5s  (P75)
INP:              < 200ms (P75)
CLS:              < 0.1
API Read:         < 800ms (P95)
API Write:        < 1200ms (P95)
Matching Compute: < 3s    (P95)
Uptime:           99.9%
```

---

## 3. PHASE 2: FEATURE COMPLETE (Months 7-12)

### 3.1 Goals

- Implement all PRD "Target State" features
- Support 50,000+ users
- Advanced matching with ML
- Mobile PWA

### 3.2 New Features

#### 3.2.1 Learning-to-Rank Matching

**Problem**: Static weights don't capture user preferences

**Solution**: Train pairwise LTR model on feedback

```python
# /ml/ltr_training.py

import xgboost as xgb
import numpy as np

# Fetch training data from database
# Format: [user_id, assignment_id, features[], label (0=reject, 1=accept)]

def fetch_training_data():
    # SQL query to get historical matches with outcomes
    query = """
    SELECT
      m.profile_id,
      m.assignment_id,
      m.score_values,
      m.score_causes,
      m.score_skills,
      m.score_location,
      m.score_comp,
      CASE
        WHEN mi.id IS NOT NULL THEN 1  -- Accepted
        ELSE 0                          -- Rejected/Ignored
      END AS label
    FROM matches m
    LEFT JOIN match_interest mi ON mi.match_id = m.id
    WHERE m.created_at > NOW() - INTERVAL '90 days'
    """
    # Execute and return DataFrame

def train_ltr_model(data):
    X = data[['score_values', 'score_causes', 'score_skills', 'score_location', 'score_comp']]
    y = data['label']
    groups = data.groupby('profile_id').size().values

    dtrain = xgb.DMatrix(X, label=y)
    dtrain.set_group(groups)

    params = {
        'objective': 'rank:pairwise',
        'eta': 0.1,
        'max_depth': 6,
    }

    model = xgb.train(params, dtrain, num_boost_round=100)
    return model

# Deploy model as API endpoint
```

**Integration**:
```typescript
// /src/lib/matching/ltr.ts

export async function rerankWithLTR(candidates: Candidate[], features: Features[]) {
  // Call Python ML API
  const response = await fetch('https://ml.proofound.io/rank', {
    method: 'POST',
    body: JSON.stringify({ candidates, features }),
  });

  const { ranked_ids } = await response.json();
  return ranked_ids;
}
```

#### 3.2.2 10,000+ Skills Taxonomy

**Structure**: Hierarchical L1→L2→L3→L4

```typescript
// /src/lib/taxonomy/hierarchical.ts

export interface Skill {
  code: string; // "01.03.142.001"
  l1: string; // "01" - Engineering
  l2: string; // "03" - Backend
  l3: string; // "142" - Databases
  l4: string; // "001" - PostgreSQL
  name: string;
  aliases: string[];
  description: string;
  level_rubric: {
    1: string; // "Basic SQL queries"
    2: string; // "Joins, aggregations"
    3: string; // "Indexing, optimization"
    4: string; // "Replication, sharding"
    5: string; // "Expert, custom extensions"
  };
  adjacent_skills: string[]; // ["01.03.142.002", "01.03.142.003"]
  prerequisites: string[];
  related_tools: string[];
}

// Load from JSON file or database
export async function loadSkillsTaxonomy(): Promise<Skill[]> {
  // Fetch from /data/skills_taxonomy.json
  // Or from database table
}

// Adjacency graph for "near-skill" matching
export function getAdjacentSkills(skillCode: string, maxDistance = 2): string[] {
  // BFS through taxonomy tree
  // Return skills within maxDistance hops
}
```

**Migration Plan**:
1. Build taxonomy in spreadsheet (weeks)
2. Convert to JSON/database
3. Import to database
4. Update matching algorithm to use adjacency

#### 3.2.3 Team/Project Matching

**Use Case**: Match entire teams to projects

```typescript
// /src/lib/matching/team.ts

export interface TeamRequirement {
  roles: Array<{
    title: string;
    count: number;
    skills: Skill[];
  }>;
  teamSize: { min: number; max: number };
  diversity?: {
    skillOverlap: { min: number; max: number }; // % overlap
    geographicDistribution: boolean;
  };
}

export async function matchTeam(
  requirement: TeamRequirement
): Promise<Team[]> {
  // 1. Find candidates for each role
  const roleCandidates = await Promise.all(
    requirement.roles.map((role) => matchRole(role))
  );

  // 2. Generate team combinations
  const teams = generateTeamCombinations(roleCandidates, requirement.teamSize);

  // 3. Score teams on:
  //    - Skill coverage (union of skills)
  //    - Diversity (skill overlap, location, etc.)
  //    - Collaboration potential (past co-work)
  const scoredTeams = teams.map((team) => ({
    team,
    score: scoreTeam(team, requirement),
  }));

  // 4. Return top teams
  return scoredTeams.sort((a, b) => b.score - a.score).slice(0, 10);
}
```

#### 3.2.4 Progressive Web App (PWA)

```json
// /public/manifest.json
{
  "name": "Proofound",
  "short_name": "Proofound",
  "description": "Proof-based professional network",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#5469d4",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

```typescript
// /src/app/layout.tsx - Add PWA meta tags
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#5469d4',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Proofound',
  },
};
```

```typescript
// /src/lib/service-worker.ts - Offline support
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('proofound-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/app/i/home',
        '/app/i/profile',
        // Add offline pages
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 3.3 Infrastructure Upgrades (Phase 2)

**Database**:
- Add read replicas for reporting queries
- Partition large tables (analytics_events, messages)
- Implement archival strategy

**Caching**:
- Add Redis for session storage
- Cache matching results (5-minute TTL)
- Cache taxonomy data

**Search**:
- Add Typesense for full-text search
- Index profiles, assignments, skills

---

## 4. PHASE 3: SCALE (Months 13-18)

### 4.1 Goals

- Support 500,000+ users
- Global deployment
- Sub-second matching
- 99.99% uptime

### 4.2 Infrastructure Evolution

#### 4.2.1 Database Sharding

**Strategy**: Shard by user_id hash

```sql
-- Shard 1: user_id hash % 4 = 0
-- Shard 2: user_id hash % 4 = 1
-- Shard 3: user_id hash % 4 = 2
-- Shard 4: user_id hash % 4 = 3

-- Routing logic in application
function getShardForUser(userId: string): string {
  const hash = hashCode(userId);
  const shardId = hash % 4;
  return `shard_${shardId}`;
}
```

#### 4.2.2 Kafka for Event Streaming

**Use Cases**:
- Analytics events
- Match computations (async)
- Email notifications
- Real-time dashboards

```typescript
// /src/lib/kafka/producer.ts

import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'proofound',
  brokers: ['kafka-1:9092', 'kafka-2:9092', 'kafka-3:9092'],
});

const producer = kafka.producer();

export async function publishEvent(topic: string, event: any) {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(event) }],
  });
}

// Usage
await publishEvent('analytics.events', {
  type: 'match_accepted',
  userId,
  matchId,
  timestamp: new Date().toISOString(),
});
```

#### 4.2.3 Elasticsearch for Advanced Search

```typescript
// /src/lib/search/elasticsearch.ts

import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'https://elasticsearch.proofound.io' });

// Index profile
export async function indexProfile(profile: Profile) {
  await client.index({
    index: 'profiles',
    id: profile.id,
    document: {
      display_name: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      skills: profile.skills,
      values: profile.values,
      causes: profile.causes,
      location: profile.location,
    },
  });
}

// Search
export async function searchProfiles(query: string, filters: any) {
  const result = await client.search({
    index: 'profiles',
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['display_name^3', 'headline^2', 'bio', 'skills'],
            },
          },
        ],
        filter: [
          { terms: { skills: filters.skills } },
          { terms: { values: filters.values } },
        ],
      },
    },
  });

  return result.hits.hits.map((hit) => hit._source);
}
```

### 4.3 Performance Optimizations

**Database**:
- Materialized views for expensive queries
- Query result caching (Redis)
- Connection pooling (PgBouncer)

**API**:
- GraphQL for flexible queries (optional)
- API rate limiting per tier
- Response compression (gzip)

**Frontend**:
- Code splitting (automatic in Next.js)
- Image optimization (next/image)
- Lazy loading
- Incremental Static Regeneration (ISR)

### 4.4 Monitoring & Alerting

**Tools**:
- Datadog (infrastructure monitoring)
- Sentry (error tracking)
- PagerDuty (on-call)
- Custom dashboards (Grafana)

**Alerts**:
```yaml
# alerts.yaml
- name: High API latency
  condition: p95_latency > 1000ms for 5 minutes
  severity: warning
  notify: #engineering

- name: Error rate spike
  condition: error_rate > 5% for 2 minutes
  severity: critical
  notify: #on-call

- name: Database CPU high
  condition: db_cpu > 80% for 10 minutes
  severity: warning
  notify: #infrastructure
```

---

## 5. PHASE 4: ADVANCED FEATURES (Months 19-24)

### 5.1 Native Mobile Apps

**Tech Stack**:
- React Native
- Expo
- TypeScript
- React Navigation
- Reanimated

**Features**:
- Push notifications
- Biometric auth
- Offline-first architecture
- Camera for document upload
- Location services

### 5.2 AI Co-founder

**Capabilities**:
- Profile optimization suggestions
- Match explanation & improvement tips
- Career path recommendations
- Skill gap analysis
- Personalized learning plans

```typescript
// /src/lib/ai/cofounder.ts

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeProfile(profile: Profile) {
  const prompt = `
You are the Proofound AI Co-founder. Analyze this profile and provide:
1. Strengths (3-5 points)
2. Gaps (2-3 areas to improve)
3. Suggested skills to add (3-5 skills)
4. Profile optimization tips (2-3 tips)

Profile:
${JSON.stringify(profile, null, 2)}

Format as JSON.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### 5.3 Video Calls

**Integration**: Daily.co or Vonage Video API

```typescript
// /src/lib/video/daily.ts

import DailyIframe from '@daily-co/daily-js';

export async function createVideoRoom(conversationId: string) {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: conversationId,
      privacy: 'private',
      properties: {
        max_participants: 2,
        enable_screenshare: true,
        enable_chat: false,
      },
    }),
  });

  const room = await response.json();
  return room.url;
}

export function initializeVideoCall(roomUrl: string) {
  const callFrame = DailyIframe.createFrame({
    url: roomUrl,
    showLeaveButton: true,
    iframeStyle: {
      width: '100%',
      height: '100%',
      border: 0,
    },
  });

  return callFrame;
}
```

### 5.4 Payments & Contracts

**Integration**: Stripe Connect

```typescript
// /src/lib/payments/stripe.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Connect account for org
export async function createConnectAccount(orgId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  // Save account.id to organization record
  return account;
}

// Create payment for assignment
export async function createPayment(
  amount: number,
  currency: string,
  orgAccountId: string,
  description: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency,
    description,
    transfer_data: {
      destination: orgAccountId,
    },
    application_fee_amount: Math.round(amount * 0.05 * 100), // 5% platform fee
  });

  return paymentIntent;
}

// Milestone-based escrow
export async function createEscrow(assignmentId: string, milestones: Milestone[]) {
  // Create payment intent with on_behalf_of
  // Hold funds until milestone approved
  // Release when approved
}
```

---

## 6. SYSTEM ARCHITECTURE DIAGRAMS

### 6.1 MVP Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  API Routes  │  │  Components  │      │
│  │  (App Router)│  │  (Matching,  │  │   (React)    │      │
│  │              │  │  Verif, Msg) │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────┬──────────────────┬──────────────────┬──────────────────┘
     │                  │                  │
     ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  SUPABASE   │  │   RESEND    │  │   VERCEL    │
│             │  │             │  │             │
│ • Postgres  │  │ • Email     │  │ • Hosting   │
│ • Auth      │  │   Sending   │  │ • Analytics │
│ • Storage   │  │             │  │ • Edge      │
│ • Realtime  │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 6.2 Phase 3 Architecture (Scale)

```
┌────────────────────────────────────────────────────────────┐
│                      USERS (Global)                        │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│               CLOUDFLARE CDN (Global)                      │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│            VERCEL EDGE NETWORK (Multi-region)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  US-East     │  │   EU-West    │  │   AP-South   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────┬──────────────────┬──────────────────┬─────────────────┘
     │                  │                  │
     ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Matching    │  │   GraphQL    │  │  WebSockets  │      │
│  │   Service    │  │     API      │  │   (Messages) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────┬──────────────────┬──────────────────┬──────────────────┘
     │                  │                  │
     ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  DATABASE   │  │   REDIS     │  │   KAFKA     │
│  (Sharded)  │  │  (Cache)    │  │  (Events)   │
│             │  │             │  │             │
│ • Master    │  │ • Sessions  │  │ • Analytics │
│ • Replica 1 │  │ • Matches   │  │ • Matching  │
│ • Replica 2 │  │ • Profile   │  │ • Emails    │
│ • Replica 3 │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
       │
       ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ELASTICSEARCH│  │  S3/CDN     │  │   ML API    │
│ (Search)    │  │  (Storage)  │  │  (Ranking)  │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 7. DATABASE EVOLUTION

### 7.1 MVP → Phase 1: Add Indexes

```sql
-- Matching queries
CREATE INDEX idx_matching_profiles_available
  ON matching_profiles (availability_earliest, availability_latest)
  WHERE availability_earliest IS NOT NULL;

CREATE INDEX idx_assignments_active_created
  ON assignments (status, created_at DESC)
  WHERE status = 'active';

CREATE INDEX idx_skills_profile_skill
  ON skills (profile_id, skill_id, level);

-- Verification queries
CREATE INDEX idx_verification_requests_pending
  ON verification_requests (status, sent_at)
  WHERE status = 'pending';

-- Messaging queries
CREATE INDEX idx_conversations_participant
  ON conversations (participant_one_id, participant_two_id, updated_at DESC);

CREATE INDEX idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

-- Analytics queries
CREATE INDEX idx_analytics_events_type_created
  ON analytics_events (event_type, created_at DESC);

-- Array searches (GIN indexes)
CREATE INDEX idx_matching_profiles_values_gin
  ON matching_profiles USING GIN (values_tags);

CREATE INDEX idx_matching_profiles_causes_gin
  ON matching_profiles USING GIN (cause_tags);

CREATE INDEX idx_individual_profiles_causes_gin
  ON individual_profiles USING GIN (causes);
```

### 7.2 Phase 2: Partitioning

**Partition large tables by time**:

```sql
-- Partition analytics_events by month
CREATE TABLE analytics_events_2025_03
  PARTITION OF analytics_events
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE analytics_events_2025_04
  PARTITION OF analytics_events
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

-- Partition messages by conversation and time
CREATE TABLE messages_partitioned (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE messages_2025_q1
  PARTITION OF messages_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
```

### 7.3 Phase 3: Read Replicas

```typescript
// /src/lib/database/connections.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Master (writes)
const masterClient = postgres(process.env.DATABASE_URL_MASTER);
export const masterDb = drizzle(masterClient);

// Replica 1 (reads)
const replica1Client = postgres(process.env.DATABASE_URL_REPLICA_1);
export const replica1Db = drizzle(replica1Client);

// Load balancer for reads
export function getReadDb(): typeof masterDb {
  const replicas = [replica1Db, /* replica2Db, replica3Db */];
  const randomIndex = Math.floor(Math.random() * replicas.length);
  return replicas[randomIndex];
}

// Usage
const db = getReadDb(); // Use replica for reads
const writeDb = masterDb; // Use master for writes

// Example
export async function fetchProfile(userId: string) {
  const db = getReadDb(); // Read from replica
  return db.query.profiles.findFirst({ where: eq(profiles.id, userId) });
}

export async function updateProfile(userId: string, data: any) {
  const db = masterDb; // Write to master
  return db.update(profiles).set(data).where(eq(profiles.id, userId));
}
```

---

## 8. API ARCHITECTURE

### 8.1 REST API (MVP)

Current structure - continue using for MVP and Phase 1.

### 8.2 GraphQL API (Phase 2+)

**Advantages**:
- Flexible queries (fetch exactly what you need)
- Reduced over-fetching
- Type-safe with codegen
- Better for complex data relationships

**Implementation**:

```typescript
// /src/graphql/schema.ts

import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
  type Profile {
    id: ID!
    displayName: String!
    headline: String
    bio: String
    skills: [Skill!]!
    values: [String!]!
    causes: [String!]!
    verifiedAt: DateTime
  }

  type Skill {
    code: String!
    level: Int!
    monthsExperience: Int
    evidence: [Evidence!]!
  }

  type Evidence {
    id: ID!
    type: String!
    url: String
    description: String
    verified: Boolean!
  }

  type Assignment {
    id: ID!
    title: String!
    description: String!
    organization: Organization!
    mustHaveSkills: [Skill!]!
    niceToHaveSkills: [Skill!]!
    status: String!
  }

  type Match {
    id: ID!
    assignment: Assignment!
    profile: Profile!
    score: Float!
    subscores: MatchSubscores!
    explanation: String!
  }

  type MatchSubscores {
    skills: Float!
    values: Float!
    location: Float!
    compensation: Float!
  }

  type Query {
    me: Profile!
    profile(id: ID!): Profile
    matches(first: Int, after: String): MatchConnection!
    assignment(id: ID!): Assignment
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): Profile!
    createAssignment(input: CreateAssignmentInput!): Assignment!
    acceptMatch(matchId: ID!): Match!
  }

  type Subscription {
    newMessage(conversationId: ID!): Message!
    newMatch: Match!
  }
`;

const resolvers = {
  Query: {
    me: async (_, __, context) => {
      return context.db.query.profiles.findFirst({
        where: eq(profiles.id, context.user.id),
      });
    },
    matches: async (_, { first = 20, after }, context) => {
      return fetchMatches(context.user.id, first, after);
    },
  },
  Mutation: {
    acceptMatch: async (_, { matchId }, context) => {
      return recordMatchInterest(matchId, context.user.id);
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
```

**GraphQL Server**:

```typescript
// /src/app/api/graphql/route.ts

import { createYoga } from 'graphql-yoga';
import { schema } from '@/graphql/schema';
import { createClient } from '@/lib/supabase/server';

const { handleRequest } = createYoga({
  schema,
  context: async ({ request }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return {
      user,
      db: /* drizzle instance */,
      supabase,
    };
  },
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Request, Response },
});

export { handleRequest as GET, handleRequest as POST };
```

---

## 9. SECURITY & COMPLIANCE

### 9.1 Authentication Evolution

| Phase | Features |
|-------|----------|
| MVP | Email + Google + LinkedIn OAuth |
| Phase 1 | +MFA (TOTP) |
| Phase 2 | +SSO (SAML/OIDC) for enterprise |
| Phase 3 | +SCIM provisioning |
| Phase 4 | +Biometric (mobile apps) |

### 9.2 Authorization (RLS Evolution)

**MVP**: Row-Level Security on all tables

**Phase 2**: Add role-based policies

```sql
-- Example: Organization admin can manage members
CREATE POLICY "Org admins can manage members"
  ON organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );
```

**Phase 3**: Add attribute-based access control (ABAC)

```sql
-- Example: Only verified users can create assignments
CREATE POLICY "Verified users can create assignments"
  ON assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND verified = true
    )
  );
```

### 9.3 Data Privacy (GDPR, CCPA)

**Compliance Features**:
- ✅ Data export (JSON)
- ✅ Data deletion (soft delete + purge)
- ✅ Consent management
- ✅ Audit logs (2-year retention)
- ⚠️ Data residency (Phase 3)

**Phase 3: Data Residency**:

```typescript
// /src/lib/database/regions.ts

export function getDatabaseForRegion(region: 'eu' | 'us' | 'ap') {
  switch (region) {
    case 'eu':
      return postgres(process.env.DATABASE_URL_EU);
    case 'us':
      return postgres(process.env.DATABASE_URL_US);
    case 'ap':
      return postgres(process.env.DATABASE_URL_AP);
  }
}

// User metadata includes preferred region
const db = getDatabaseForRegion(user.metadata.region);
```

### 9.4 Security Audits

**Schedule**:
- MVP: Pre-launch security review (1 day)
- Phase 1: Quarterly penetration testing
- Phase 2: Annual SOC 2 audit prep
- Phase 3: SOC 2 Type II certification

---

## 10. PERFORMANCE & SCALING

### 10.1 Performance Targets by Phase

| Metric | MVP | Phase 1 | Phase 2 | Phase 3 |
|--------|-----|---------|---------|---------|
| **LCP** | <2.5s | <2.0s | <1.5s | <1.0s |
| **API P95** | <1.2s | <800ms | <500ms | <300ms |
| **Matching** | <5s | <3s | <2s | <1s |
| **Uptime** | 99.5% | 99.9% | 99.95% | 99.99% |
| **Users** | 1K | 10K | 50K | 500K |

### 10.2 Caching Strategy

**Layer 1: Browser Cache**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
      ]
    }];
  }
};
```

**Layer 2: CDN Cache (Vercel)**
```typescript
// Automatic with ISR
export const revalidate = 3600; // 1 hour
```

**Layer 3: Application Cache (Redis)**
```typescript
// /src/lib/cache.ts

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage
const profile = await getCached(
  `profile:${userId}`,
  () => fetchProfileFromDB(userId),
  600 // 10 minutes
);
```

**Layer 4: Database Query Cache**
```sql
-- Materialized views for expensive queries
CREATE MATERIALIZED VIEW user_match_stats AS
SELECT
  profile_id,
  COUNT(*) AS total_matches,
  AVG(score) AS avg_score,
  MAX(created_at) AS last_match_at
FROM matches
GROUP BY profile_id;

CREATE INDEX idx_user_match_stats_profile ON user_match_stats(profile_id);

-- Refresh daily
REFRESH MATERIALIZED VIEW CONCURRENTLY user_match_stats;
```

### 10.3 Load Testing

**Tools**: k6, Artillery

```javascript
// /load-tests/matching-api.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp to 100 users
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 200 }, // Ramp to 200
    { duration: '5m', target: 200 }, // Stay at 200
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% < 1s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const res = http.post(
    'https://proofound.io/api/match/profile',
    JSON.stringify({ mode: 'balanced', k: 20 }),
    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${__ENV.AUTH_TOKEN}` } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

---

## 11. DEVOPS & INFRASTRUCTURE

### 11.1 CI/CD Pipeline

```yaml
# /.github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 11.2 Infrastructure as Code

**Terraform for Supabase + Services**:

```hcl
# /terraform/main.tf

terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

resource "supabase_project" "proofound" {
  name   = "proofound"
  region = "us-east-1"

  database_password = var.database_password
  jwt_secret        = var.jwt_secret

  settings {
    enable_storage  = true
    enable_realtime = true
  }
}

resource "supabase_bucket" "proofs" {
  project_id = supabase_project.proofound.id
  name       = "proofs"
  public     = false
  file_size_limit = 5242880 # 5MB
}
```

### 11.3 Monitoring Stack

**Services**:
- Vercel Analytics (web vitals)
- Supabase Dashboard (database metrics)
- Sentry (errors)
- Datadog (Phase 3, full stack)

**Custom Metrics**:

```typescript
// /src/lib/metrics.ts

import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('proofound');

export const matchingDuration = meter.createHistogram('matching.duration', {
  description: 'Time to compute matches',
  unit: 'ms',
});

export const matchingResults = meter.createCounter('matching.results', {
  description: 'Number of matches computed',
});

// Usage
const start = Date.now();
const matches = await computeMatches(profileId);
matchingDuration.record(Date.now() - start);
matchingResults.add(matches.length);
```

---

## 12. MONITORING & OBSERVABILITY

### 12.1 Logging

**Structured Logging**:

```typescript
// /src/lib/log.ts

import pino from 'pino';

export const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Usage
log.info({ userId, matchId }, 'Match computed');
log.error({ error: err.message, stack: err.stack }, 'Failed to send email');
```

**Log Aggregation** (Phase 3):
- Send logs to Datadog, CloudWatch, or Elasticsearch
- Set up alerts on error patterns

### 12.2 Tracing (Phase 3)

**OpenTelemetry**:

```typescript
// /src/lib/tracing.ts

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

// Traces automatically sent to Datadog, Jaeger, etc.
```

---

## CONCLUSION

This Full Product Architecture Plan provides a complete technical roadmap for Proofound from MVP through advanced features and scale.

### Key Takeaways

1. **Phased Approach**: Build iteratively, validate, then scale
2. **Pragmatic Choices**: Start simple (keyword matching), add complexity as needed (ML/AI)
3. **Infrastructure Evolution**: Monolith → Microservices → Distributed systems as you grow
4. **Focus on Fundamentals**: Security, performance, reliability before advanced features

### Success Metrics by Phase

**MVP (Month 2)**:
- ✅ 1,000 users
- ✅ Core flows working
- ✅ 99.5% uptime

**Phase 1 (Month 6)**:
- ✅ 10,000 users
- ✅ Semantic matching
- ✅ 99.9% uptime

**Phase 2 (Month 12)**:
- ✅ 50,000 users
- ✅ All PRD features
- ✅ PWA launched

**Phase 3 (Month 18)**:
- ✅ 500,000 users
- ✅ Global deployment
- ✅ 99.99% uptime

**Phase 4 (Month 24)**:
- ✅ 1M+ users
- ✅ Native mobile apps
- ✅ AI Co-founder launched

---

**Next Steps**:
1. Execute MVP (see `MVP_IMPLEMENTATION_PLAN.md`)
2. Launch beta & gather feedback
3. Iterate towards Phase 1
4. Continue phased rollout

---

*For immediate action items, see:*
- `MVP_IMPLEMENTATION_PLAN.md` - 8-week execution plan
- `CRITICAL_GAPS_IMPLEMENTATION_GUIDE.md` - Step-by-step guides
- `CODEBASE_AUDIT_REPORT.md` - Current state analysis

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-10-30
**Maintained By**: Engineering Team
