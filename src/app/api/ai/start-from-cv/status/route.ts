import { NextResponse } from 'next/server';

import {
  assertStartFromCvAccess,
  getStartFromCvLaunchSummary,
  resolveStartFromCvConfig,
  StartFromCvError,
} from '@/lib/ai/start-from-cv';

import { requireStartFromCvRouteContext } from '../_route-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireStartFromCvRouteContext();
    if (context instanceof NextResponse) {
      return context;
    }

    const config = resolveStartFromCvConfig();
    const summary = getStartFromCvLaunchSummary();
    await assertStartFromCvAccess(context.betaContext);

    return NextResponse.json(
      {
        visible: summary.ok,
        available: summary.ok,
        enabled: config.enabled,
        guestFirstProofScaffoldingEnabled: summary.guestFirstProofScaffoldingEnabled,
        inviteOnly: summary.inviteOnly,
        authenticatedUserBeta: summary.authenticatedUserBeta,
        blockers: summary.blockers,
        limits: {
          maxFileSizeMb: config.maxFileSizeMb,
          maxPages: config.maxPages,
          userDailyLimit: config.userDailyLimit,
          globalDailyLimit: config.globalDailyLimit,
          retentionHours: config.retentionHours,
        },
      },
      {
        headers: {
          'cache-control': 'no-store',
        },
      }
    );
  } catch (error) {
    if (error instanceof StartFromCvError) {
      const summary = getStartFromCvLaunchSummary();
      return NextResponse.json(
        {
          visible: false,
          available: false,
          enabled: summary.enabled,
          guestFirstProofScaffoldingEnabled: summary.guestFirstProofScaffoldingEnabled,
          inviteOnly: summary.inviteOnly,
          authenticatedUserBeta: summary.authenticatedUserBeta,
          blockers: [...new Set([...summary.blockers, error.code.toLowerCase()])],
        },
        {
          headers: {
            'cache-control': 'no-store',
          },
        }
      );
    }

    console.error('start_from_cv.status.failed', error);
    return NextResponse.json({ error: 'Failed to load Start from CV status' }, { status: 500 });
  }
}
