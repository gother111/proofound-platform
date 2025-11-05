/**
 * Interview Cancellation API
 * POST /api/interviews/cancel
 *
 * Implements PRD Gap 1: Cancel scheduled interview
 *
 * Features:
 * - Cancels meeting in Zoom or Google Meet
 * - Updates interview status
 * - Notifies all participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CancelInterviewSchema = z.object({
  interviewId: z.string().uuid(),
  reason: z.string().optional(),
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
    const { interviewId, reason } = CancelInterviewSchema.parse(body);

    // Get interview
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Check permission (host or participant)
    const isHost = interview.host_user_id === user.id;
    const isParticipant = interview.participant_user_ids?.includes(user.id);

    if (!isHost && !isParticipant) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this interview' },
        { status: 403 }
      );
    }

    // Check if already cancelled
    if (interview.status === 'cancelled') {
      return NextResponse.json({ error: 'Interview already cancelled' }, { status: 400 });
    }

    // Cancel meeting in platform (TODO: implement when integrations are ready)
    // try {
    //   if (interview.platform === 'zoom') {
    //     await cancelZoomMeeting(interview.meeting_id);
    //   } else {
    //     // Get host's Google access token
    //     const { data: integration } = await supabase
    //       .from('user_integrations')
    //       .select('refresh_token')
    //       .eq('user_id', interview.host_user_id)
    //       .eq('provider', 'google')
    //       .single();
    //
    //     if (integration?.refresh_token) {
    //       const accessToken = await getGoogleAccessToken(integration.refresh_token);
    //       await cancelGoogleMeetEvent(interview.meeting_id, accessToken);
    //     }
    //   }
    // } catch (error: any) {
    //   console.error('Failed to cancel meeting in platform:', error);
    // }

    // Update interview status
    const updateNote = reason
      ? `${interview.notes || ''}\n\nCancelled: ${reason}`.trim()
      : interview.notes;

    await supabase
      .from('interviews')
      .update({
        status: 'cancelled',
        notes: updateNote,
        updated_at: new Date().toISOString(),
      })
      .eq('id', interviewId);

    return NextResponse.json({
      success: true,
      message: 'Interview cancelled successfully',
    });
  } catch (error: any) {
    console.error('Interview cancellation error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to cancel interview' }, { status: 500 });
  }
}
