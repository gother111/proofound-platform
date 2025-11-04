import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/projects/[id]
 * 
 * Fetch a single project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  try {
    const { orgId, id } = await params;
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

    // Fetch project
    const { data: project, error } = await supabase
      .from('organization_projects')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error in project GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/organizations/[orgId]/projects/[id]
 * 
 * Update a project
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

    // Verify project exists and belongs to org
    const { data: existing } = await supabase
      .from('organization_projects')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { title, description, impactCreated, businessValue, outcomes, startDate, endDate, status } = body;

    // Validate required fields
    if (!title || !description || !impactCreated || !businessValue || !outcomes || !startDate) {
      return NextResponse.json(
        { error: 'Title, description, impact, business value, outcomes, and start date are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['planning', 'active', 'completed', 'on_hold', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update project
    const { data: updated, error } = await supabase
      .from('organization_projects')
      .update({
        title,
        description,
        impact_created: impactCreated,
        business_value: businessValue,
        outcomes,
        start_date: startDate,
        end_date: endDate || null,
        status: status || 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in project PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/organizations/[orgId]/projects/[id]
 * 
 * Delete a project
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

    // Delete project
    const { error } = await supabase
      .from('organization_projects')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error in project DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

