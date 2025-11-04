import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/structure/[id]
 * 
 * Fetch a single structure entity
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

    // Fetch entity
    const { data: entity, error } = await supabase
      .from('organization_structure')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error in structure entity GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/organizations/[orgId]/structure/[id]
 * 
 * Update a structure entity
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

    // Verify entity exists and belongs to org
    const { data: existing } = await supabase
      .from('organization_structure')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { entityType, name, description, teamSize, focusArea, parentId } = body;

    // Validate required fields
    if (!entityType || !name) {
      return NextResponse.json(
        { error: 'Entity type and name are required' },
        { status: 400 }
      );
    }

    // Validate entity type
    const validTypes = ['executive_team', 'department', 'team', 'working_group'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    // Prevent circular parent references
    if (parentId === id) {
      return NextResponse.json(
        { error: 'Entity cannot be its own parent' },
        { status: 400 }
      );
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

      // Check for circular reference (prevent making this entity a child of its descendants)
      // Simple check: get all descendants and ensure parent isn't one of them
      const descendants = await getAllDescendants(supabase, id, orgId);
      if (descendants.includes(parentId)) {
        return NextResponse.json(
          { error: 'Cannot create circular parent relationship' },
          { status: 400 }
        );
      }
    }

    // Update entity
    const { data: updated, error } = await supabase
      .from('organization_structure')
      .update({
        entity_type: entityType,
        name,
        description: description || null,
        team_size: teamSize || null,
        focus_area: focusArea || null,
        parent_id: parentId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating structure entity:', error);
      return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in structure entity PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/organizations/[orgId]/structure/[id]
 * 
 * Delete a structure entity
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

    // Check if entity has children
    const { data: children } = await supabase
      .from('organization_structure')
      .select('id')
      .eq('parent_id', id)
      .eq('org_id', orgId);

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete entity with children', message: 'Please delete or reassign child entities first' },
        { status: 400 }
      );
    }

    // Delete entity
    const { error } = await supabase
      .from('organization_structure')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) {
      console.error('Error deleting structure entity:', error);
      return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Entity deleted successfully' });
  } catch (error) {
    console.error('Error in structure entity DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper function to get all descendants of an entity
 */
async function getAllDescendants(
  supabase: any,
  entityId: string,
  orgId: string
): Promise<string[]> {
  const descendants: string[] = [];
  
  async function getChildren(parentId: string) {
    const { data: children } = await supabase
      .from('organization_structure')
      .select('id')
      .eq('parent_id', parentId)
      .eq('org_id', orgId);

    if (children) {
      for (const child of children) {
        descendants.push(child.id);
        await getChildren(child.id);
      }
    }
  }

  await getChildren(entityId);
  return descendants;
}

