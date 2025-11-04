import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/partnerships
 * 
 * Fetch all partnerships for an organization
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

    // Fetch partnerships
    const { data: partnerships, error } = await supabase
      .from('organization_partnerships')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching partnerships:', error);
      return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 });
    }

    return NextResponse.json({ partnerships: partnerships || [] });
  } catch (error) {
    console.error('Error in partnerships GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/organizations/[orgId]/partnerships
 * 
 * Create a new partnership
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
    const { partnerName, partnerType, partnershipScope, impactCreated, startDate, endDate, status } = body;

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

    // Create partnership
    const { data: newPartnership, error } = await supabase
      .from('organization_partnerships')
      .insert({
        org_id: orgId,
        partner_name: partnerName,
        partner_type: partnerType || 'other',
        partnership_scope: partnershipScope,
        impact_created: impactCreated,
        start_date: startDate,
        end_date: endDate || null,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating partnership:', error);
      return NextResponse.json({ error: 'Failed to create partnership' }, { status: 500 });
    }

    return NextResponse.json(newPartnership, { status: 201 });
  } catch (error) {
    console.error('Error in partnerships POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
