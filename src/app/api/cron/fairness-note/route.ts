/**
 * Fairness Note Cron Job
 *
 * Automatically generates fairness gap analysis daily at 2 AM UTC.
 * PRD Reference: Part 2 - Fairness Gap Metric
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/log';
import { generateFairnessNoteResult } from '@/lib/analytics/fairness-note-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for Vercel Pro

/**
 * Cron job handler - runs daily at 2 AM UTC
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const secrets = [
    process.env.CRON_SECRET,
    process.env.CRON_SECRET_PREVIEW,
    process.env.NEXT_PUBLIC_CRON_SECRET,
  ].filter(Boolean) as string[];

  if (!secrets.length) return false;
  return secrets.some((secret) => authHeader === `Bearer ${secret}`);
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    if (!isAuthorized(request)) {
      log.warn('fairness-note.cron.unauthorized', {
        hasSecret: !!process.env.CRON_SECRET,
        hasAuth: !!request.headers.get('authorization'),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('fairness-note.cron.started');
    const releaseVersion = new Date().toISOString().split('T')[0];
    const result = await generateFairnessNoteResult({
      releaseVersion,
      publicationStatus: 'published',
    });

    log.info('fairness-note.cron.completed', {
      noteId: result.noteId,
      cohortsAnalyzed: result.cohortsAnalyzed,
      findingsCount: result.findingsCount,
      hasGaps: result.hasSignificantGaps,
      status: result.status,
    });

    if (result.status === 'insufficient_data') {
      log.info('fairness-note.cron.insufficient-data', {
        cohortCount: result.cohortsAnalyzed,
        noteId: result.noteId,
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        noteId: result.noteId,
      });
    }

    return NextResponse.json({
      success: true,
      noteId: result.noteId,
      cohortsAnalyzed: result.cohortsAnalyzed,
      findings: result.findingsCount,
      hasSignificantGaps: result.hasSignificantGaps,
    });
  } catch (error) {
    log.error('fairness-note.cron.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to generate fairness note' }, { status: 500 });
  }
}
