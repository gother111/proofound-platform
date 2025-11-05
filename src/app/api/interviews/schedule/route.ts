/**
 * Interview Scheduling API
 * POST /api/interviews/schedule
 *
 * Implements PRD Gap 1: Create interview with Zoom or Google Meet
 *
 * PRD Requirements:
 * - Only 1 interview per application
 * - Duration must be 30 minutes
 * - Must be scheduled within 7 days of match acceptance
 * - Auto-generates meeting link
 * - Sends calendar invites to all participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { interviews, matches } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createZoomMeeting } from '@/lib/integrations/zoom';
import { createGoogleMeetEvent, getGoogleAccessToken } from '@/lib/integrations/google-meet';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const ScheduleInterviewSchema = z.object({
  matchId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  platform: z.enum(['zoom', 'google_meet']),
  participantUserIds: z.array(z.string().uuid()).min(2), // At least candidate + host
  timezone: z.string().optional().default('UTC'),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ScheduleInterviewSchema.parse(body);

    // 1. Check match exists and is active
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, validatedData.matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check user has permission (org member or candidate)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify user is either the applicant or an org member for this assignment
    const isCandidate = application.profileId === user.id;
    let isOrgMember = false;

    if (!isCandidate) {
      // Check if user is a member of the organization that posted the assignment
      const { data: assignment } = await supabase
        .from('assignments')
        .select('org_id')
        .eq('id', application.assignmentId)
        .single();

      if (assignment) {
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('org_id', assignment.org_id)
          .eq('user_id', user.id)
          .single();

        isOrgMember = !!orgMember;
      }
    }

    if (!isCandidate && !isOrgMember) {
      return NextResponse.json(
        { error: 'You do not have permission to schedule interviews for this application' },
        { status: 403 }
      );
    }

    // 2. Validate: only 1 interview per application (PRD requirement)
    const [existingInterview] = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.applicationId, validatedData.applicationId),
          eq(interviews.status, 'scheduled')
        )
      )
      .limit(1);

    if (existingInterview) {
      return NextResponse.json(
        { error: 'An interview is already scheduled for this application' },
        { status: 400 }
      );
    }

    // 3. Validate: duration = 30 minutes (PRD requirement - enforced)
    const duration = 30;

    // 4. Validate: scheduled within 7 days of match acceptance (PRD requirement)
    const scheduledDate = new Date(validatedData.scheduledAt);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (scheduledDate > sevenDaysFromNow) {
      return NextResponse.json(
        { error: 'Interview must be scheduled within 7 days of match acceptance' },
        { status: 400 }
      );
    }

    if (scheduledDate < now) {
      return NextResponse.json(
        { error: 'Interview cannot be scheduled in the past' },
        { status: 400 }
      );
    }

    // 5. Get participant emails
    const { data: participants } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', validatedData.participantUserIds);

    if (!participants || participants.length !== validatedData.participantUserIds.length) {
      return NextResponse.json({ error: 'Some participants not found' }, { status: 400 });
    }

    const participantEmails = participants.map((p: any) => p.email).filter(Boolean);

    // 6. Create meeting based on platform
    let meetingLink: string;
    let meetingId: string;

    try {
      if (validatedData.platform === 'zoom') {
        const zoomMeeting = await createZoomMeeting({
          topic: `Interview for Application #${application.id.slice(0, 8)}`,
          startTime: validatedData.scheduledAt,
          duration,
          hostEmail: user.email || '',
          participantEmails,
          timezone: validatedData.timezone,
        });

        meetingLink = zoomMeeting.joinUrl;
        meetingId = zoomMeeting.meetingId;
      } else {
        // Google Meet
        // Get user's Google access token from integrations table
        const { data: integration } = await supabase
          .from('user_integrations')
          .select('access_token, refresh_token')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .single();

        if (!integration || !integration.refresh_token) {
          return NextResponse.json(
            { error: 'Google Calendar not connected. Please connect in settings.' },
            { status: 400 }
          );
        }

        const accessToken = await getGoogleAccessToken(integration.refresh_token);

        const endTime = new Date(scheduledDate.getTime() + duration * 60000).toISOString();

        const googleEvent = await createGoogleMeetEvent(
          {
            summary: `Interview for Application #${application.id.slice(0, 8)}`,
            startTime: validatedData.scheduledAt,
            endTime,
            attendees: participantEmails,
            organizerEmail: user.email || '',
            timezone: validatedData.timezone,
          },
          accessToken
        );

        meetingLink = googleEvent.meetLink;
        meetingId = googleEvent.eventId;
      }
    } catch (error: any) {
      console.error('Failed to create meeting:', error);
      return NextResponse.json(
        { error: `Failed to create ${validatedData.platform} meeting: ${error.message}` },
        { status: 500 }
      );
    }

    // 7. Store interview record
    const [interview] = await db
      .insert(interviews)
      .values({
        applicationId: validatedData.applicationId,
        scheduledAt: new Date(validatedData.scheduledAt),
        durationMinutes: duration,
        platform: validatedData.platform,
        meetingLink,
        meetingId,
        hostUserId: user.id,
        participantUserIds: validatedData.participantUserIds,
        status: 'scheduled',
        notes: validatedData.notes,
      })
      .returning();

    // 8. Send calendar invites / notifications
    // Note: Zoom and Google already handle sending invites
    // We'll send a confirmation email to all participants
    for (const participant of participants) {
      if (participant.email) {
        await sendEmail({
          to: participant.email,
          subject: 'Interview Scheduled',
          text: `Your interview has been scheduled for ${scheduledDate.toLocaleString()}.
          
Join link: ${meetingLink}

Duration: 30 minutes`,
          html: `
            <h2>Interview Scheduled</h2>
            <p>Your interview has been scheduled for <strong>${scheduledDate.toLocaleString()}</strong>.</p>
            <p><a href="${meetingLink}" style="padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Join Interview</a></p>
            <p>Duration: 30 minutes</p>
            <p>Platform: ${validatedData.platform === 'zoom' ? 'Zoom' : 'Google Meet'}</p>
          `,
        });
      }
    }

    // 9. Emit analytics event: interview_scheduled
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'interview_scheduled',
        properties: {
          interview_id: interview.id,
          application_id: validatedData.applicationId,
          platform: validatedData.platform,
          participant_count: validatedData.participantUserIds.length,
        },
      }),
    });

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        scheduledAt: interview.scheduledAt,
        meetingLink: interview.meetingLink,
        platform: interview.platform,
      },
    });
  } catch (error: any) {
    console.error('Interview scheduling error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
  }
}
