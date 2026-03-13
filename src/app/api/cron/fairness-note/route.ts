/**
 * Fairness Note Cron Job
 *
 * Automatically generates fairness gap analysis daily at 2 AM UTC.
 * PRD Reference: Part 2 - Fairness Gap Metric
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/log';
import { generateFairnessNoteResult } from '@/lib/analytics/fairness-note-generator';
import { isAuthorizedCronRequest } from '@/lib/api/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for Vercel Pro

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    if (!isAuthorizedCronRequest(request)) {
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
