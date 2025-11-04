import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/culture
 * 
 * Fetch organization culture information
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

    // Check membership (or public for post-match visibility)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch organization with culture
    const { data: org, error } = await supabase
      .from('organizations')
      .select('work_culture')
      .eq('id', orgId)
      .single();

    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ workCulture: org.work_culture || {} });
  } catch (error) {
    console.error('Error in culture GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/organizations/[orgId]/culture
 * 
 * Update organization culture information
 */
export async function PUT(
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
    const cultureData = await request.json();

    // Add last updated timestamp
    const updatedCulture = {
      ...cultureData,
      lastUpdated: new Date().toISOString(),
    };

    // Update organization culture
    const { data: updated, error } = await supabase
      .from('organizations')
      .update({
        work_culture: updatedCulture,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select('work_culture')
      .single();

    if (error) {
      console.error('Error updating culture:', error);
      return NextResponse.json({ error: 'Failed to update culture' }, { status: 500 });
    }

    return NextResponse.json({ workCulture: updated.work_culture });
  } catch (error) {
    console.error('Error in culture PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/organizations/[orgId]/culture/preview
 * 
 * Preview how culture appears to candidates (public view)
 */
export async function GET_PREVIEW(
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

    // Fetch organization with culture
    const { data: org, error } = await supabase
      .from('organizations')
      .select('work_culture, display_name')
      .eq('id', orgId)
      .single();

    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Return preview data (what candidates would see)
    return NextResponse.json({
      organizationName: org.display_name,
      culture: org.work_culture || {},
      previewNote: 'This is how candidates will see your work culture information',
    });
  } catch (error) {
    console.error('Error in culture preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
