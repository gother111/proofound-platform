import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isActiveOrgMember } from '@/lib/api/auth';

/**
 * GET /api/organizations/[orgId]/partnerships/[id]
 *
 * Fetch a single partnership
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

    const canRead = await isActiveOrgMember(supabase as any, user.id, orgId, [
      'org_owner',
      'org_manager',
      'org_reviewer',
    ]);
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch partnership
    const { data: partnership, error } = await supabase
      .from('organization_partnerships')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !partnership) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    }

    return NextResponse.json(partnership);
  } catch (error) {
    console.error('Error in partnership GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/organizations/[orgId]/partnerships/[id]
 *
 * Update a partnership
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

    const canWrite = await isActiveOrgMember(supabase as any, user.id, orgId, ['org_owner']);
    if (!canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify partnership exists and belongs to org
    const { data: existing } = await supabase
      .from('organization_partnerships')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const {
      partnerName,
      partnerType,
      partnershipScope,
      impactCreated,
      startDate,
      endDate,
      status,
    } = body;

    // Validate required fields
    if (!partnerName || !partnershipScope || !impactCreated || !startDate) {
      return NextResponse.json(
        { error: 'Partner name, scope, impact, and start date are required' },
        { status: 400 }
      );
    }

    // Validate partner type
    const validTypes = ['company', 'ngo', 'government', 'academic', 'network', 'other'];
    if (partnerType && !validTypes.includes(partnerType)) {
      return NextResponse.json({ error: 'Invalid partner type' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['active', 'completed', 'suspended'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update partnership
    const { data: updated, error } = await supabase
      .from('organization_partnerships')
      .update({
        partner_name: partnerName,
        partner_type: partnerType || 'other',
        partnership_scope: partnershipScope,
        impact_created: impactCreated,
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
      console.error('Error updating partnership:', error);
      return NextResponse.json({ error: 'Failed to update partnership' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in partnership PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/organizations/[orgId]/partnerships/[id]
 *
 * Delete a partnership
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

    const canWrite = await isActiveOrgMember(supabase as any, user.id, orgId, ['org_owner']);
    if (!canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete partnership
    const { error } = await supabase
      .from('organization_partnerships')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) {
      console.error('Error deleting partnership:', error);
      return NextResponse.json({ error: 'Failed to delete partnership' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Partnership deleted successfully' });
  } catch (error) {
    console.error('Error in partnership DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
