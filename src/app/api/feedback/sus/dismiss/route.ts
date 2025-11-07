/**
 * SUS Survey Dismissal API
 * POST /api/feedback/sus/dismiss
 *
 * Logs when a user dismisses a survey (for analytics)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { triggerPoint } = body;

    // Log dismissal for analytics
    log.info('sus_survey_dismissed', {
      userId: user.id,
      triggerPoint,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log survey dismissal:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
