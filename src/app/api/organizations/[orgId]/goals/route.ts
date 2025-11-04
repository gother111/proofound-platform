import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/goals
 * 
 * Fetch all goals for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    // Verify user has access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch goals
    const { data: goals, error } = await supabase
      .from('organization_goals')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    return NextResponse.json({ goals: goals || [] });
  } catch (error) {
    console.error('Error in goals GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/organizations/[orgId]/goals
 * 
 * Create a new goal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    // Verify user has permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership (owner or admin can modify)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { goalType, title, description, targetDate, currentProgress, metrics, status } = body;

    // Validate required fields
    if (!goalType || !title || !description) {
      return NextResponse.json(
        { error: 'Goal type, title, and description are required' },
        { status: 400 }
      );
    }

    // Validate goal type
    const validTypes = ['sustainability', 'diversity', 'innovation', 'growth', 'impact', 'other'];
    if (!validTypes.includes(goalType)) {
      return NextResponse.json({ error: 'Invalid goal type' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['not_started', 'in_progress', 'achieved', 'abandoned'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Create goal
    const { data: newGoal, error } = await supabase
      .from('organization_goals')
      .insert({
        org_id: orgId,
        goal_type: goalType,
        title,
        description,
        target_date: targetDate || null,
        current_progress: currentProgress || 0,
        metrics: metrics || null,
        status: status || 'in_progress',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error('Error in goals POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

