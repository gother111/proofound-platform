import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Zen Hub Opt-In API
 * POST /api/wellbeing/opt-in
 * 
 * Allows users to opt in/out of Zen Hub features
 * Privacy-first: Data never used in matching/ranking
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { optedIn, privacyBannerAcknowledged } = await req.json();

    // Validate input
    if (typeof optedIn !== 'boolean') {
      return NextResponse.json(
        { error: 'optedIn must be a boolean' },
        { status: 400 }
      );
    }

    // Upsert wellbeing_opt_ins record
    const { data, error } = await supabase
      .from('wellbeing_opt_ins')
      .upsert({
        user_id: user.id,
        opted_in: optedIn,
        privacy_banner_acknowledged: privacyBannerAcknowledged ?? false,
        opted_in_at: optedIn ? new Date().toISOString() : null,
        opted_out_at: !optedIn ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update opt-in status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Opt-in status updated',
      data,
    });
  } catch (error) {
    console.error('Opt-in error:', error);
    return NextResponse.json(
      { error: 'Failed to update opt-in status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wellbeing/opt-in
 * 
 * Retrieves user's current opt-in status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query wellbeing_opt_ins table
    const { data, error } = await supabase
      .from('wellbeing_opt_ins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve opt-in status' },
        { status: 500 }
      );
    }

    // Return default values if no record exists
    if (!data) {
      return NextResponse.json({ 
        optedIn: false,
        privacyBannerAcknowledged: false,
      });
    }

    return NextResponse.json({ 
      optedIn: data.opted_in,
      privacyBannerAcknowledged: data.privacy_banner_acknowledged,
      optedInAt: data.opted_in_at,
      optedOutAt: data.opted_out_at,
    });
  } catch (error) {
    console.error('Get opt-in error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve opt-in status' },
      { status: 500 }
    );
  }
}

