import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createZoomMeeting } from '@/lib/video/zoom';
import { createGoogleMeet } from '@/lib/video/google-meet';
import { db } from '@/db';
import { matches, interviews, profiles } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import {
  validateInterviewSchedule,
  canReschedule,
  INTERVIEW_CONSTRAINTS,
} from '@/lib/interview-constraints';
import { emitInterviewScheduled } from '@/lib/analytics/events';
import { sendInterviewScheduledEmail } from '@/lib/email';

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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
      return NextResponse.json(
        {
          error: 'Match not found',
        },
        { status: 404 }
      );
    }

    // Check user is either candidate or from the org
    if (match.profileId !== user.id) {
      // TODO: Also check if user is org member for this assignment
      return NextResponse.json(
        {
          error: 'Unauthorized - not a match participant',
        },
        { status: 403 }
      );
    }

    // 2. Enforce PRD constraints (30-min max, 7-day window)
    const matchAgreementDate = match.createdAt; // Use createdAt as proxy for agreement date
    const proposedStart = new Date(startTime);

    const validation = validateInterviewSchedule(matchAgreementDate, proposedStart, duration);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Interview scheduling constraints violated',
          details: validation.errors,
          constraints: {
            maxDuration: INTERVIEW_CONSTRAINTS.MAX_DURATION_MINUTES,
            maxDaysFromMatch: INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH,
            matchAgreedAt: matchAgreementDate.toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // 3. Check reschedule limit if applicable
    if (isReschedule) {
      const existingInterviews = await db.query.interviews.findMany({
        where: eq(interviews.matchId, matchId),
      });

      const rescheduleValidation = canReschedule(existingInterviews.length - 1);
      if (!rescheduleValidation.valid) {
        return NextResponse.json(
          {
            error: 'Reschedule limit exceeded',
            details: rescheduleValidation.errors,
            maxReschedules: INTERVIEW_CONSTRAINTS.ALLOWED_RESCHEDULES,
          },
          { status: 400 }
        );
      }
    }

    // 4. Generate video link based on platform
    let meetingData: { meetingId: string; url: string } | null = null;
    try {
      if (platform === 'zoom') {
        const meeting = await createZoomMeeting({
          topic: `Proofound Interview - Match ${matchId}`,
          startTime: proposedStart,
          duration,
          timezone,
        });
        meetingData = {
          meetingId: meeting.id,
          url: meeting.joinUrl,
        };
      } else if (platform === 'google') {
        const meetUrl = await createGoogleMeet({
          summary: `Proofound Interview - Match ${matchId}`,
          startTime: proposedStart,
          duration,
        });
        // For Google Meet, extract event ID from URL or generate a unique identifier
        const eventId = meetUrl.match(/[?&]eid=([^&]+)/)?.[1] || `google-${Date.now()}`;
        meetingData = {
          meetingId: eventId,
          url: meetUrl,
        };
      }
    } catch (videoError) {
      console.error('Video link generation failed:', videoError);
      // Continue anyway - can be added later
    }

    // 5. Create interview record
    const [interview] = await db
      .insert(interviews)
      .values({
        matchId,
        scheduledAt: proposedStart,
        duration,
        platform,
        meetingId: meetingData?.meetingId || 'pending',
        meetingUrl: meetingData?.url || 'pending',
        timezone: 'UTC',
        status: 'scheduled',
      })
      .returning();

    // Emit interview_scheduled event for TTV metric tracking
    try {
      await emitInterviewScheduled(
        user.id,
        matchId,
        proposedStart,
        platform as 'zoom' | 'google-meet'
      );
    } catch (eventError) {
      console.error('Failed to emit interview_scheduled event:', eventError);
      // Don't fail the request if event emission fails
    }

    // Send email notifications to both parties
    try {
      // Get candidate profile info
      const candidateProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, match.profileId),
      });

      // Get candidate email from Supabase auth
      const { data: authData } = await supabase.auth.admin.getUserById(match.profileId);

      // TODO: Get organization member profile (need assignment/org data)
      // For now, just send to candidate
      if (candidateProfile && authData?.user?.email) {
        await sendInterviewScheduledEmail(
          authData.user.email,
          candidateProfile.displayName || 'Candidate',
          'candidate',
          {
            scheduledAt: proposedStart.toISOString(),
            duration,
            platform: platform as 'zoom' | 'google-meet',
            meetingUrl: meetingData?.url || 'pending',
            timezone: timezone || 'UTC',
            interviewId: interview.id,
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send interview scheduled email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        platform: interview.platform,
        meetingUrl: interview.meetingUrl,
        meetingId: interview.meetingId,
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement get interviews
    // Query interviews table for user

    return NextResponse.json({
      interviews: [],
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    return NextResponse.json({ error: 'Failed to retrieve interviews' }, { status: 500 });
  }
}
