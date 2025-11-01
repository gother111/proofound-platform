import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Well-being Check-in API
 * POST /api/wellbeing/checkin
 * 
 * Records a well-being check-in (stress/control levels)
 * Privacy: Never used for ranking/matching
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stressLevel, controlLevel, milestoneTriggerId } = await req.json();

    // 1. Validate user is opted in
    const { data: optInData } = await supabase
      .from('wellbeing_opt_ins')
      .select('opted_in')
      .eq('user_id', user.id)
      .single();

    if (!optInData?.opted_in) {
      return NextResponse.json(
        { error: 'User has not opted in to Zen Hub' },
        { status: 403 }
      );
    }

    // 2. Validate input (stress/control 1-5)
    if (
      typeof stressLevel !== 'number' ||
      typeof controlLevel !== 'number' ||
      stressLevel < 1 ||
      stressLevel > 5 ||
      controlLevel < 1 ||
      controlLevel > 5
    ) {
      return NextResponse.json(
        { error: 'stressLevel and controlLevel must be integers between 1 and 5' },
        { status: 400 }
      );
    }

    // 3. Insert into wellbeing_checkins table
    const { data: checkin, error } = await supabase
      .from('wellbeing_checkins')
      .insert({
        user_id: user.id,
        stress_level: stressLevel,
        control_level: controlLevel,
        milestone_trigger_id: milestoneTriggerId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to record check-in' },
        { status: 500 }
      );
    }

    // 4. Emit analytics event (private partition)
    await supabase.from('analytics_events').insert({
      event_type: 'wellbeing_checkin_recorded',
      user_id: user.id,
      entity_type: 'checkin',
      entity_id: checkin.id,
      properties: {
        stress_level: stressLevel,
        control_level: controlLevel,
        milestone_trigger: milestoneTriggerId,
        privacy_partition: 'zen_hub', // Never used in matching
      },
    });

    // 5. Return success
    return NextResponse.json({ 
      success: true,
      checkinId: checkin.id,
      data: checkin,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to record check-in' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wellbeing/checkin
 * 
 * Retrieves user's check-in history
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodDays = parseInt(searchParams.get('period') || '30');

    // Validate period
    if (isNaN(periodDays) || periodDays < 1 || periodDays > 365) {
      return NextResponse.json(
        { error: 'period must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    // Query wellbeing_checkins for last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const { data: checkins, error } = await supabase
      .from('wellbeing_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve check-ins' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      checkins: checkins || [],
      period: periodDays,
      count: checkins?.length || 0,
    });
  } catch (error) {
    console.error('Get check-ins error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve check-ins' },
      { status: 500 }
    );
  }
}

