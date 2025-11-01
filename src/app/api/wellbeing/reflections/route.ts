import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Well-being Reflections API
 * POST /api/wellbeing/reflections
 * 
 * Saves a reflection linked to a milestone or check-in
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reflectionText, milestoneType, linkedCheckinId } = await req.json();

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

    // 2. Validate input
    if (!reflectionText || typeof reflectionText !== 'string' || reflectionText.trim().length === 0) {
      return NextResponse.json(
        { error: 'reflectionText is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (reflectionText.length > 5000) {
      return NextResponse.json(
        { error: 'reflectionText must be less than 5000 characters' },
        { status: 400 }
      );
    }

    // 3. Insert into wellbeing_reflections table
    const { data: reflection, error } = await supabase
      .from('wellbeing_reflections')
      .insert({
        user_id: user.id,
        reflection_text: reflectionText.trim(),
        milestone_type: milestoneType || null,
        linked_checkin_id: linkedCheckinId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save reflection' },
        { status: 500 }
      );
    }

    // 4. Return success
    return NextResponse.json({ 
      success: true,
      reflectionId: reflection.id,
      data: reflection,
    });
  } catch (error) {
    console.error('Reflection error:', error);
    return NextResponse.json(
      { error: 'Failed to save reflection' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wellbeing/reflections
 * 
 * Retrieves user's reflection journal
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query wellbeing_reflections for user with pagination
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: reflections, error } = await supabase
      .from('wellbeing_reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve reflections' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      reflections: reflections || [],
      count: reflections?.length || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get reflections error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve reflections' },
      { status: 500 }
    );
  }
}

