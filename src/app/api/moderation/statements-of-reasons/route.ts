import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const StatementRequestSchema = z.object({
  moderationActionId: z.string().uuid(),
  reasonSummary: z.string().trim().min(5).max(2000),
  legalBasis: z.string().trim().min(3).max(1000),
  evidenceSummary: z.string().trim().min(3).max(2000),
  appealAvailable: z.boolean().optional(),
  appealDeadline: z.string().datetime().optional(),
});

/**
 * POST /api/moderation/statements-of-reasons
 *
 * Create or update a statement of reasons linked to a moderation action.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const parsed = StatementRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: moderationAction, error: moderationActionError } = await adminClient
      .from('moderation_actions')
      .select('id, report_id, is_appealable, appeal_deadline')
      .eq('id', parsed.data.moderationActionId)
      .maybeSingle();

    if (moderationActionError || !moderationAction) {
      return NextResponse.json({ error: 'Moderation action not found' }, { status: 404 });
    }

    const { data: report, error: reportError } = await adminClient
      .from('content_reports')
      .select('id, content_owner_id')
      .eq('id', moderationAction.report_id)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const payload = {
      moderation_action_id: moderationAction.id,
      report_id: report.id,
      subject_user_id: report.content_owner_id,
      generated_by: adminUser.userId,
      reason_summary: parsed.data.reasonSummary,
      legal_basis: parsed.data.legalBasis,
      evidence_summary: parsed.data.evidenceSummary,
      appeal_available: parsed.data.appealAvailable ?? moderationAction.is_appealable,
      appeal_deadline: parsed.data.appealDeadline ?? moderationAction.appeal_deadline,
    };

    const { data: statement, error: saveError } = await adminClient
      .from('moderation_statements_of_reasons')
      .upsert(payload, { onConflict: 'moderation_action_id' })
      .select('*')
      .single();

    if (saveError || !statement) {
      return NextResponse.json({ error: 'Failed to save statement of reasons' }, { status: 500 });
    }

    log.info('moderation.statement_of_reasons.saved', {
      moderationActionId: moderationAction.id,
      reportId: report.id,
      statementId: statement.id,
      adminId: adminUser.userId,
    });

    return NextResponse.json({
      success: true,
      statement,
    });
  } catch (error) {
    log.error('moderation.statement_of_reasons.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
