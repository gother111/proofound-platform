import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/organizations/[orgId]/goals/[id]
 * 
 * Update a goal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  try {
    const { orgId, id } = await params;
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

    // Verify goal exists
    const { data: existing } = await supabase
      .from('organization_goals')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
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

    // Update goal
    const { data: updated, error } = await supabase
      .from('organization_goals')
      .update({
        goal_type: goalType,
        title,
        description,
        target_date: targetDate || null,
        current_progress: currentProgress || 0,
        metrics: metrics || null,
        status: status || 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in goal PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/organizations/[orgId]/goals/[id]
 * 
 * Delete a goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  try {
    const { orgId, id } = await params;
    const supabase = await createClient();

    // Verify user has permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership (owner or admin can delete)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete goal
    const { error } = await supabase
      .from('organization_goals')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) {
      console.error('Error deleting goal:', error);
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error in goal DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

