import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { z } from 'zod';
import { log } from '@/lib/log';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const ModerationActionSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(['approve', 'dismiss', 'delete_content', 'warn_user', 'suspend_user']),
  note: z.string().max(1000).optional(),
  duration: z.number().optional(), // For suspension duration in days
});

/**
 * POST /api/admin/moderation/action
 *
 * Take action on a content report
 * Requires platform_admin or super_admin role
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    const supabase = createAdminClient();

    // Validate request body
    const body = await request.json();
    const validation = ModerationActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { reportId, action, note, duration } = validation.data;

    // Fetch report
    const { data: report, error: reportError } = await supabase
      .from('content_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if report is already resolved
    if (report.status === 'resolved' || report.status === 'dismissed') {
      return NextResponse.json({ error: 'Report has already been resolved' }, { status: 400 });
    }

    // Execute action
    let actionResult: any = {};

    switch (action) {
      case 'approve':
        // Mark report as resolved without taking action
        await supabase
          .from('content_reports')
          .update({
            status: 'resolved',
            reviewed_by: admin.userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', reportId);
        break;

      case 'dismiss':
        // Mark report as dismissed
        await supabase
          .from('content_reports')
          .update({
            status: 'dismissed',
            reviewed_by: admin.userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', reportId);
        break;

      case 'delete_content':
        // Delete or hide the content
        const deleteResult = await deleteContent(supabase, report.content_type, report.content_id);

        await supabase
          .from('content_reports')
          .update({
            status: 'resolved',
            reviewed_by: admin.userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        actionResult = deleteResult;
        break;

      case 'warn_user':
        // Issue warning to user
        const warningResult = await issueWarning(
          supabase,
          report.content_owner_id,
          admin.userId,
          reportId,
          report.category,
          note || 'Content violation'
        );

        await supabase
          .from('content_reports')
          .update({
            status: 'resolved',
            reviewed_by: admin.userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        actionResult = warningResult;
        break;

      case 'suspend_user':
        // Suspend user account
        const suspensionResult = await suspendUser(
          supabase,
          report.content_owner_id,
          admin.userId,
          reportId,
          report.category,
          duration || 7,
          note || 'Content policy violation'
        );

        await supabase
          .from('content_reports')
          .update({
            status: 'resolved',
            reviewed_by: admin.userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        actionResult = suspensionResult;
        break;
    }

    // Create admin audit log
    await supabase.from('admin_audit_log').insert({
      admin_id: admin.userId,
      action: 'moderation_action',
      target_type: 'content_report',
      target_id: reportId,
      details: {
        action,
        content_type: report.content_type,
        content_id: report.content_id,
        note,
        duration,
      },
    });

    log.info('moderation.action.taken', {
      adminId: admin.userId,
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
    });
  } catch (error) {
    // Check if it's an unauthorized error
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    console.error('Error in moderation action:', error);
    log.error('moderation.action.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Delete or hide content
 */
async function deleteContent(
  supabase: any,
  contentType: string,
  contentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    switch (contentType) {
      case 'message':
        // Soft delete message (set status and replace content)
        await supabase
          .from('messages')
          .update({ content: '[Message deleted by moderator]', status: 'deleted' })
          .eq('id', contentId);
        break;

      case 'assignment':
        // Set assignment to closed
        await supabase.from('assignments').update({ status: 'closed' }).eq('id', contentId);
        break;

      case 'project':
        // Hide project
        await supabase.from('projects').update({ visibility: 'private' }).eq('id', contentId);
        break;

      case 'skill_proof':
        // Delete skill proof
        await supabase.from('skill_proofs').delete().eq('id', contentId);
        break;

      default:
        return { success: false, message: 'Unsupported content type' };
    }

    return { success: true, message: 'Content deleted successfully' };
  } catch (error) {
    console.error('Error deleting content:', error);
    return { success: false, message: 'Failed to delete content' };
  }
}

/**
 * Issue warning to user
 */
async function issueWarning(
  supabase: any,
  userId: string,
  _adminId: string,
  reportId: string,
  category: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Create violation record
    await supabase.from('user_violations').insert({
      user_id: userId,
      report_id: reportId,
      violation_type: category || 'other',
      severity: 'medium',
      action_taken: 'warning',
      notes: reason,
    });

    // TODO: Send warning email to user

    return { success: true, message: 'Warning issued successfully' };
  } catch (error) {
    console.error('Error issuing warning:', error);
    return { success: false, message: 'Failed to issue warning' };
  }
}

/**
 * Suspend user account
 */
async function suspendUser(
  supabase: any,
  userId: string,
  _adminId: string,
  reportId: string,
  category: string,
  durationDays: number,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);

    // Suspend user by deactivating account access and matching.
    await supabase
      .from('profiles')
      .update({
        deleted: true,
        matching_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Create violation record
    await supabase.from('user_violations').insert({
      user_id: userId,
      report_id: reportId,
      violation_type: category || 'other',
      severity: 'high',
      action_taken: 'timed_suspension',
      suspension_expires_at: suspendedUntil.toISOString(),
      notes: reason,
    });

    // TODO: Send suspension email to user

    return {
      success: true,
      message: `User suspended for ${durationDays} days`,
    };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, message: 'Failed to suspend user' };
  }
}
