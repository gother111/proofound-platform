/**
 * Meeting Link Generation API
 *
 * POST - Generate a Zoom or Google Meet link for an interview
 * Note: In production, this would integrate with actual Zoom/Google APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const body = await req.json();
    const { provider, interviewId, title, duration } = body;

    if (!provider || !['zoom', 'google'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Fetch OAuth tokens from user_integrations table
    // 2. Call Zoom API (https://api.zoom.us/v2/users/me/meetings) or
    //    Google Calendar API to create a meeting
    // 3. Return the meeting link

    // For now, generate a placeholder link
    const meetingId = Math.random().toString(36).substring(7);
    const meetingLink =
      provider === 'zoom'
        ? `https://zoom.us/j/${meetingId}`
        : `https://meet.google.com/${meetingId}`;

    // Store meeting link with interview if interviewId provided
    if (interviewId) {
      await supabase
        .from('interviews')
        .update({
          meeting_link: meetingLink,
          meeting_provider: provider,
          updated_at: new Date().toISOString(),
        })
        .eq('id', interviewId);
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'meeting_link_generated',
      event_data: {
        provider,
        interviewId,
      },
    });

    return NextResponse.json({
      success: true,
      meetingLink,
      provider,
    });
  } catch (error) {
    console.error('Generate meeting link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

