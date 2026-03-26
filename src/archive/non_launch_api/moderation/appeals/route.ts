import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const AppealRequestSchema = z.object({
  moderationActionId: z.string().uuid(),
  appealReason: z.string().trim().min(10).max(2000),
});

/**
 * POST /api/moderation/appeals
 *
 * Create a moderation appeal for an eligible moderation action.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = AppealRequestSchema.safeParse(await request.json());
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

    if (!moderationAction.is_appealable) {
      return NextResponse.json(
        { error: 'This moderation action cannot be appealed' },
        { status: 400 }
      );
    }

    if (
      moderationAction.appeal_deadline &&
      new Date(moderationAction.appeal_deadline).getTime() < Date.now()
    ) {
      return NextResponse.json({ error: 'Appeal deadline has passed' }, { status: 410 });
    }

    const { data: report, error: reportError } = await adminClient
      .from('content_reports')
      .select('id, reporter_id, content_owner_id')
      .eq('id', moderationAction.report_id)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const userCanAppeal = report.reporter_id === user.id || report.content_owner_id === user.id;
    if (!userCanAppeal) {
      return NextResponse.json(
        { error: 'You are not eligible to appeal this moderation action' },
        { status: 403 }
      );
    }

    const { data: existingAppeal } = await adminClient
      .from('moderation_appeals')
      .select('id')
      .eq('moderation_action_id', moderationAction.id)
      .eq('appellant_id', user.id)
      .maybeSingle();

    if (existingAppeal) {
      return NextResponse.json({ error: 'You already submitted an appeal' }, { status: 409 });
    }

    const { data: appeal, error: createError } = await adminClient
      .from('moderation_appeals')
      .insert({
        moderation_action_id: moderationAction.id,
        report_id: moderationAction.report_id,
        appellant_id: user.id,
        appeal_reason: parsed.data.appealReason,
        status: 'submitted',
      })
      .select('id, status, created_at')
      .single();

    if (createError || !appeal) {
      return NextResponse.json({ error: 'Failed to submit appeal' }, { status: 500 });
    }

    log.info('moderation.appeal.created', {
      moderationActionId: moderationAction.id,
      reportId: moderationAction.report_id,
      appellantId: user.id,
      appealId: appeal.id,
    });

    return NextResponse.json({
      success: true,
      appeal,
    });
  } catch (error) {
    log.error('moderation.appeal.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
