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
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cancelZoomMeeting } from '@/lib/integrations/zoom';
import { cancelGoogleMeetEvent, getGoogleAccessToken } from '@/lib/integrations/google-meet';
import { sendEmail } from '@/lib/email';
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
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId))
      .limit(1);

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Check permission (host or participant)
    const isHost = interview.hostUserId === user.id;
    const isParticipant = interview.participantUserIds.includes(user.id);

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

    // Cancel meeting in platform
    try {
      if (interview.platform === 'zoom') {
        await cancelZoomMeeting(interview.meetingId!);
      } else {
        // Get host's Google access token
        const { data: integration } = await supabase
          .from('user_integrations')
          .select('refresh_token')
          .eq('user_id', interview.hostUserId)
          .eq('provider', 'google')
          .single();

        if (integration?.refresh_token) {
          const accessToken = await getGoogleAccessToken(integration.refresh_token);
          await cancelGoogleMeetEvent(interview.meetingId!, accessToken);
        }
      }
    } catch (error: any) {
      console.error('Failed to cancel meeting in platform:', error);
      // Continue anyway to update our database
    }

    // Update interview status
    await db
      .update(interviews)
      .set({
        status: 'cancelled',
        notes: reason ? `${interview.notes || ''}\n\nCancelled: ${reason}` : interview.notes,
        updatedAt: new Date(),
      })
      .where(eq(interviews.id, interviewId));

    // Notify participants
    const { data: participants } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', interview.participantUserIds);

    if (participants) {
      for (const participant of participants) {
        if (participant.email) {
          await sendEmail({
            to: participant.email,
            subject: 'Interview Cancelled',
            text: `The interview scheduled for ${interview.scheduledAt.toLocaleString()} has been cancelled.${reason ? `\n\nReason: ${reason}` : ''}`,
            html: `
              <h2>Interview Cancelled</h2>
              <p>The interview scheduled for <strong>${interview.scheduledAt.toLocaleString()}</strong> has been cancelled.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            `,
          });
        }
      }
    }

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
