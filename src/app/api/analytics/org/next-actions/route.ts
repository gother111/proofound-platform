/**
 * Next Actions API
 *
 * Returns intelligent action recommendations for an organization.
 * PRD Reference: Part 5 O8 - Company Dashboard Analytics Tiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { calculateNextActions } from '@/lib/analytics/next-actions';
import { log } from '@/lib/log';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has active membership in the organization
    const supabase = await createClient();
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role, status')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membershipError) {
      log.error('next-actions.membership_check_failed', {
        error: membershipError.message,
        orgId,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Failed to verify access' }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this organization' },
        { status: 403 }
      );
    }

    const actions = await calculateNextActions(orgId);

    log.info('next-actions.calculated', {
      userId: user.id,
      orgId,
      actionsCount: actions.length,
    });

    return NextResponse.json({
      actions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error('next-actions.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to calculate next actions' }, { status: 500 });
  }
}
