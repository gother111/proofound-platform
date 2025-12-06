# Proofound MVP - Implementation Roadmap
_Generated: 2025-11-01_
_Based on: PRD Compliance Audit_

## 📋 Table of Contents
1. [Critical Path to MVP Launch](#critical-path-to-mvp-launch)
2. [Feature Implementation Details](#feature-implementation-details)
3. [Production Deployment Checklist](#production-deployment-checklist)
4. [Technical Specifications](#technical-specifications)
5. [Timeline & Resources](#timeline--resources)

---

## 🚀 Critical Path to MVP Launch

### Phase 1: Foundation (Days 1-2)
**Goal**: Get core infrastructure production-ready

#### 1.1 Seed Skills Taxonomy ⭐ **IMMEDIATE**
```bash
# Execute now - no code changes needed
npm run db:seed-taxonomy
```
**Expected Output**: 18,708 L4 skills seeded across 4 taxonomy levels
**Time**: 2-5 minutes runtime
**Verification**:
```sql
SELECT COUNT(*) FROM skills_taxonomy;  -- Should return 18,708
SELECT COUNT(*) FROM skills_l3;        -- Should return 1,379
SELECT COUNT(*) FROM skills_subcategories; -- Should return 177
SELECT COUNT(*) FROM skills_categories;    -- Should return 6
```

#### 1.2 Data Import/Export (Missing Feature)
**File**: `src/app/api/user/import/route.ts` (NEW)

**Implementation**:
```typescript
// src/app/api/user/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, individualProfiles, skills, experiences, volunteering } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema validation
const importSchema = z.object({
  version: z.string(),
  profile: z.object({
    headline: z.string().optional(),
    bio: z.string().optional(),
    mission: z.string().optional(),
    vision: z.string().optional(),
    values: z.array(z.any()).optional(),
    causes: z.array(z.string()).optional(),
  }),
  skills: z.array(z.object({
    skillCode: z.string(),
    level: z.number().min(0).max(5),
    lastUsed: z.string().optional(),
    proofs: z.array(z.any()).optional(),
  })).optional(),
  experiences: z.array(z.any()).optional(),
  volunteering: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate schema
    const validatedData = importSchema.parse(body);

    // Schema version compatibility check
    if (validatedData.version !== '3.0.0') {
      return NextResponse.json({
        error: 'Incompatible schema version',
        message: 'Please export your data again with the latest version',
      }, { status: 400 });
    }

    // Transaction: Restore data
    await db.transaction(async (tx) => {
      // Update profile
      if (validatedData.profile) {
        await tx.update(individualProfiles)
          .set({
            headline: validatedData.profile.headline,
            bio: validatedData.profile.bio,
            mission: validatedData.profile.mission,
            vision: validatedData.profile.vision,
            values: validatedData.profile.values as any,
            causes: validatedData.profile.causes,
          })
          .where(eq(individualProfiles.userId, user.id));
      }

      // Restore skills (clear existing first)
      if (validatedData.skills) {
        await tx.delete(skills).where(eq(skills.userId, user.id));

        for (const skill of validatedData.skills) {
          await tx.insert(skills).values({
            userId: user.id,
            skillCode: skill.skillCode,
            level: skill.level,
            lastUsed: skill.lastUsed ? new Date(skill.lastUsed) : null,
          });
        }
      }

      // Restore experiences
      if (validatedData.experiences) {
        await tx.delete(experiences).where(eq(experiences.userId, user.id));
        // Insert experiences...
      }

      // Restore volunteering
      if (validatedData.volunteering) {
        await tx.delete(volunteering).where(eq(volunteering.userId, user.id));
        // Insert volunteering...
      }
    });

    // Audit log
    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'data_import',
      details: { itemCount: validatedData.skills?.length || 0 },
    });

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      imported: {
        skills: validatedData.skills?.length || 0,
        experiences: validatedData.experiences?.length || 0,
        volunteering: validatedData.volunteering?.length || 0,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid data format',
        details: error.errors,
      }, { status: 400 });
    }

    console.error('Import error:', error);
    return NextResponse.json({
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

**UI Component**: `src/components/settings/DataImportButton.tsx` (NEW)
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export function DataImportButton() {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/user/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      toast.success('Data imported successfully', {
        description: `Restored ${result.imported.skills} skills, ${result.imported.experiences} experiences`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Invalid file format',
      });
    } finally {
      setIsImporting(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".json"
        id="data-import"
        className="hidden"
        onChange={handleImport}
        disabled={isImporting}
      />
      <Button
        variant="outline"
        onClick={() => document.getElementById('data-import')?.click()}
        disabled={isImporting}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isImporting ? 'Importing...' : 'Import Data (JSON)'}
      </Button>
      <p className="text-sm text-muted-foreground mt-2">
        Restore your profile from a previous export
      </p>
    </div>
  );
}
```

**Where to Add**: `src/app/app/i/settings/page.tsx`

**Time**: 3-4 hours
**Priority**: HIGH (PRD requirement I-24)

---

### Phase 2: PRD Constraint Enforcement (Days 2-3)

#### 2.1 Interview Constraints (30-min limit, 7-day window)
**File**: `src/app/api/interviews/schedule/route.ts` (UPDATE)

**Add Validation**:
```typescript
// src/lib/interview-constraints.ts (NEW)
export const INTERVIEW_CONSTRAINTS = {
  MAX_DURATION_MINUTES: 30,
  MAX_DAYS_FROM_MATCH: 7,
  ALLOWED_RESCHEDULES: 1,
} as const;

export function validateInterviewSchedule(
  matchAgreementDate: Date,
  proposedStart: Date,
  duration: number
) {
  const errors: string[] = [];

  // Check duration
  if (duration > INTERVIEW_CONSTRAINTS.MAX_DURATION_MINUTES) {
    errors.push(`Interview duration cannot exceed ${INTERVIEW_CONSTRAINTS.MAX_DURATION_MINUTES} minutes`);
  }

  // Check scheduling window
  const daysSinceMatch = Math.floor(
    (proposedStart.getTime() - matchAgreementDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceMatch > INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH) {
    errors.push(`Interview must be scheduled within ${INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH} days of match agreement`);
  }

  if (proposedStart < new Date()) {
    errors.push('Interview cannot be scheduled in the past');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

**Update API**:
```typescript
// In src/app/api/interviews/schedule/route.ts
import { validateInterviewSchedule } from '@/lib/interview-constraints';

export async function POST(request: NextRequest) {
  // ... existing code ...

  const { matchId, startTime, duration } = await request.json();

  // Get match agreement date
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // Validate constraints
  const validation = validateInterviewSchedule(
    match.agreedAt || match.createdAt,
    new Date(startTime),
    duration
  );

  if (!validation.valid) {
    return NextResponse.json({
      error: 'Invalid interview schedule',
      details: validation.errors,
    }, { status: 400 });
  }

  // ... proceed with scheduling ...
}
```

**Time**: 2 hours
**Priority**: HIGH (PRD I-21)

#### 2.2 Decision Window (48-hour enforcement)
**File**: `src/app/api/match/decision/route.ts` (NEW)

```typescript
// src/app/api/match/decision/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { matches, interviews } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const DECISION_WINDOW_HOURS = 48;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { interviewId, decision, feedback } = await request.json();

  // Get interview
  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
  });

  if (!interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
  }

  // Check if within decision window
  const hoursSinceInterview = (Date.now() - interview.heldAt!.getTime()) / (1000 * 60 * 60);

  if (hoursSinceInterview > DECISION_WINDOW_HOURS) {
    return NextResponse.json({
      error: 'Decision window expired',
      message: `Decisions must be made within ${DECISION_WINDOW_HOURS} hours of the interview`,
    }, { status: 400 });
  }

  // Record decision
  await db.update(interviews).set({
    decision,
    feedback,
    decidedAt: new Date(),
  }).where(eq(interviews.id, interviewId));

  return NextResponse.json({ success: true });
}

// Cron job to auto-expire
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find expired interviews
  const expiredInterviews = await db.query.interviews.findMany({
    where: and(
      eq(interviews.decision, null),
      // heldAt older than 48 hours
    ),
  });

  // Auto-expire with system message
  for (const interview of expiredInterviews) {
    await db.update(interviews).set({
      decision: 'expired',
      feedback: 'Decision window expired - no response provided',
      decidedAt: new Date(),
    }).where(eq(interviews.id, interview.id));
  }

  return NextResponse.json({
    expired: expiredInterviews.length,
  });
}
```

**Cron Configuration** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/match/decision",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Time**: 2-3 hours
**Priority**: HIGH (PRD I-22)

#### 2.3 Text-Only Messaging (Paste Disabled)
**File**: `src/components/messaging/MessageThread.tsx` (UPDATE)

```typescript
// Add to MessageThread component
const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  e.preventDefault();
  toast.info('Paste is disabled', {
    description: 'For security, please type your message manually',
  });
};

