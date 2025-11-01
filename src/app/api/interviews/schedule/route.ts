import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createZoomMeeting } from '@/lib/video/zoom';
import { createGoogleMeet } from '@/lib/video/google-meet';
import { db } from '@/db';
import { matches, interviews } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import {
  validateInterviewSchedule,
  canReschedule,
  INTERVIEW_CONSTRAINTS
} from '@/lib/interview-constraints';

/**
 * Interview Scheduling API
 * POST /api/interviews/schedule
 *
 * Schedules a 30-minute interview with video link
 * Must be within 7 days of match acceptance (PRD I-21)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      matchId,
      startTime,
      duration = 30, // Default 30 minutes
      platform = 'zoom', // 'zoom' | 'google-meet'
      timezone,
      isReschedule = false,
    } = await req.json();

    // 1. Get match and validate user is participant
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
    });

    if (!match) {
      return NextResponse.json({
        error: 'Match not found'
      }, { status: 404 });
    }

    // Check user is either candidate or from the org
    if (match.profileId !== user.id) {
      // TODO: Also check if user is org member for this assignment
      return NextResponse.json({
        error: 'Unauthorized - not a match participant'
      }, { status: 403 });
    }

    // 2. Enforce PRD constraints (30-min max, 7-day window)
    const matchAgreementDate = match.createdAt; // Use createdAt as proxy for agreement date
    const proposedStart = new Date(startTime);

    const validation = validateInterviewSchedule(
      matchAgreementDate,
      proposedStart,
      duration
    );

    if (!validation.valid) {
      return NextResponse.json({
        error: 'Interview scheduling constraints violated',
        details: validation.errors,
        constraints: {
          maxDuration: INTERVIEW_CONSTRAINTS.MAX_DURATION_MINUTES,
          maxDaysFromMatch: INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH,
          matchAgreedAt: matchAgreementDate.toISOString(),
        },
      }, { status: 400 });
    }

    // 3. Check reschedule limit if applicable
    if (isReschedule) {
      const existingInterviews = await db.query.interviews.findMany({
        where: eq(interviews.matchId, matchId),
      });

      const rescheduleValidation = canReschedule(existingInterviews.length - 1);
      if (!rescheduleValidation.valid) {
        return NextResponse.json({
          error: 'Reschedule limit exceeded',
          details: rescheduleValidation.errors,
          maxReschedules: INTERVIEW_CONSTRAINTS.ALLOWED_RESCHEDULES,
        }, { status: 400 });
      }
    }

    // 4. Generate video link based on platform
    let videoLink = '';
    try {
      if (platform === 'zoom') {
        const meeting = await createZoomMeeting({
          topic: `Proofound Interview - Match ${matchId}`,
          startTime: proposedStart,
          duration,
          timezone,
        });
        videoLink = meeting.joinUrl;
      } else if (platform === 'google-meet') {
        videoLink = await createGoogleMeet({
          summary: `Proofound Interview - Match ${matchId}`,
          startTime: proposedStart,
          duration,
        });
      }
    } catch (videoError) {
      console.error('Video link generation failed:', videoError);
      // Continue anyway - can be added later
    }

    // 5. Create interview record
    const [interview] = await db.insert(interviews).values({
      matchId,
      scheduledAt: proposedStart,
      duration,
      platform,
      videoLink: videoLink || null,
      status: 'scheduled',
    }).returning();

    // TODO: Send calendar invites via email
    // TODO: Emit interview_scheduled event

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        platform: interview.platform,
        videoLink: interview.videoLink,
      },
    });
  } catch (error) {
    console.error('Interview scheduling error:', error);
    return NextResponse.json(
      {
        error: 'Failed to schedule interview',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/interviews/schedule
 * 
 * Retrieves scheduled interviews for user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement get interviews
    // Query interviews table for user

    return NextResponse.json({ 
      interviews: [] 
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve interviews' },
      { status: 500 }
    );
  }
}

