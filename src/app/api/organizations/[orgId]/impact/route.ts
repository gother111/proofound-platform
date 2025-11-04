import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[orgId]/impact
 * 
 * Fetch all impact entries for an organization
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

    // Check membership (or public for visibility-controlled access)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch organization with impact entries
    const { data: org, error } = await supabase
      .from('organizations')
      .select('impact_entries')
      .eq('id', orgId)
      .single();

    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Return impact entries (stored as JSONB)
    return NextResponse.json({ entries: org.impact_entries || [] });
  } catch (error) {
    console.error('Error in impact GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/organizations/[orgId]/impact
 * 
 * Create a new impact entry
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
    const entryData = await request.json();

    // Validate required fields
    if (!entryData.title || !entryData.description || !entryData.timeframe) {
      return NextResponse.json(
        { error: 'Title, description, and timeframe are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(entryData.metrics) || entryData.metrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one metric is required' },
        { status: 400 }
      );
    }

    // Create new entry with ID and timestamp
    const newEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    // Fetch current entries
    const { data: org } = await supabase
      .from('organizations')
      .select('impact_entries')
      .eq('id', orgId)
      .single();

    const currentEntries = (org?.impact_entries as any[]) || [];

    // Update with new entry
    const { data: updated, error } = await supabase
      .from('organizations')
      .update({
        impact_entries: [...currentEntries, newEntry],
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select('impact_entries')
      .single();

    if (error) {
      console.error('Error creating impact entry:', error);
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error in impact POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