// In textarea
<textarea
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onPaste={handlePaste}
  onDrop={(e) => e.preventDefault()} // Also prevent drag-drop
  placeholder="Type your message..."
  className="..."
/>
```

**Also prevent file attachments**:
```typescript
// Ensure no file input exists in message composer
// Display notice: "Text-only messaging for privacy and security"
```

**Time**: 30 minutes
**Priority**: MEDIUM (PRD I-20)

---

### Phase 3: Key Missing Features (Days 4-5)

#### 3.1 Gap Map for Career Switchers
**File**: `src/components/expertise/GapMap.tsx` (NEW)

```typescript
// src/components/expertise/GapMap.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus } from 'lucide-react';

interface SkillGap {
  skillCode: string;
  skillName: string;
  importance: number; // 0-100
  currentLevel: number; // 0-5
  targetLevel: number; // 0-5
  gap: number;
  relatedRoles: string[];
}

export function GapMap({ targetRole }: { targetRole?: string }) {
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGaps() {
      const response = await fetch('/api/expertise/gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      });
      const data = await response.json();
      setGaps(data.gaps);
      setLoading(false);
    }

    fetchGaps();
  }, [targetRole]);

  if (loading) {
    return <div>Analyzing skill gaps...</div>;
  }

  const topGaps = gaps.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Skill Gap Map
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top skills to develop for your target roles
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topGaps.map((gap, idx) => (
            <div key={gap.skillCode} className="flex items-center justify-between border-b pb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <span className="font-medium">{gap.skillName}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Current: L{gap.currentLevel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Badge variant="default" className="text-xs">
                    Target: L{gap.targetLevel}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    {gap.relatedRoles.length} roles need this
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-semibold text-orange-600">
                    +{gap.gap} levels
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {gap.importance}% important
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**API Endpoint**: `src/app/api/expertise/gap-analysis/route.ts` (NEW)

```typescript
// src/app/api/expertise/gap-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { skills, assignments, skillsTaxonomy } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { targetRole } = await request.json();

  // 1. Get user's current skills
  const userSkills = await db.query.skills.findMany({
    where: eq(skills.userId, user.id),
  });

  const userSkillMap = new Map(
    userSkills.map(s => [s.skillCode, s.level])
  );

  // 2. Find relevant assignments/roles
  const relevantAssignments = await db.query.assignments.findMany({
    where: targetRole
      ? sql`${assignments.title} ILIKE ${'%' + targetRole + '%'}`
      : sql`1=1`,
    limit: 50,
  });

  // 3. Aggregate skill requirements
  const skillRequirements = new Map<string, {
    count: number;
    avgLevel: number;
    roles: string[];
  }>();

  for (const assignment of relevantAssignments) {
    const requiredSkills = assignment.skillsRequired as any[];

    for (const reqSkill of requiredSkills) {
      const code = reqSkill.code;
      const level = reqSkill.level || 3;

      if (!skillRequirements.has(code)) {
        skillRequirements.set(code, {
          count: 0,
          avgLevel: 0,
          roles: [],
        });
      }

      const req = skillRequirements.get(code)!;
      req.count += 1;
      req.avgLevel += level;
      req.roles.push(assignment.title);
    }
  }

  // 4. Calculate gaps
  const gaps: Array<{
    skillCode: string;
    skillName: string;
    importance: number;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    relatedRoles: string[];
  }> = [];

  for (const [code, req] of skillRequirements.entries()) {
    const currentLevel = userSkillMap.get(code) || 0;
    const targetLevel = Math.round(req.avgLevel / req.count);
    const gap = Math.max(0, targetLevel - currentLevel);

    if (gap > 0) {
      // Get skill name
      const skillInfo = await db.query.skillsTaxonomy.findFirst({
        where: eq(skillsTaxonomy.code, code),
      });

      gaps.push({
        skillCode: code,
        skillName: skillInfo?.nameI18n?.en || code,
        importance: Math.min(100, (req.count / relevantAssignments.length) * 100),
        currentLevel,
        targetLevel,
        gap,
        relatedRoles: req.roles.slice(0, 3),
      });
    }
  }

  // 5. Sort by importance and gap size
  gaps.sort((a, b) => {
    const scoreA = a.importance * a.gap;
    const scoreB = b.importance * b.gap;
    return scoreB - scoreA;
  });

  return NextResponse.json({
    gaps,
    analyzed: relevantAssignments.length,
  });
}
```

**Where to Add**:
- `src/app/app/i/expertise/page.tsx` (as a widget)
- `src/app/app/i/matching/page.tsx` (in matching view)

**Time**: 4-5 hours
**Priority**: HIGH (PRD Persona #2 - Mateo)

#### 3.2 "Why Not Shortlisted" Feedback System
**File**: `src/app/api/match/feedback/route.ts` (NEW)

```typescript
// src/app/api/match/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { matches, matchFeedback } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface FeedbackInsight {
  category: string;
  reason: string;
  actionable: string;
  skillsToImprove?: string[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { matchId } = await request.json();

  // Get match details
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // Generate feedback insights based on match scores
  const insights: FeedbackInsight[] = [];

  const scoreBreakdown = match.scoreBreakdown as any;

  if (scoreBreakdown.skillsMatch < 70) {
    insights.push({
      category: 'Skills Gap',
      reason: 'Your skill profile had a 65% match with requirements',
      actionable: 'Add or improve these skills to increase your match score',
      skillsToImprove: scoreBreakdown.missingSkills || [],
    });
  }

  if (scoreBreakdown.recency < 60) {
    insights.push({
      category: 'Skill Recency',
      reason: 'Some required skills haven\'t been used recently',
      actionable: 'Update "Last Used" dates or add recent projects showing these skills',
    });
  }

  if (scoreBreakdown.verification < 50) {
    insights.push({
      category: 'Verification',
      reason: 'Many required skills lack verification',
      actionable: 'Request peer verification or add proof artifacts for key skills',
    });
  }

  if (scoreBreakdown.valuesAlignment < 40) {
    insights.push({
      category: 'Values Alignment',
      reason: 'Limited overlap with organization\'s values and causes',
      actionable: 'Review and update your values/causes if they\'ve changed',
    });
  }

  if (insights.length === 0) {
    insights.push({
      category: 'Strong Candidate',
      reason: 'Your profile matched well across all dimensions',
      actionable: 'Another candidate was selected for other reasons. Keep applying!',
    });
  }

  return NextResponse.json({
    matchId,
    insights,
    overallScore: match.matchScore,
    breakdown: scoreBreakdown,
  });
}
```

**UI Component**: `src/components/matching/FeedbackCard.tsx` (NEW)

```typescript
// src/components/matching/FeedbackCard.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, Shield, Heart } from 'lucide-react';

interface FeedbackInsight {
  category: string;
  reason: string;
  actionable: string;
  skillsToImprove?: string[];
}

export function FeedbackCard({
  matchId,
  insights
}: {
  matchId: string;
  insights: FeedbackInsight[];
}) {
  const iconMap = {
    'Skills Gap': TrendingUp,
    'Verification': Shield,
    'Values Alignment': Heart,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback on Your Application
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Here's how to strengthen your profile for future matches
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, idx) => {
          const Icon = iconMap[insight.category as keyof typeof iconMap] || MessageSquare;

          return (
            <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-orange-500" />
                <Badge variant="outline">{insight.category}</Badge>
              </div>
              <p className="text-sm font-medium mb-1">{insight.reason}</p>
              <p className="text-sm text-muted-foreground mb-2">
                💡 {insight.actionable}
              </p>
              {insight.skillsToImprove && insight.skillsToImprove.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {insight.skillsToImprove.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <Button variant="outline" className="w-full mt-4">
          View Recommendations
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Time**: 3-4 hours
**Priority**: HIGH (PRD I-22)

---

### Phase 4: UX Enhancements (Days 6-7)

#### 4.1 First-Run Guided Tour
**File**: `src/components/onboarding/GuidedTour.tsx` (NEW)

```typescript
// src/components/onboarding/GuidedTour.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="navigation"]',
    title: 'Welcome to Proofound',
    content: 'This is your main navigation. All key areas are accessible from here.',
    position: 'bottom',
  },
  {
    target: '[data-tour="dashboard"]',
    title: 'Your Dashboard',
    content: 'Get a quick overview of your profile completion and recent activity.',
    position: 'bottom',
  },
  {
    target: '[data-tour="profile"]',
    title: 'Profile',
    content: 'Build your professional identity with mission, values, and journey.',
    position: 'right',
  },
  {
    target: '[data-tour="expertise"]',
    title: 'Expertise Hub',
    content: 'Map your skills using our 4-level taxonomy. This is where the magic happens!',
    position: 'right',
  },
  {
    target: '[data-tour="matching"]',
    title: 'Matching Profile',
    content: 'Set your preferences and let us find values-aligned opportunities.',
    position: 'right',
  },
  {
    target: '[data-tour="zen"]',
    title: 'Zen Hub',
    content: 'Optional well-being check-ins to help you navigate your journey mindfully.',
    position: 'right',
  },
];

export function GuidedTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  useEffect(() => {
    // Check if tour already completed
    const completed = localStorage.getItem('tour_completed');
    if (!completed) {
      setIsOpen(true);
    } else {
      setTourCompleted(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tour_completed', 'true');
    setIsOpen(false);
    setTourCompleted(true);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (tourCompleted) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          {/* Spotlight effect on target element */}
          <div
            className="absolute bg-white/10 rounded-lg pointer-events-none"
            style={{
              // Calculate position based on target element
              // This would need proper implementation with element.getBoundingClientRect()
            }}
          />

          {/* Tour card */}
          <div className={cn(
            "fixed bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl max-w-md",
            // Position based on step.position
          )}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              {step.content}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkip}>
                  Skip Tour
                </Button>
                <Button onClick={handleNext}>
                  {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**Where to Add**: `src/app/app/i/layout.tsx`

**Time**: 4-5 hours
**Priority**: MEDIUM (PRD I-03)

#### 4.2 Expertise Hub Mode Selection
**File**: `src/components/expertise/ModeSelector.tsx` (NEW)

```typescript
// src/components/expertise/ModeSelector.tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Wand2 } from 'lucide-react';

export function ModeSelector({ onSelect }: { onSelect: (mode: 'guided' | 'explore') => void }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <Card className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => onSelect('guided')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Guided Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We'll help you discover relevant skills based on your background and goals.
            Perfect if you're just starting out.
          </p>
          <ul className="text-sm space-y-2 mb-4">
            <li>✓ Smart suggestions based on your journey</li>
            <li>✓ Step-by-step skill building</li>
            <li>✓ Curated recommendations</li>
          </ul>
          <Button className="w-full">Start Guided Mode</Button>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => onSelect('explore')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Explore Freely
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Browse the full taxonomy and add skills at your own pace.
            Best if you know exactly what you're looking for.
          </p>
          <ul className="text-sm space-y-2 mb-4">
            <li>✓ Full taxonomy access</li>
            <li>✓ Advanced search and filters</li>
            <li>✓ Self-directed discovery</li>
          </ul>
          <Button variant="outline" className="w-full">Explore Taxonomy</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Time**: 2 hours
**Priority**: LOW (PRD I-11)

---

### Phase 5: Production Readiness (Days 8-10)

#### 5.1 Environment Variables Audit
**File**: `.env.example` (UPDATE)

```bash
# Database
DATABASE_URL=
DIRECT_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Verification
VERIFF_API_KEY=
VERIFF_API_SECRET=

# Video Conferencing
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
GOOGLE_MEET_API_KEY=

# Email
RESEND_API_KEY=
FROM_EMAIL=

# Security
CRON_SECRET=
ENCRYPTION_KEY=

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_ENV=production
```

#### 5.2 Database Migration Check
```bash
# Verify all migrations are up to date
npm run db:generate
npm run db:push

# Check for pending migrations
ls drizzle/*.sql
```

#### 5.3 Performance Optimizations

**Database Indexes** (`drizzle/indexes.sql` - NEW):
```sql
-- Skills search optimization
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_skills_code ON skills(skill_code);
CREATE INDEX idx_skills_level ON skills(level);

-- Matching optimization
CREATE INDEX idx_matches_candidate ON matches(candidate_id);
CREATE INDEX idx_matches_assignment ON matches(assignment_id);
CREATE INDEX idx_matches_score ON matches(match_score DESC);

-- Messages optimization
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Full-text search on skills
CREATE INDEX idx_skills_taxonomy_name_gin ON skills_taxonomy
USING gin(to_tsvector('english', name_i18n->>'en'));

-- Composite indexes for common queries
CREATE INDEX idx_skills_user_code ON skills(user_id, skill_code);
CREATE INDEX idx_matches_candidate_score ON matches(candidate_id, match_score DESC);
```

#### 5.4 Error Monitoring Setup
**File**: `src/lib/monitoring.ts` (NEW)

```typescript
// src/lib/monitoring.ts
export function captureError(error: Error, context?: Record<string, any>) {
  // Integration with Sentry/LogRocket/etc
  console.error('Error captured:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // Send to monitoring service
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    // await sendToMonitoring(error, context);
  }
}

export function captureMetric(name: string, value: number, tags?: Record<string, string>) {
  // Track performance metrics
  console.log('Metric:', { name, value, tags });

  // Send to analytics service
}
```

#### 5.5 Rate Limiting
**File**: `src/middleware.ts` (UPDATE)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function middleware(request: NextRequest) {
  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      await limiter.check(10, request.ip ?? 'anonymous'); // 10 requests per minute
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}
```

#### 5.6 Security Headers
**File**: `next.config.js` (UPDATE)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 📊 Testing Strategy

### Unit Tests
**Framework**: Vitest

**Priority Tests**:
```typescript
// __tests__/interview-constraints.test.ts
import { validateInterviewSchedule } from '@/lib/interview-constraints';

describe('Interview Constraints', () => {
  it('should reject interviews longer than 30 minutes', () => {
    const result = validateInterviewSchedule(
      new Date('2025-01-01'),
      new Date('2025-01-02'),
      45 // 45 minutes
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Interview duration cannot exceed 30 minutes');
  });

  it('should reject interviews beyond 7-day window', () => {
    const matchDate = new Date('2025-01-01');
    const interviewDate = new Date('2025-01-10'); // 9 days later

    const result = validateInterviewSchedule(matchDate, interviewDate, 30);
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests
**Framework**: Playwright

```typescript
// e2e/skills-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('complete skill addition workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to Expertise Hub
  await page.click('[data-tour="expertise"]');

  // Add a skill
  await page.click('text=Add Skill');
  await page.click('text=Tools & Technologies');
  await page.click('text=Python programming');
  await page.selectOption('[name="level"]', '3');
  await page.click('button:has-text("Save")');

  // Verify skill appears
  await expect(page.locator('text=Python programming')).toBeVisible();
});
```

### Load Testing
**Tool**: k6

```javascript
// load-test/matching.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.get('https://your-app.com/api/match/profile');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in production
- [ ] Database migrations run successfully
- [ ] Skills taxonomy seeded (18,708 skills)
- [ ] SSL certificates configured
- [ ] DNS records updated
- [ ] Monitoring tools configured (Sentry, LogRocket, etc.)
- [ ] Analytics setup (if using)
- [ ] Rate limiting configured
- [ ] Backup strategy in place

### Deployment Steps
```bash
# 1. Build and test locally
npm run build
npm run test

# 2. Run database migrations
npm run db:push

# 3. Seed skills taxonomy
npm run db:seed-taxonomy

# 4. Deploy to Vercel
vercel --prod

# 5. Verify deployment
curl https://your-app.com/api/health

# 6. Run smoke tests
npm run test:e2e
```

### Post-Deployment
- [ ] Verify all pages load correctly
- [ ] Test critical user flows (signup, skill addition, matching)
- [ ] Check error logs for any issues
- [ ] Monitor performance metrics
- [ ] Test email delivery (verification, notifications)
- [ ] Verify OAuth providers (Google, LinkedIn)
- [ ] Test video call integrations (Zoom, Google Meet)
- [ ] Validate rate limiting is working
- [ ] Check database query performance

---

## 📈 Metrics to Monitor

### Application Health
- Response times (P50, P95, P99)
- Error rates by endpoint
- Database query times
- API rate limit hits

### User Behavior
- Signup completion rate
- Profile completion rate
- Skills added per user (avg, median)
- Match acceptance rate
- Interview scheduling rate
- Time-to-First-Qualified-Introduction (TTFQI)
- Time-to-Signed-Contract (TTSC)

### PRD-Specific Metrics (Part 2)
- **TTFQI**: Median time to first qualified intro (Target: ≤72h)
- **TTV**: Time to first meaningful step (Target: ≤7 days)
- **Effort Reduction**: Time saved vs traditional methods (Target: ≥40%)
- **SUS Score**: System Usability Scale (Target: ≥75)
- **Well-Being Delta**: Opt-in stress/control improvement (Target: ≥60% show +1)
- **PAC**: Purpose-Alignment Contribution lift (Target: ≥20% higher acceptance)
- **Fairness Gap**: No negative gaps for underrepresented cohorts

---

## 🎯 Success Criteria

### Week 1 (Post-Launch)
- [ ] 50+ users signed up
- [ ] 500+ skills added across all users
- [ ] 20+ matching profiles activated
- [ ] 5+ qualified introductions made
- [ ] Zero critical bugs
- [ ] <2s average page load time

### Month 1
- [ ] 200+ active users
- [ ] 3,000+ skills in user profiles
- [ ] 100+ matching profiles
- [ ] 30+ interviews scheduled
- [ ] 5+ signed contracts (TTSC baseline established)
- [ ] SUS score ≥70

### MVP Success
- [ ] TTFQI ≤72 hours for at least one cohort
- [ ] TTV ≤7 days median
- [ ] ≥40% reported time savings
- [ ] SUS ≥75
- [ ] ≥60% well-being improvement (opt-in users)
- [ ] No fairness gaps detected
- [ ] Positive user feedback and testimonials

---

## 📞 Support & Escalation

### Technical Issues
- **Critical (P0)**: Complete outage, data loss
  - Response: Immediate
  - Contact: DevOps team

- **High (P1)**: Core feature broken, affecting many users
  - Response: <2 hours
  - Contact: Engineering team

- **Medium (P2)**: Non-critical feature issue
  - Response: <24 hours
  - Contact: Bug tracker

- **Low (P3)**: Minor UI issue, enhancement request
  - Response: <1 week
  - Contact: Product backlog

### Monitoring Alerts
```yaml
# alerts.yml
alerts:
  - name: High Error Rate
    condition: error_rate > 1%
    severity: critical
    notify: [slack, pagerduty]

  - name: Slow Response Time
    condition: p95_response_time > 2s
    severity: warning
    notify: [slack]

  - name: Database Connection Issues
    condition: db_connection_errors > 0
    severity: critical
    notify: [slack, pagerduty, email]
```

---

## 🔄 Continuous Improvement

### Weekly Reviews
- Review error logs and fix top issues
- Analyze user feedback and feature requests
- Monitor key metrics and adjust as needed
- Update documentation based on user questions

### Monthly Retrospectives
- Review TTSC, TTFQI, TTV metrics
- Assess feature adoption rates
- Analyze A/B test results
- Plan next sprint priorities

### Quarterly Strategy
- Major feature launches
- Architecture improvements
- Scale optimization
- Market expansion considerations

---

## ✅ Quick Start Guide

### For New Developers
1. Clone repo and install dependencies
2. Copy `.env.example` to `.env.local` and fill in values
3. Run database migrations: `npm run db:push`
4. Seed skills taxonomy: `npm run db:seed-taxonomy`
5. Start dev server: `npm run dev`
6. Read PRD and this roadmap
7. Pick a task from the backlog

### For Product Team
1. Review this roadmap
2. Prioritize features based on user feedback
3. Update PRD as needed
4. Coordinate with engineering on timelines
5. Monitor metrics dashboard daily

### For QA Team
1. Set up test accounts for each persona
2. Execute test plans in `/tests/` directory
3. Report bugs with reproducible steps
4. Validate fixes before marking as resolved
5. Perform regression testing before each release

---

_This roadmap is a living document. Update it as you learn and adapt._

**Last Updated**: 2025-11-01
**Next Review**: 2025-11-08
