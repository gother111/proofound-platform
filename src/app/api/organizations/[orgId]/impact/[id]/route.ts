import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/organizations/[orgId]/impact/[id]
 * 
 * Update an impact entry
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

    // Parse request body
    const updatedData = await request.json();

    // Validate required fields
    if (!updatedData.title || !updatedData.description || !updatedData.timeframe) {
      return NextResponse.json(
        { error: 'Title, description, and timeframe are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(updatedData.metrics) || updatedData.metrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one metric is required' },
        { status: 400 }
      );
    }

    // Fetch current entries
    const { data: org } = await supabase
      .from('organizations')
      .select('impact_entries')
      .eq('id', orgId)
      .single();

    const currentEntries = (org?.impact_entries as any[]) || [];

    // Find entry to update
    const entryIndex = currentEntries.findIndex((e: any) => e.id === id);

    if (entryIndex === -1) {
      return NextResponse.json({ error: 'Impact entry not found' }, { status: 404 });
    }

    // Update entry (preserve id and createdAt)
    const updatedEntry = {
      ...updatedData,
      id,
      createdAt: currentEntries[entryIndex].createdAt,
      updatedAt: new Date().toISOString(),
    };

    currentEntries[entryIndex] = updatedEntry;

    // Save updated entries
    const { error } = await supabase
      .from('organizations')
      .update({
        impact_entries: currentEntries,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (error) {
      console.error('Error updating impact entry:', error);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error in impact PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/organizations/[orgId]/impact/[id]
 * 
 * Delete an impact entry
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

    // Fetch current entries
    const { data: org } = await supabase
      .from('organizations')
      .select('impact_entries')
      .eq('id', orgId)
      .single();

    const currentEntries = (org?.impact_entries as any[]) || [];

    // Filter out the entry to delete
    const updatedEntries = currentEntries.filter((e: any) => e.id !== id);

    if (updatedEntries.length === currentEntries.length) {
      return NextResponse.json({ error: 'Impact entry not found' }, { status: 404 });
    }

    // Save updated entries
    const { error } = await supabase
      .from('organizations')
      .update({
        impact_entries: updatedEntries,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (error) {
      console.error('Error deleting impact entry:', error);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Impact entry deleted successfully' });
  } catch (error) {
    console.error('Error in impact DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

