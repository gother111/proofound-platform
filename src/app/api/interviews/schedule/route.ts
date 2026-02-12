/**
 * Interview Scheduling API
 * GET /api/interviews/schedule - List scheduled interviews for current user
 * POST /api/interviews/schedule - Create interview with Zoom or Google Meet
 *
 * Implements PRD Gap 1: Create interview with Zoom or Google Meet
 *
 * PRD Requirements:
 * - Only 1 interview per match
 * - Duration must be 30 minutes
 * - Must be scheduled within 7 days of match acceptance
 * - Auto-generates meeting link
 * - Sends calendar invites to all participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/interviews/schedule
 * Returns scheduled interviews for the current user (as host or participant)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter: scheduled, completed, cancelled
    const matchId = searchParams.get('matchId'); // Optional filter by match

    // Build query - get interviews where user is host or participant
    let query = supabase
      .from('interviews')
      .select(
        `
        id,
        match_id,
        scheduled_at,
        duration_minutes,
        platform,
        meeting_link,
        status,
        host_user_id,
        participant_user_ids,
        created_at,
        matches:matches!interviews_match_id_fkey (
          id,
          profile_id,
          assignment_id,
          created_at,
          assignments:assignments!matches_assignment_id_fkey (
            id,
            role,
            org_id,
            organizations:organizations!assignments_org_id_fkey (
              id,
              display_name
            )
          ),
          profiles:profiles!matches_profile_id_fkey (
            id,
            display_name
          )
        )
      `
      )
      .or(`host_user_id.eq.${user.id},participant_user_ids.cs.{${user.id}}`)
      .order('scheduled_at', { ascending: true });

    // Apply optional filters
    if (status) {
      query = query.eq('status', status);
    }
    if (matchId) {
      query = query.eq('match_id', matchId);
    }

    const { data: interviews, error } = await query;

    if (error) {
      console.error('Failed to fetch interviews:', error);
      return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
    }

    // Transform the data for the frontend
    const transformedInterviews = (interviews || []).map((interview: any) => ({
      id: interview.id,
      matchId: interview.match_id,
      scheduledAt: interview.scheduled_at,
      duration: interview.duration_minutes,
      platform: interview.platform,
      meetingUrl: interview.meeting_link || 'pending',
      status: interview.status,
      matchAgreedAt: interview.matches?.created_at,
      // Include context for org-side view
      candidateName: interview.matches?.profiles?.display_name || 'Candidate',
      assignmentTitle: interview.matches?.assignments?.role || 'Assignment',
      organizationName:
        interview.matches?.assignments?.organizations?.display_name || 'Organization',
    }));

    return NextResponse.json({
      interviews: transformedInterviews,
      count: transformedInterviews.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

const ScheduleInterviewSchema = z.object({
  matchId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  platform: z.enum(['zoom', 'google_meet', 'manual']), // Added manual option
  participantUserIds: z.array(z.string().uuid()).min(2), // At least candidate + host
  timezone: z.string().optional().default('UTC'),
  manualMeetingLink: z.string().url().optional(), // For manual platform - user provides link
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

    const body = await request.json();
    const data = ScheduleInterviewSchema.parse(body);

    // 1. Verify match exists and user has access
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, assignment_id, created_at')
      .eq('id', data.matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    let assignmentRole = 'Proofound Match';
    if (data.platform !== 'manual') {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('role')
        .eq('id', match.assignment_id)
        .maybeSingle();

      assignmentRole = assignment?.role || assignmentRole;
    }

    // 2. Check if interview already exists for this match (PRD: only 1 per match)
    const { data: existingInterview } = await supabase
      .from('interviews')
      .select('id')
      .eq('match_id', data.matchId)
      .single();

    if (existingInterview) {
      return NextResponse.json(
        { error: 'Interview already exists for this match' },
        { status: 400 }
      );
    }

    // 3. Validate scheduling window (PRD: within 7 days of match acceptance)
    const scheduledDate = new Date(data.scheduledAt);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (scheduledDate < now || scheduledDate > sevenDaysFromNow) {
      return NextResponse.json(
        { error: 'Interview must be scheduled within 7 days' },
        { status: 400 }
      );
    }

    // 4. Handle meeting link based on platform
    let meetingLink = '';
    let meetingId = '';

    if (data.platform === 'manual') {
      // Manual platform: user provides their own meeting link
      if (!data.manualMeetingLink) {
        return NextResponse.json(
          { error: 'Meeting link is required when using manual platform' },
          { status: 400 }
        );
      }
      meetingLink = data.manualMeetingLink;
      meetingId = `manual-${Date.now()}`;
    } else {
      // Zoom or Google Meet: use video integration
      const { data: videoIntegration, error: integrationError } = await supabase
        .from('user_video_integrations')
        .select('access_token, refresh_token, token_expiry')
        .eq('user_id', user.id)
        .eq('provider', data.platform)
        .single();

      if (integrationError || !videoIntegration) {
        return NextResponse.json(
          {
            error: `${data.platform === 'zoom' ? 'Zoom' : 'Google Meet'} not connected. Please connect your account first, or use "manual" to provide your own meeting link.`,
          },
          { status: 400 }
        );
      }

      // Check if token needs refresh
      let accessToken = videoIntegration.access_token;
      if (new Date(videoIntegration.token_expiry) < new Date()) {
        // Token expired, refresh it
        if (data.platform === 'zoom') {
          const { refreshZoomToken } = await import('@/lib/integrations/zoom');
          const newTokens = await refreshZoomToken(videoIntegration.refresh_token);
          accessToken = newTokens.access_token;

          // Update stored token
          await supabase
            .from('user_video_integrations')
            .update({
              access_token: newTokens.access_token,
              token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            })
            .eq('user_id', user.id)
            .eq('provider', 'zoom');
        } else {
          const { refreshGoogleToken } = await import('@/lib/integrations/google-meet');
          const newTokens = await refreshGoogleToken(videoIntegration.refresh_token);
          accessToken = newTokens.access_token;

          // Update stored token
          await supabase
            .from('user_video_integrations')
            .update({
              access_token: newTokens.access_token,
              token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            })
            .eq('user_id', user.id)
            .eq('provider', 'google_meet');
        }
      }

      // 5. Create meeting link
      if (data.platform === 'zoom') {
        const { createZoomMeeting } = await import('@/lib/integrations/zoom');
        const meeting = await createZoomMeeting(accessToken, {
          topic: `Interview - ${assignmentRole}`,
          start_time: data.scheduledAt,
          duration: 30,
          timezone: data.timezone,
          agenda: 'Interview session via Proofound',
        });
        meetingLink = meeting.join_url;
        meetingId = meeting.id;
      } else {
        const { createGoogleMeet } = await import('@/lib/integrations/google-meet');

        // Get participant emails
        const participantEmails: string[] = [];
        for (const participantId of data.participantUserIds) {
          const { data: profile } = await supabase.auth.admin.getUserById(participantId);
          if (profile.user?.email) {
            participantEmails.push(profile.user.email);
          }
        }

        const meeting = await createGoogleMeet(accessToken, {
          summary: `Interview - ${assignmentRole}`,
          start_time: data.scheduledAt,
          duration: 30,
          timezone: data.timezone,
          description: 'Interview session via Proofound',
          attendees: participantEmails,
        });
        meetingLink = meeting.hangoutLink;
        meetingId = meeting.id;
      }
    }

    // 6. Create interview record
    const { data: interview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        match_id: data.matchId,
        scheduled_at: data.scheduledAt,
        duration_minutes: 30, // PRD requirement: fixed 30 minutes
        platform: data.platform,
        meeting_link: meetingLink,
        meeting_id: meetingId,
        host_user_id: user.id,
        participant_user_ids: data.participantUserIds,
        status: 'scheduled',
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Emit interview_scheduled event for TTV tracking
    try {
      const { emitInterviewScheduledAsync } = await import('@/lib/analytics/events');

      // Calculate days since match acceptance
      const matchDate = new Date(match.created_at);
      const interviewDate = new Date(data.scheduledAt);
      const daysSinceMatch = Math.floor(
        (interviewDate.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      emitInterviewScheduledAsync(user.id, interview.id, {
        interview_id: interview.id,
        assignment_id: match.assignment_id,
        match_id: data.matchId,
        duration_minutes: 30,
        platform: data.platform,
        days_since_match: daysSinceMatch,
      });
    } catch (analyticsError) {
      console.error('Failed to emit interview_scheduled event:', analyticsError);
      // Don't fail the request if analytics fails
    }

    return NextResponse.json({
      success: true,
      interview,
      message: 'Interview scheduled successfully',
    });
  } catch (error: any) {
    console.error('Failed to schedule interview:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
  }
}
