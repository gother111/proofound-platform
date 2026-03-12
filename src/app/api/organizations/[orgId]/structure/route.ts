import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isActiveOrgMember } from '@/lib/api/auth';

/**
 * GET /api/organizations/[orgId]/structure
 *
 * Fetch all structure entities for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    // Verify user has access to this organization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canRead = await isActiveOrgMember(supabase as any, user.id, orgId, [
      'org_owner',
      'org_manager',
      'org_reviewer',
    ]);
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch structure
    const { data: structure, error } = await supabase
      .from('organization_structure')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching structure:', error);
      return NextResponse.json({ error: 'Failed to fetch structure' }, { status: 500 });
    }

    return NextResponse.json({ structure: structure || [] });
  } catch (error) {
    console.error('Error in structure GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/organizations/[orgId]/structure
 *
 * Create a new structure entity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    // Verify user has access and permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canWrite = await isActiveOrgMember(supabase as any, user.id, orgId, ['org_owner']);
    if (!canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { entityType, name, description, teamSize, focusArea, parentId } = body;

    // Validate required fields
    if (!entityType || !name) {
      return NextResponse.json({ error: 'Entity type and name are required' }, { status: 400 });
    }

    // Validate entity type
    const validTypes = ['executive_team', 'department', 'team', 'working_group'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    // Validate parent exists if provided
    if (parentId) {
      const { data: parent } = await supabase
        .from('organization_structure')
        .select('id')
        .eq('id', parentId)
        .eq('org_id', orgId)
        .single();

      if (!parent) {
        return NextResponse.json({ error: 'Parent entity not found' }, { status: 400 });
      }
    }

    // Create structure entity
    const { data: newEntity, error } = await supabase
      .from('organization_structure')
      .insert({
        org_id: orgId,
        entity_type: entityType,
        name,
        description: description || null,
        team_size: teamSize || null,
        focus_area: focusArea || null,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating structure entity:', error);
      return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 });
    }

    return NextResponse.json(newEntity, { status: 201 });
  } catch (error) {
    console.error('Error in structure POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
