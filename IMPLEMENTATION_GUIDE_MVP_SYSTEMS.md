# Implementation Guide: Verification, Messaging & Moderation Systems

**Date:** 2025-01-29
**Status:** Ready for Implementation
**Priority:** High (Required for MVP Launch)

---

## 📋 Table of Contents

1. [Migration Setup](#migration-setup)
2. [Verification System Implementation](#verification-system-implementation)
3. [Messaging System Implementation](#messaging-system-implementation)
4. [Moderation System Implementation](#moderation-system-implementation)
5. [Analytics Integration](#analytics-integration)
6. [Testing Checklist](#testing-checklist)
7. [API Endpoints Reference](#api-endpoints-reference)

---

## 🚀 Migration Setup

### Step 1: Apply the Database Migration

```bash
# If using Supabase CLI
supabase db push --include-all

# Or apply the migration SQL directly
psql $DATABASE_URL < src/db/migrations/20250129_add_verification_messaging_moderation.sql
```

### Step 2: Verify Tables Created

```sql
-- Check that all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'verification_requests',
    'verification_responses',
    'conversations',
    'messages',
    'content_reports',
    'moderation_actions',
    'analytics_events'
);
```

### Step 3: Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE '%verification%'
   OR tablename LIKE '%message%'
   OR tablename LIKE '%report%';
```

---

## 🔐 Verification System Implementation

### Overview

The verification system allows users to request proof validation from referees (former employers, peers, etc.) via email.

### Workflow

```
User → Request Verification → Email Sent → Referee Clicks Link →
Accept/Decline/Cannot Verify → Status Updated → (Optional) Appeal
```

### Implementation Steps

#### 1. Create Verification Request API

**File:** `src/app/api/verification/request/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { claimType, claimId, verifierEmail, verifierName, verifierOrg } = body;

  // Generate unique token
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  // Create verification request
  const { data: verificationRequest, error } = await supabase
    .from('verification_requests')
    .insert({
      claim_type: claimType,
      claim_id: claimId,
      profile_id: user.id,
      verifier_email: verifierEmail,
      verifier_name: verifierName,
      verifier_org: verifierOrg,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send verification email
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify/${token}`;

  await resend.emails.send({
    from: 'Proofound <verify@proofound.com>',
    to: verifierEmail,
    subject: 'Verification Request from Proofound',
    html: `
      <h2>Verification Request</h2>
      <p>Hi ${verifierName || 'there'},</p>
      <p>Someone has listed you as a reference to verify their professional experience on Proofound.</p>
      <p><a href="${verificationUrl}">Click here to review and verify</a></p>
      <p>This link expires in 14 days.</p>
    `,
  });

  return NextResponse.json({ success: true, requestId: verificationRequest.id });
}
```

#### 2. Create Verification Response Page

**File:** `src/app/verify/[token]/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [request, setRequest] = useState(null);
  const [responseType, setResponseType] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Fetch verification request details
    fetch(`/api/verification/request/${token}`)
      .then(res => res.json())
      .then(data => setRequest(data));
  }, [token]);

  const handleSubmit = async () => {
    await fetch('/api/verification/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        responseType,
        reason,
      }),
    });

    router.push('/verify/thank-you');
  };

  if (!request) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>Verification Request</h1>
      {/* Display claim details */}
      {/* Response form */}
      <div className="space-y-4">
        <button onClick={() => setResponseType('accept')}>Accept</button>
        <button onClick={() => setResponseType('decline')}>Decline</button>
        <button onClick={() => setResponseType('cannot_verify')}>Cannot Verify</button>

        {(responseType === 'decline' || responseType === 'cannot_verify') && (
          <textarea
            placeholder="Please provide a reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        <button onClick={handleSubmit}>Submit Response</button>
      </div>
    </div>
  );
}
```

#### 3. Add Nudge/Reminder System

**File:** `src/lib/verification/nudges.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationNudges() {
  const supabase = await createClient();

  // Find pending requests that need nudging
  // 48h nudge
  const { data: needsFirstNudge } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('status', 'pending')
    .is('last_nudged_at', null)
    .lt('sent_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  // 7d nudge
  const { data: needsSecondNudge } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('status', 'pending')
    .not('last_nudged_at', 'is', null)
    .lt('last_nudged_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Send nudge emails and update last_nudged_at
  // Implementation here...
}
```

#### 4. Add Appeal System

**File:** `src/app/api/verification/appeal/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId, context } = await request.json();

  // Create appeal
  const { data, error } = await supabase
    .from('verification_appeals')
    .insert({
      request_id: requestId,
      profile_id: user.id,
      context, // User's explanation ≤500 words
    })
    .select()
    .single();

  // Update original request status
  await supabase.from('verification_requests').update({ status: 'appealed' }).eq('id', requestId);

  // Notify admin queue
  // Implementation here...

  return NextResponse.json({ success: true, appealId: data.id });
}
```

---

## 💬 Messaging System Implementation

### Overview

Post-match messaging with staged identity reveal (Stage 1: masked, Stage 2: full names after mutual accept).

### Implementation Steps

#### 1. Create Conversation on Match Accept

**File:** `src/app/api/matches/[id]/accept/route.ts`

```typescript
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matchId = params.id;

  // Record match interest
  await supabase.from('match_interest').insert({
    actor_profile_id: user.id,
    assignment_id: '<assignment_id>',
    target_profile_id: '<other_profile_id>',
  });

  // Check if mutual interest
  const { data: interests } = await supabase
    .from('match_interest')
    .select('*')
    .eq('assignment_id', '<assignment_id>');

  const isMutual = interests.length === 2;

  if (isMutual) {
    // Create conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        match_id: matchId,
        assignment_id: '<assignment_id>',
        participant_one_id: user.id,
        participant_two_id: '<other_user_id>',
        stage: 1, // Start with masked basics
      })
      .select()
      .single();

    // Send system message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: 'You both expressed interest! Start the conversation.',
      is_system_message: true,
    });
  }

  return NextResponse.json({ success: true, mutual: isMutual });
}
```

#### 2. Send Message API

**File:** `src/app/api/conversations/[id]/messages/route.ts`

```typescript
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const conversationId = params.id;
  const { content, attachments } = await request.json();

  // Verify participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if blocked
  const { data: blocked } = await supabase
    .from('blocked_users')
    .select('*')
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
    .single();

  if (blocked) {
    return NextResponse.json({ error: 'Cannot send message' }, { status: 403 });
  }

  // Validate attachments (PDF ≤5MB, links only)
  // Implementation here...

  // Insert message
  const { data: message } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      attachments,
    })
    .select()
    .single();

  return NextResponse.json(message);
}
```

#### 3. Stage Progression

**File:** `src/app/api/conversations/[id]/reveal/route.ts`

```typescript
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Update conversation stage to 2 (full reveal)
  const { data } = await supabase
    .from('conversations')
    .update({ stage: 2 })
    .eq('id', params.id)
    .select()
    .single();

  // Send system message
  await supabase.from('messages').insert({
    conversation_id: params.id,
    sender_id: null,
    content: "Full identities revealed! You can now see each other's names.",
    is_system_message: true,
  });

  return NextResponse.json({ success: true, stage: 2 });
}
```

---

## 🛡️ Moderation System Implementation

### Implementation Steps

#### 1. Report Content API

**File:** `src/app/api/moderation/report/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { contentType, contentId, contentOwnerId, reason, category } = await request.json();

  // Validate reason length (≤50 words per PRD)
  const wordCount = reason.trim().split(/\s+/).length;
  if (wordCount > 50) {
    return NextResponse.json({ error: 'Reason must be ≤50 words' }, { status: 400 });
  }

  // Create report
  const { data: report } = await supabase
    .from('content_reports')
    .insert({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      content_owner_id: contentOwnerId,
      reason,
      category,
    })
    .select()
    .single();

  // Trigger AI flagging (optional, async)
  // Implementation here...

  return NextResponse.json({ success: true, reportId: report.id });
}
```

#### 2. Moderation Queue

**File:** `src/app/admin/moderation/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function ModerationQueue() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetch(`/api/moderation/queue?status=${filter}`)
      .then(res => res.json())
      .then(data => setReports(data));
  }, [filter]);

  const takeAction = async (reportId, actionType, reason) => {
    await fetch('/api/moderation/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, actionType, reason }),
    });

    // Refresh queue
  };

  return (
    <div>
      <h1>Moderation Queue</h1>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="pending">Pending</option>
        <option value="reviewing">Reviewing</option>
        <option value="actioned">Actioned</option>
      </select>

      {reports.map(report => (
        <div key={report.id}>
          {/* Display report details */}
          <button onClick={() => takeAction(report.id, 'warning', 'First warning')}>
            Issue Warning
          </button>
          <button onClick={() => takeAction(report.id, 'content_removed', 'Violates policy')}>
            Remove Content
          </button>
          <button onClick={() => takeAction(report.id, 'dismissed', 'Not a violation')}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### 3. Violation Tracking

**File:** `src/lib/moderation/violations.ts`

```typescript
export async function trackViolation(
  userId: string,
  reportId: string,
  violationType: string,
  severity: string
) {
  const supabase = await createClient();

  // Get violation count
  const { data: violations } = await supabase
    .from('user_violations')
    .select('*')
    .eq('user_id', userId);

  // Determine action based on count
  let actionTaken = 'warning';
  let suspensionExpiresAt = null;

  if (violations.length === 0) {
    actionTaken = 'warning';
  } else if (violations.length === 1) {
    actionTaken = 'content_removed';
  } else {
    // Second critical violation → suspension
    actionTaken = 'timed_suspension';
    suspensionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Record violation
  await supabase.from('user_violations').insert({
    user_id: userId,
    report_id: reportId,
    violation_type: violationType,
    severity,
    action_taken: actionTaken,
    suspension_expires_at: suspensionExpiresAt,
  });

  return { actionTaken, suspensionExpiresAt };
}
```

---

## 📊 Analytics Integration

### Track Key Events

**File:** `src/lib/analytics/track.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export async function trackEvent(
  eventType: string,
  properties: Record<string, any> = {},
  userId?: string,
  orgId?: string
) {
  const supabase = await createClient();

  await supabase.from('analytics_events').insert({
    event_type: eventType,
    user_id: userId,
    org_id: orgId,
    properties,
    session_id: '<session_id>',
    ip_address: '<ip_address>',
    user_agent: '<user_agent>',
  });
}

// Usage examples:
// trackEvent('signed_up', { method: 'email' }, userId);
// trackEvent('match_accepted', { match_id: '...' }, userId);
// trackEvent('verification_completed', { status: 'accepted' }, userId);
```

### North Star Metrics Dashboard

**File:** `src/app/admin/metrics/page.tsx`

```typescript
'use client';

export default function MetricsDashboard() {
  // Query analytics_events table for:
  // 1. Time-to-first-match (median)
  // 2. % profiles "Ready for Match" (24h)
  // 3. Org verification completion rate
  // 4. Match acceptance rate (+ decline reasons)
  // 5. Safety: report rate & resolution SLA

  return (
    <div>
      <h1>Metrics Dashboard</h1>
      {/* Display tiles */}
    </div>
  );
}
```

---

## ✅ Testing Checklist

### Verification System

- [ ] User can request verification for experience/education/volunteering
- [ ] Referee receives email with unique link
- [ ] Referee can accept/decline/cannot verify
- [ ] Status updates correctly in UI
- [ ] Nudge emails sent at 48h and 7d
- [ ] Requests expire after 14 days
- [ ] User can appeal declined verifications
- [ ] Admin can review appeals within 72h

### Messaging System

- [ ] Conversation created after mutual match accept
- [ ] Stage 1: masked identities work correctly
- [ ] Stage 2: full reveal works correctly
- [ ] Messages sent successfully
- [ ] Attachments validated (PDF ≤5MB, links only)
- [ ] Blocked users cannot message
- [ ] Conversation read receipts work
- [ ] System messages display correctly

### Moderation System

- [ ] Users can report content with ≤50 word reason
- [ ] Reports appear in moderation queue
- [ ] Moderators can take actions (warning/remove/suspend/dismiss)
- [ ] Violation history tracked correctly
- [ ] 1st violation = warning, 2nd critical = suspension
- [ ] Suspended users see correct expiry date
- [ ] AI flagging triggers (if implemented)

### Analytics

- [ ] All core events tracked: `signed_up`, `match_accepted`, etc.
- [ ] North Star metrics calculable from events
- [ ] Dashboard displays correct data
- [ ] Events have proper user_id/org_id/properties

---

## 🔌 API Endpoints Reference

### Verification

- `POST /api/verification/request` - Create verification request
- `GET /api/verification/request/[token]` - View request details (public)
- `POST /api/verification/respond` - Submit verification response
- `POST /api/verification/appeal` - Appeal declined verification
- `GET /api/verification/status/[requestId]` - Check verification status

### Messaging

- `GET /api/conversations` - List user's conversations
- `GET /api/conversations/[id]` - Get conversation details
- `POST /api/conversations/[id]/messages` - Send message
- `GET /api/conversations/[id]/messages` - Get messages
- `POST /api/conversations/[id]/reveal` - Progress to stage 2
- `POST /api/users/block` - Block a user
- `DELETE /api/users/block/[userId]` - Unblock a user

### Moderation

- `POST /api/moderation/report` - Report content
- `GET /api/moderation/queue` - Get moderation queue (admin)
- `POST /api/moderation/action` - Take moderation action (admin)
- `GET /api/moderation/violations/[userId]` - Get user violation history (admin)

### Analytics

- `POST /api/analytics/track` - Track custom event
- `GET /api/analytics/metrics` - Get dashboard metrics (admin)

---

## 🚦 Next Steps

### Phase 1: Core Implementation (Week 1-2)

1. Apply database migration ✅
2. Implement verification request/response flow
3. Implement basic messaging (stage 1)
4. Implement content reporting

### Phase 2: Polish (Week 3)

1. Add verification nudges/reminders
2. Add appeal system
3. Implement stage 2 messaging (full reveal)
4. Build moderation queue UI

### Phase 3: Analytics (Week 4)

1. Instrument all core events
2. Build metrics dashboard
3. Set up automated reports

### Phase 4: Testing & Launch (Week 5)

1. Manual testing of all flows
2. Load testing
3. Security audit
4. Soft launch to beta users

---

## 📞 Support

For questions or issues during implementation:

- Check PRD: `Proofound_PRD_MVP.md`
- Review schema: `src/db/schema.ts`
- Migration SQL: `src/db/migrations/20250129_add_verification_messaging_moderation.sql`

---

**Last Updated:** 2025-01-29
**Maintained By:** Development Team
