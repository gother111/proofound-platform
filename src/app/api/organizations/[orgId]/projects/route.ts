import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/projects
 * 
 * Fetch all projects for an organization
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

    // Fetch projects
    const { data: projects, error } = await supabase
      .from('organization_projects')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (error) {
    console.error('Error in projects GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/organizations/[orgId]/projects
 * 
 * Create a new project
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

    // Create project
    const { data: newProject, error } = await supabase
      .from('organization_projects')
      .insert({
        org_id: orgId,
        title,
        description,
        impact_created: impactCreated,
        business_value: businessValue,
        outcomes,
        start_date: startDate,
        end_date: endDate || null,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error in projects POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
