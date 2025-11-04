/**
 * Match Snooze API
 *
 * POST /api/match/snooze - Temporarily hide a match
 * Implements PRD requirement for match management
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
    const { matchId, weeks } = body;

    if (!matchId || !weeks) {
      return NextResponse.json(
        { error: 'matchId and weeks are required' },
        { status: 400 }
      );
    }

    if (![1, 2, 4].includes(weeks)) {
      return NextResponse.json(
        { error: 'weeks must be 1, 2, or 4' },
        { status: 400 }
      );
    }

    // Calculate snooze until date
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + weeks * 7);

    // Check if match exists and belongs to user
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, profileId, assignmentId')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.profileId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update match with snooze data
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        snoozedUntil: snoozeUntil.toISOString(),
        snoozedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) {
      console.error('Failed to snooze match:', updateError);
      return NextResponse.json(
        { error: 'Failed to snooze match' },
        { status: 500 }
      );
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'match_snoozed',
      event_data: {
        matchId,
        assignmentId: match.assignmentId,
        weeks,
        snoozeUntil: snoozeUntil.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      snoozeUntil: snoozeUntil.toISOString(),
    });
  } catch (error) {
    console.error('Match snooze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/match/snooze - Get snoozed matches
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

    // Fetch snoozed matches that haven't expired yet
    const { data: snoozedMatches, error } = await supabase
      .from('matches')
      .select(
        `
        id,
        snoozedUntil,
        snoozedAt,
        assignment:assignments(id, role)
      `
      )
      .eq('profileId', user.id)
      .not('snoozedUntil', 'is', null)
      .gte('snoozedUntil', new Date().toISOString())
      .order('snoozedUntil', { ascending: true });

    if (error) {
      console.error('Failed to fetch snoozed matches:', error);
      return NextResponse.json(
        { error: 'Failed to fetch snoozed matches' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      snoozedMatches: snoozedMatches || [],
      count: snoozedMatches?.length || 0,
    });
  } catch (error) {
    console.error('Get snoozed matches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/match/snooze?matchId=xxx - Unsnooze a match
 */
export async function DELETE(request: NextRequest) {
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
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    // Remove snooze
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        snoozedUntil: null,
        snoozedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', matchId)
      .eq('profileId', user.id);

    if (updateError) {
      console.error('Failed to unsnooze match:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsnooze match' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsnooze match error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
