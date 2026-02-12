import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { z } from 'zod';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const ModerationActionSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(['approve', 'dismiss', 'delete_content', 'warn_user', 'suspend_user']),
  note: z.string().max(1000).optional(),
  duration: z.number().int().positive().max(365).optional(),
});

function mapActionToModerationActionType(action: z.infer<typeof ModerationActionSchema>['action']) {
  switch (action) {
    case 'dismiss':
    case 'approve':
      return 'dismissed' as const;
    case 'delete_content':
      return 'content_removed' as const;
    case 'warn_user':
      return 'warning' as const;
    case 'suspend_user':
      return 'account_suspended' as const;
  }
}

function mapCategoryToViolationType(category: string) {
  if (
    category === 'spam' ||
    category === 'harassment' ||
    category === 'misinformation' ||
    category === 'inappropriate' ||
    category === 'political'
  ) {
    return category;
  }

  return 'other';
}

async function deleteContent(
  adminClient: ReturnType<typeof createAdminClient>,
  contentType: string,
  contentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    switch (contentType) {
      case 'message': {
        const { error } = await adminClient
          .from('messages')
          .update({ content: '[Message removed by moderator]' })
          .eq('id', contentId);
        if (error) throw error;
        return { success: true, message: 'Message content removed' };
      }
      case 'assignment': {
        const { error } = await adminClient
          .from('assignments')
          .update({ status: 'closed' })
          .eq('id', contentId);
        if (error) throw error;
        return { success: true, message: 'Assignment closed' };
      }
      case 'impact_story': {
        const { error } = await adminClient.from('impact_stories').delete().eq('id', contentId);
        if (error) throw error;
        return { success: true, message: 'Impact story removed' };
      }
      case 'experience': {
        const { error } = await adminClient.from('experiences').delete().eq('id', contentId);
        if (error) throw error;
        return { success: true, message: 'Experience removed' };
      }
      case 'education': {
        const { error } = await adminClient.from('education').delete().eq('id', contentId);
        if (error) throw error;
        return { success: true, message: 'Education entry removed' };
      }
      case 'volunteering': {
        const { error } = await adminClient.from('volunteering').delete().eq('id', contentId);
        if (error) throw error;
        return { success: true, message: 'Volunteering entry removed' };
      }
      default:
        return { success: false, message: 'Unsupported content type' };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to apply content action',
    };
  }
}

/**
 * POST /api/admin/moderation/action
 *
 * Take action on a content report.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const body = await request.json();
    const validation = ModerationActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { reportId, action, note, duration } = validation.data;

    // Ensure request user is still authenticated.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: report, error: reportError } = await adminClient
      .from('content_reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.status === 'actioned' || report.status === 'dismissed') {
      return NextResponse.json({ error: 'Report has already been resolved' }, { status: 400 });
    }

    const moderationActionType = mapActionToModerationActionType(action);
    const isAppealable = action !== 'dismiss' && action !== 'approve';
    const appealDeadline = isAppealable
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    let actionResult: { success?: boolean; message?: string; [key: string]: unknown } = {};

    if (action === 'delete_content') {
      actionResult = await deleteContent(adminClient, report.content_type, report.content_id);
      if (!actionResult.success) {
        return NextResponse.json(
          { error: actionResult.message || 'Failed to remove content' },
          { status: 500 }
        );
      }
    }

    if (action === 'suspend_user' || action === 'warn_user') {
      const actionTaken = action === 'suspend_user' ? 'timed_suspension' : 'warning';
      const severity = action === 'suspend_user' ? 'high' : 'medium';
      const suspensionExpiresAt =
        action === 'suspend_user'
          ? new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000).toISOString()
          : null;

      const { error: violationError } = await adminClient.from('user_violations').insert({
        user_id: report.content_owner_id,
        report_id: report.id,
        violation_type: mapCategoryToViolationType(report.category),
        severity,
        action_taken: actionTaken,
        suspension_expires_at: suspensionExpiresAt,
        notes: note || null,
      });

      if (violationError) {
        return NextResponse.json({ error: 'Failed to create violation record' }, { status: 500 });
      }

      actionResult = {
        ...actionResult,
        warningIssued: action === 'warn_user',
        suspensionDays: action === 'suspend_user' ? duration || 7 : null,
      };
    }

    const { data: moderationAction, error: moderationActionError } = await adminClient
      .from('moderation_actions')
      .insert({
        report_id: report.id,
        moderator_id: adminUser.userId,
        action_type: moderationActionType,
        reason: note || report.reason,
        is_appealable: isAppealable,
        appeal_deadline: appealDeadline,
      })
      .select('*')
      .single();

    if (moderationActionError || !moderationAction) {
      return NextResponse.json({ error: 'Failed to save moderation action' }, { status: 500 });
    }

    const nextReportStatus =
      action === 'dismiss' || action === 'approve' ? 'dismissed' : 'actioned';

    const { error: updateReportError } = await adminClient
      .from('content_reports')
      .update({
        status: nextReportStatus,
        reviewed_by: adminUser.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateReportError) {
      return NextResponse.json({ error: 'Failed to update report status' }, { status: 500 });
    }

    const statementOfReasons = {
      moderation_action_id: moderationAction.id,
      report_id: report.id,
      subject_user_id: report.content_owner_id,
      generated_by: adminUser.userId,
      reason_summary: note || report.reason,
      legal_basis: 'Proofound Community Standards and Terms of Service',
      evidence_summary: `Category: ${report.category}; Content type: ${report.content_type}`,
      appeal_available: isAppealable,
      appeal_deadline: appealDeadline,
    };

    const { error: statementError } = await adminClient
      .from('moderation_statements_of_reasons')
      .insert(statementOfReasons);

    if (statementError) {
      return NextResponse.json(
        { error: 'Failed to generate statement of reasons for this moderation action' },
        { status: 500 }
      );
    }

    await adminClient.from('admin_audit_log').insert({
      admin_id: adminUser.userId,
      action: 'moderation_action',
      target_type: 'content_report',
      target_id: reportId,
      metadata: {
        action,
        content_type: report.content_type,
        content_id: report.content_id,
        note,
        duration,
        moderation_action_id: moderationAction.id,
      },
    });

    log.info('moderation.action.taken', {
      adminId: adminUser.userId,
      reportId,
      action,
      contentType: report.content_type,
      contentId: report.content_id,
    });

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully`,
      action,
      result: actionResult,
      moderationActionId: moderationAction.id,
      appeal: {
        available: isAppealable,
        deadline: appealDeadline,
      },
    });
  } catch (error) {
    log.error('moderation.action.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
