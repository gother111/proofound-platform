import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { z } from 'zod';
import { log } from '@/lib/log';

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
    const supabase = await createClient();
    const admin = await requirePlatformAdmin();

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
            reviewed_by: admin.id,
            reviewed_at: new Date().toISOString(),
            admin_note: note || null,
            action_taken: 'no_action',
          })
          .eq('id', reportId);
        break;

      case 'dismiss':
        // Mark report as dismissed
        await supabase
          .from('content_reports')
          .update({
            status: 'dismissed',
            reviewed_by: admin.id,
            reviewed_at: new Date().toISOString(),
            admin_note: note || null,
            action_taken: 'dismissed',
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
            reviewed_by: admin.id,
            reviewed_at: new Date().toISOString(),
            admin_note: note || null,
            action_taken: 'content_deleted',
          })
          .eq('id', reportId);

        actionResult = deleteResult;
        break;

      case 'warn_user':
        // Issue warning to user
        const warningResult = await issueWarning(
          supabase,
          report.content_id,
          admin.id,
          note || 'Content violation'
        );

        await supabase
          .from('content_reports')
          .update({
            status: 'resolved',
            reviewed_by: admin.id,
            reviewed_at: new Date().toISOString(),
            admin_note: note || null,
            action_taken: 'user_warned',
          })
          .eq('id', reportId);

        actionResult = warningResult;
        break;

      case 'suspend_user':
        // Suspend user account
        const suspensionResult = await suspendUser(
          supabase,
          report.content_id,
          admin.id,
          duration || 7,
          note || 'Content policy violation'
        );

        await supabase
          .from('content_reports')
          .update({
            status: 'resolved',
            reviewed_by: admin.id,
            reviewed_at: new Date().toISOString(),
            admin_note: note || null,
            action_taken: 'user_suspended',
          })
          .eq('id', reportId);

        actionResult = suspensionResult;
        break;
    }

    // Create admin audit log
    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
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
      adminId: admin.id,
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
        // Soft delete message (set content to [deleted])
        await supabase
          .from('messages')
          .update({ content: '[Message deleted by moderator]', deleted: true })
          .eq('id', contentId);
        break;

      case 'assignment':
        // Set assignment to closed
        await supabase
          .from('assignments')
          .update({ status: 'closed', moderation_status: 'removed' })
          .eq('id', contentId);
        break;

      case 'project':
        // Hide project
        await supabase
          .from('projects')
          .update({ visibility: 'private', moderation_status: 'removed' })
          .eq('id', contentId);
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
  adminId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Create warning record
    await supabase.from('user_warnings').insert({
      user_id: userId,
      issued_by: adminId,
      reason,
      issued_at: new Date().toISOString(),
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
  adminId: string,
  durationDays: number,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);

    // Update user profile
    await supabase
      .from('profiles')
      .update({
        account_status: 'suspended',
        suspended_until: suspendedUntil.toISOString(),
        suspension_reason: reason,
      })
      .eq('id', userId);

    // Create suspension record
    await supabase.from('user_suspensions').insert({
      user_id: userId,
      suspended_by: adminId,
      reason,
      suspended_at: new Date().toISOString(),
      suspended_until: suspendedUntil.toISOString(),
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
