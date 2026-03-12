import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isActiveOrgMember } from '@/lib/api/auth';

/**
 * PUT /api/organizations/[orgId]/causes
 *
 * Update organization causes
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

    const canWrite = await isActiveOrgMember(supabase as any, user.id, orgId, ['org_owner']);
    if (!canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const { causes } = await request.json();

    // Validate causes
    if (!Array.isArray(causes)) {
      return NextResponse.json({ error: 'Causes must be an array' }, { status: 400 });
    }

    if (causes.length === 0) {
      return NextResponse.json({ error: 'At least one cause is required' }, { status: 400 });
    }

    if (causes.length > 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 causes allowed (PRD requirement)' },
        { status: 400 }
      );
    }

    // Validate each cause is a non-empty string
    for (const cause of causes) {
      if (typeof cause !== 'string' || !cause.trim()) {
        return NextResponse.json(
          { error: 'Each cause must be a non-empty string' },
          { status: 400 }
        );
      }
    }

    // Update organization causes
    const { data: updated, error } = await supabase
      .from('organizations')
      .update({
        causes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select('causes')
      .single();

    if (error) {
      console.error('Error updating causes:', error);
      return NextResponse.json({ error: 'Failed to update causes' }, { status: 500 });
    }

    return NextResponse.json({ causes: updated.causes });
  } catch (error) {
    console.error('Error in causes PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
