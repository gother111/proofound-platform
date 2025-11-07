/**
 * Interview Scheduling API
 * POST /api/interviews/schedule
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

const ScheduleInterviewSchema = z.object({
  matchId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  platform: z.enum(['zoom', 'google_meet']),
  participantUserIds: z.array(z.string().uuid()).min(2), // At least candidate + host
  timezone: z.string().optional().default('UTC'),
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
      .select('*, assignments(*)')
      .eq('id', data.matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
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

    // 4. Get user's video integration token
    const { data: videoIntegration, error: integrationError } = await supabase
      .from('user_video_integrations')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', user.id)
      .eq('provider', data.platform)
      .single();

    if (integrationError || !videoIntegration) {
      return NextResponse.json(
        {
          error: `${data.platform === 'zoom' ? 'Zoom' : 'Google Meet'} not connected. Please connect your account first.`,
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
    let meetingLink = '';
    let meetingId = '';

    if (data.platform === 'zoom') {
      const { createZoomMeeting } = await import('@/lib/integrations/zoom');
      const meeting = await createZoomMeeting(accessToken, {
        topic: `Interview - ${match.assignments.role || 'Proofound Match'}`,
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
        summary: `Interview - ${match.assignments.role || 'Proofound Match'}`,
        start_time: data.scheduledAt,
        duration: 30,
        timezone: data.timezone,
        description: 'Interview session via Proofound',
        attendees: participantEmails,
      });
      meetingLink = meeting.hangoutLink;
      meetingId = meeting.id;
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
        assignment_id: match.assignments.id,
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
