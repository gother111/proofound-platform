/**
 * Work Schedule API
 *
 * GET - Fetch user's work schedule
 * POST - Update user's work schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: schedule, error } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch work schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      schedule: schedule
        ? {
            monday: schedule.monday || 0,
            tuesday: schedule.tuesday || 0,
            wednesday: schedule.wednesday || 0,
            thursday: schedule.thursday || 0,
            friday: schedule.friday || 0,
            saturday: schedule.saturday || 0,
            sunday: schedule.sunday || 0,
          }
        : null,
    });
  } catch (error) {
    console.error('Fetch work schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { schedule } = body;

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule is required' },
        { status: 400 }
      );
    }

    // Validate schedule data
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
      const hours = schedule[day];
      if (typeof hours !== 'number' || hours < 0 || hours > 24) {
        return NextResponse.json(
          { error: `Invalid hours for ${day}` },
          { status: 400 }
        );
      }
    }

    // Upsert work schedule
    const { error } = await supabase
      .from('work_schedules')
      .upsert(
        {
          user_id: user.id,
          monday: schedule.monday,
          tuesday: schedule.tuesday,
          wednesday: schedule.wednesday,
          thursday: schedule.thursday,
          friday: schedule.friday,
          saturday: schedule.saturday,
          sunday: schedule.sunday,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save work schedule' },
        { status: 500 }
      );
    }

    // Calculate total hours for analytics
    const totalHours = Object.values(schedule).reduce(
      (sum: number, hours: any) => sum + hours,
      0
    );

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'work_schedule_updated',
      event_data: {
        totalHours,
        burnoutRisk: totalHours > 50 ? 'high' : totalHours > 40 ? 'medium' : 'low',
      },
    });

    return NextResponse.json({ success: true, totalHours });
  } catch (error) {
    console.error('Save work schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

