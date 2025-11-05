import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createZoomMeeting, isZoomConnected } from '@/lib/video/zoom';
import { createGoogleMeeting, isGoogleConnected } from '@/lib/video/google-meet';
import { db } from '@/db';
import { matches, interviews, profiles, assignments, organizations, organizationMembers } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import {
  validateInterviewSchedule,
  canReschedule,
  INTERVIEW_CONSTRAINTS,
} from '@/lib/sla';
import { emitInterviewScheduled } from '@/lib/analytics/events';
import { sendInterviewScheduledEmail } from '@/lib/email';
import { notifyInterviewScheduled } from '@/lib/notifications';

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
    const isCandidate = match.profileId === user.id;

    // Check if user is org member for this assignment
    let isOrgMember = false;
    if (!isCandidate) {
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, match.assignmentId),
      });

      if (assignment) {
        const orgMembership = await db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.userId, user.id),
            eq(organizationMembers.orgId, assignment.orgId),
            eq(organizationMembers.status, 'active')
          ),
        });
        isOrgMember = !!orgMembership;
      }
    }

    if (!isCandidate && !isOrgMember) {
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

    // 4. Check platform connection and generate video link
    let meetingData: { meetingId: string; url: string } | null = null;
    try {
      if (platform === 'zoom') {
        // Check if Zoom is connected
        const connected = await isZoomConnected(user.id);
        if (!connected) {
          return NextResponse.json(
            {
              error: 'Zoom not connected',
              message: 'Please connect your Zoom account in Settings > Integrations',
            },
            { status: 400 }
          );
        }

        // Get assignment info for meeting title
        const assignment = await db.query.assignments.findFirst({
          where: eq(assignments.id, match.assignmentId),
        });

        const meeting = await createZoomMeeting(user.id, {
          topic: assignment?.role
            ? `Interview: ${assignment.role}`
            : `Proofound Interview - Match ${matchId}`,
          startTime: proposedStart,
          duration,
          timezone: timezone || 'UTC',
          agenda: 'Scheduled interview via Proofound platform',
        });

        meetingData = {
          meetingId: meeting.id,
          url: meeting.joinUrl,
        };
      } else if (platform === 'google') {
        // Check if Google is connected
        const connected = await isGoogleConnected(user.id);
        if (!connected) {
          return NextResponse.json(
            {
              error: 'Google Calendar not connected',
              message: 'Please connect your Google account in Settings > Integrations',
            },
            { status: 400 }
          );
        }

        // Get assignment info for meeting title
        const assignment = await db.query.assignments.findFirst({
          where: eq(assignments.id, match.assignmentId),
        });

        const endTime = new Date(proposedStart);
        endTime.setMinutes(endTime.getMinutes() + duration);

        const meeting = await createGoogleMeeting(user.id, {
          summary: assignment?.role
            ? `Interview: ${assignment.role}`
            : `Proofound Interview - Match ${matchId}`,
          startTime: proposedStart,
          endTime,
          timezone: timezone || 'UTC',
          description: 'Scheduled interview via Proofound platform',
        });

        meetingData = {
          meetingId: meeting.id,
          url: meeting.meetLink,
        };
      } else {
        return NextResponse.json(
          {
            error: 'Invalid platform',
            message: 'Platform must be either "zoom" or "google"',
          },
          { status: 400 }
        );
      }
    } catch (videoError) {
      console.error('Video link generation failed:', videoError);
      return NextResponse.json(
        {
          error: 'Failed to create video meeting',
          message: videoError instanceof Error ? videoError.message : 'Unknown error',
        },
        { status: 500 }
      );
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

    // Send in-app notifications to both parties
    try {
      // Get candidate profile
      const candidateProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, match.profileId),
      });

      // Get organization name from assignment
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, match.assignmentId),
      });

      let orgName = 'An organization';
      if (assignment) {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, assignment.orgId),
        });
        orgName = org?.displayName || orgName;
      }

      const candidateName = candidateProfile?.displayName || candidateProfile?.handle || 'A candidate';

      // Notify the candidate
      await notifyInterviewScheduled(
        match.profileId,
        interview.id,
        proposedStart,
        orgName
      );

      // Notify organization members (owners and admins)
      if (assignment) {
        const orgMembers = await db.query.organizationMembers.findMany({
          where: and(
            eq(organizationMembers.orgId, assignment.orgId),
            eq(organizationMembers.status, 'active')
          ),
        });

        for (const member of orgMembers) {
          if (member.role === 'owner' || member.role === 'admin') {
            try {
              await notifyInterviewScheduled(
                member.userId,
                interview.id,
                proposedStart,
                candidateName
              );
            } catch (memberNotifError) {
              console.error('Failed to notify org member:', memberNotifError);
              // Continue notifying other members
            }
          }
        }
      }
    } catch (notifError) {
      console.error('Failed to send interview scheduled notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Send email notifications to candidate
    try {
      // Get candidate profile info
      const candidateProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, match.profileId),
      });

      // Get candidate email from Supabase auth
      const { data: authData } = await supabase.auth.admin.getUserById(match.profileId);

      // Get organization name from assignment
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, match.assignmentId),
      });

      let organizationName = 'the organization';
      if (assignment) {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, assignment.orgId),
        });
        organizationName = org?.displayName || organizationName;
      }

      // Send email to candidate
      if (candidateProfile && authData?.user?.email) {
        await sendInterviewScheduledEmail(
          authData.user.email,
          candidateProfile.displayName || 'Candidate',
          'candidate',
          {
            roleTitle: assignment?.role,
            organizationName,
            scheduledAt: proposedStart.toISOString(),
            duration,
            platform: platform as 'zoom' | 'google-meet',
            meetingUrl: meetingData?.url || '',
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
 * Retrieves scheduled interviews for user (as candidate or org member)
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

    // Get interviews where user is the candidate
    const candidateMatches = await db.query.matches.findMany({
      where: eq(matches.profileId, user.id),
    });

    const candidateMatchIds = candidateMatches.map((m) => m.id);

    // Get organizations where user is a member
    const userOrgMemberships = await db.query.organizationMembers.findMany({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.status, 'active')
      ),
    });

    const userOrgIds = userOrgMemberships.map((m) => m.orgId);

    // Get assignments for user's organizations
    let orgMatchIds: string[] = [];
    if (userOrgIds.length > 0) {
      const orgAssignments = await db.query.assignments.findMany({
        where: or(...userOrgIds.map((orgId) => eq(assignments.orgId, orgId))),
      });

      const assignmentIds = orgAssignments.map((a) => a.id);

      if (assignmentIds.length > 0) {
        const orgMatches = await db.query.matches.findMany({
          where: or(...assignmentIds.map((assignmentId) => eq(matches.assignmentId, assignmentId))),
        });

        orgMatchIds = orgMatches.map((m) => m.id);
      }
    }

    // Combine all match IDs where user is involved
    const allMatchIds = [...new Set([...candidateMatchIds, ...orgMatchIds])];

    // Get all interviews for these matches
    let userInterviews: typeof interviews.$inferSelect[] = [];
    if (allMatchIds.length > 0) {
      userInterviews = await db.query.interviews.findMany({
        where: or(...allMatchIds.map((matchId) => eq(interviews.matchId, matchId))),
        orderBy: (t: any, { desc }) => [desc(t.scheduledAt)],
      });
    }

    // Enrich interviews with match and assignment details
    const enrichedInterviews = await Promise.all(
      userInterviews.map(async (interview) => {
        const match = await db.query.matches.findFirst({
          where: eq(matches.id, interview.matchId),
        });

        if (!match) return null;

        const assignment = await db.query.assignments.findFirst({
          where: eq(assignments.id, match.assignmentId),
        });

        const candidateProfile = await db.query.profiles.findFirst({
          where: eq(profiles.id, match.profileId),
        });

        let organization = null;
        if (assignment) {
          organization = await db.query.organizations.findFirst({
            where: eq(organizations.id, assignment.orgId),
          });
        }

        return {
          ...interview,
          match: {
            id: match.id,
            score: match.score,
          },
          assignment: assignment ? {
            id: assignment.id,
            role: assignment.role,
            description: assignment.description,
          } : null,
          candidate: candidateProfile ? {
            id: candidateProfile.id,
            displayName: candidateProfile.displayName,
            handle: candidateProfile.handle,
          } : null,
          organization: organization ? {
            id: organization.id,
            displayName: organization.displayName,
            slug: organization.slug,
          } : null,
        };
      })
    );

    // Filter out null results
    const validInterviews = enrichedInterviews.filter((i) => i !== null);

    return NextResponse.json({
      interviews: validInterviews,
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    return NextResponse.json({ error: 'Failed to retrieve interviews' }, { status: 500 });
  }
}
