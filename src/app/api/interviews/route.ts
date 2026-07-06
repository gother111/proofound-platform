/**
 * Interviews List API
 * GET /api/interviews
 *
 * Implements PRD Gap 1: List interviews for current user
 *
 * Query parameters:
 * - status: Filter by status (scheduled, completed, cancelled, no_show)
 * - matchId: Filter by match ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/log';

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
    const status = searchParams.get('status');
    const matchId = searchParams.get('matchId');

    // Build query
    let query = supabase
      .from('interviews')
      .select('*')
      .or(`host_user_id.eq.${user.id},participant_user_ids.cs.{${user.id}}`)
      .order('scheduled_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (matchId) {
      query = query.eq('match_id', matchId);
    }

    const { data: interviews, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ interviews });
  } catch (error: any) {
    log.error('interviews.list.failed', { error });
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}
