import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  assignments,
  auditLogs,
  interviewFeedback,
  interviews,
  matches,
  organizationMembers,
} from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { log } from '@/lib/log';

type AuthorRole = 'candidate' | 'org';
type AssignmentRecord = typeof assignments.$inferSelect;

const FeedbackSchema = z.object({
  fairnessRating: z.number().int().min(1).max(5),
  clarityRating: z.number().int().min(1).max(5),
  experienceRating: z.number().int().min(1).max(5),
  comments: z.string().trim().min(1, 'Comments are required'),
});

async function getInterviewContext(interviewId: string) {
  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
  });

  if (!interview) {
    return { interview: null, match: null };
  }

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, interview.matchId),
  });

  return { interview, match };
}

async function resolveUserRole(userId: string, matchId: string) {
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match) {
    return {
      match: null,
      role: null as AuthorRole | null,
      assignment: null as AssignmentRecord | null,
    };
  }

  const isCandidate = match.profileId === userId;

  let isOrgMember = false;
  let assignment: AssignmentRecord | null = null;

  if (!isCandidate) {
    assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, match.assignmentId),
    });

    if (assignment) {
      const orgMembership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.orgId, assignment.orgId),
          eq(organizationMembers.status, 'active')
        ),
      });
      isOrgMember = !!orgMembership;
    }
  }

  if (isCandidate) {
    return { match, role: 'candidate' as AuthorRole, assignment };
  }

  if (isOrgMember) {
    return { match, role: 'org' as AuthorRole, assignment };
  }

  return { match, role: null as AuthorRole | null, assignment };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const interviewId = params.id;
    const body = await request.json();
    const data = FeedbackSchema.parse(body);

    const { interview, match } = await getInterviewContext(interviewId);

    if (!interview || !match) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (interview.status !== 'completed') {
      return NextResponse.json({ error: 'Interview not completed yet' }, { status: 400 });
    }

    const { role, assignment } = await resolveUserRole(user.id, match.id);

    if (!role) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Only the candidate or organization participants can leave feedback',
        },
        { status: 403 }
      );
    }

    // Enforce one submission per side
    const existing = await db.query.interviewFeedback.findFirst({
      where: and(
        eq(interviewFeedback.interviewId, interviewId),
        eq(interviewFeedback.authorRole, role)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this side' },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(interviewFeedback)
      .values({
        interviewId,
        authorUserId: user.id,
        authorRole: role,
        fairnessRating: data.fairnessRating,
        clarityRating: data.clarityRating,
        experienceRating: data.experienceRating,
        comments: data.comments.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Analytics + audit trail
    log.info('interview.feedback_submitted', {
      interviewId,
      matchId: match.id,
      role,
      userId: user.id,
    });

    try {
      await db.insert(auditLogs).values({
        actorId: user.id,
        orgId: assignment?.orgId ?? null,
        action: 'interview_feedback_submitted',
        targetType: 'interview',
        targetId: interviewId,
        meta: {
          role,
          fairnessRating: data.fairnessRating,
          clarityRating: data.clarityRating,
          experienceRating: data.experienceRating,
        },
      });
    } catch (auditError) {
      log.error('audit.log.failed', {
        context: 'interview_feedback',
        error: auditError instanceof Error ? auditError.message : 'Unknown error',
      });
    }

    return NextResponse.json({
      success: true,
      feedback: created,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    log.error('interview.feedback.error', {
      interviewId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const interviewId = params.id;

  const { interview, match } = await getInterviewContext(interviewId);

  if (!interview || !match) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
  }

  const { role } = await resolveUserRole(user.id, match.id);

  if (!role) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Only the candidate or organization participants can view feedback',
      },
      { status: 403 }
    );
  }

  const feedbackEntries = await db.query.interviewFeedback.findMany({
    where: eq(interviewFeedback.interviewId, interviewId),
  });

  const myFeedback = feedbackEntries.find((entry) => entry.authorRole === role) ?? null;
  const otherRole: AuthorRole = role === 'candidate' ? 'org' : 'candidate';
  const canSeeOther = !!interview.decision;
  const otherFeedback =
    canSeeOther && feedbackEntries.length
      ? (feedbackEntries.find((entry) => entry.authorRole === otherRole) ?? null)
      : null;

  return NextResponse.json({
    success: true,
    feedback: {
      mine: myFeedback,
      theirs: otherFeedback,
      decisionRecorded: canSeeOther,
    },
  });
}
