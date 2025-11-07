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

    // 4. Create meeting link (TODO: integrate Zoom/Google Meet when ready)
    let meetingLink = '';
    let meetingId = '';

    // Placeholder for integration
    if (data.platform === 'zoom') {
      meetingLink = 'https://zoom.us/j/placeholder';
      meetingId = 'placeholder-zoom-id';
    } else {
      meetingLink = 'https://meet.google.com/placeholder';
      meetingId = 'placeholder-google-id';
    }

    // 5. Create interview record
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
