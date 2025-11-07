/**
 * Next Actions API
 *
 * Returns intelligent action recommendations for an organization.
 * PRD Reference: Part 5 O8 - Company Dashboard Analytics Tiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { calculateNextActions } from '@/lib/analytics/next-actions';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // TODO: Verify user has access to this organization

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
