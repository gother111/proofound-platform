/**
 * Tour Status API
 *
 * Manages first-run tour completion status
 * GET: Check if user has completed the tour
 * POST: Mark tour as completed
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tour completion status from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tour_completed')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching tour status:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch tour status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tourCompleted: profile?.tour_completed ?? false,
    });
  } catch (error) {
    console.error('Tour status GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { completed, skipped } = body;

    // Update tour completion status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        tour_completed: completed === true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating tour status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tour status' },
        { status: 500 }
      );
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: skipped ? 'tour_skipped' : 'tour_completed',
      event_data: {
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      tourCompleted: completed === true,
    });
  } catch (error) {
    console.error('Tour status POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

