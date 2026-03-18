/**
 * Meeting Link Generation API
 *
 * Generates Google Meet links for launch-safe interview scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGoogleMeet, refreshGoogleToken } from '@/lib/integrations/google-meet';
import { log } from '@/lib/log';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const GenerateLinkSchema = z.object({
  provider: z.literal('google'),
  interviewId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).default('Proofound Interview'),
  duration: z.number().min(15).max(180).default(30), // minutes
  startTime: z.string().datetime().optional(), // ISO 8601 format
  timezone: z.string().default('UTC'),
  attendeeEmails: z.array(z.string().email()).optional(),
});

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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = GenerateLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { provider, interviewId, title, duration, startTime, timezone, attendeeEmails } =
      validationResult.data;

    const dbProvider = 'google_meet';

    // Fetch user's video integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_video_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', dbProvider)
      .single();

    if (integrationError || !integration) {
      log.warn('video.generate.no_integration', {
        userId: user.id,
        provider,
      });

      return NextResponse.json(
        {
          error: 'Google Meet not connected',
          code: 'NO_INTEGRATION',
          message: 'Please connect your Google account first in Settings > Interview Scheduling.',
        },
        { status: 400 }
      );
    }

    let accessToken = integration.access_token;

    // Check if token needs refresh
    if (integration.token_expiry && new Date(integration.token_expiry) < new Date()) {
      if (!integration.refresh_token) {
        log.warn('video.generate.token_expired_no_refresh', {
          userId: user.id,
          provider,
        });

        return NextResponse.json(
          {
            error: 'Token expired',
            code: 'TOKEN_EXPIRED',
            message:
              'Your Google connection has expired. Please reconnect in Settings > Interview Scheduling.',
          },
          { status: 400 }
        );
      }

      try {
        log.info('video.generate.refreshing_token', { userId: user.id, provider });
        const newTokens = await refreshGoogleToken(integration.refresh_token);
        accessToken = newTokens.access_token;

        // Update stored token
        await supabase
          .from('user_video_integrations')
          .update({
            access_token: newTokens.access_token,
            token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);
      } catch (refreshError) {
        log.error('video.generate.token_refresh_failed', {
          userId: user.id,
          provider,
          error: refreshError instanceof Error ? refreshError.message : 'Unknown error',
        });

        return NextResponse.json(
          {
            error: 'Token refresh failed',
            code: 'TOKEN_REFRESH_FAILED',
            message:
              'Failed to refresh your Google token. Please reconnect in Settings > Interview Scheduling.',
          },
          { status: 400 }
        );
      }
    }

    // Generate meeting link
    let meetingLink: string;
    let meetingId: string;

    // Default to 30 minutes from now if no start time provided
    const meetingStartTime = startTime || new Date(Date.now() + 30 * 60 * 1000).toISOString();

    try {
      const meeting = await createGoogleMeet(accessToken, {
        summary: title,
        start_time: meetingStartTime,
        duration: duration,
        timezone: timezone,
        description: interviewId
          ? `Interview session via Proofound (ID: ${interviewId})`
          : 'Interview session via Proofound',
        attendees: attendeeEmails,
      });

      meetingLink = meeting.hangoutLink;
      meetingId = meeting.id;

      log.info('video.generate.google.success', {
        userId: user.id,
        eventId: meeting.id,
      });
    } catch (apiError) {
      log.error('video.generate.api_failed', {
        userId: user.id,
        provider,
        error: apiError instanceof Error ? apiError.message : 'Unknown error',
      });

      return NextResponse.json(
        {
          error: 'Failed to create meeting',
          code: 'API_ERROR',
          message:
            apiError instanceof Error
              ? apiError.message
              : 'Failed to create Google Meet meeting. Please try again.',
        },
        { status: 500 }
      );
    }

    // Store meeting link with interview if interviewId provided
    if (interviewId) {
      const { error: updateError } = await supabase
        .from('interviews')
        .update({
          meeting_link: meetingLink,
          meeting_id: meetingId,
          platform: dbProvider,
          updated_at: new Date().toISOString(),
        })
        .eq('id', interviewId);

      if (updateError) {
        log.warn('video.generate.interview_update_failed', {
          interviewId,
          error: updateError.message,
        });
        // Don't fail the request - the meeting link was still generated
      }
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'meeting_link_generated',
      properties: {
        provider,
        interviewId,
        duration,
        hasAttendees: !!attendeeEmails?.length,
      },
    });

    return NextResponse.json({
      success: true,
      meetingLink,
      meetingId,
      provider,
      title,
      duration,
      startTime: meetingStartTime,
    });
  } catch (error) {
    log.error('video.generate.unexpected_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
