/**
 * Admin Audit Logger
 *
 * Logs all admin actions to adminAuditLog table
 * Immutable logs for compliance and security
 */

import { db } from '@/db';
import { adminAuditLog } from '@/db/schema';
import { headers } from 'next/headers';

export interface AdminActionLogParams {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  changes?: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an admin action
 */
export async function logAdminAction(params: AdminActionLogParams): Promise<void> {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await db.insert(adminAuditLog).values({
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType || null,
      targetId: params.targetId || null,
      changes: params.changes || null,
      reason: params.reason || null,
      ipAddress,
      userAgent,
      metadata: params.metadata || null,
    });

    console.log(`[ADMIN AUDIT] ${params.action} by ${params.adminId}${params.targetId ? ` on ${params.targetType}:${params.targetId}` : ''}`);
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't block the action
  }
}

/**
 * Log user suspension
 */
export async function logUserSuspension(
  adminId: string,
  targetUserId: string,
  reason: string,
  duration?: string
): Promise<void> {
  await logAdminAction({
    adminId,
    action: 'suspend_user',
    targetType: 'user',
    targetId: targetUserId,
    reason,
    metadata: { duration },
  });
}

/**
 * Log user data export
 */
export async function logUserDataExport(
  adminId: string,
  targetUserId: string,
  reason: string
): Promise<void> {
  await logAdminAction({
    adminId,
    action: 'export_user_data',
    targetType: 'user',
    targetId: targetUserId,
    reason,
  });
}

/**
 * Log organization modification
 */
export async function logOrganizationModification(
  adminId: string,
  orgId: string,
  changes: Record<string, any>,
  reason?: string
): Promise<void> {
  await logAdminAction({
    adminId,
    action: 'modify_organization',
    targetType: 'organization',
    targetId: orgId,
    changes,
    reason,
  });
}

/**
 * Log feature flag change
 */
export async function logFeatureFlagChange(
  adminId: string,
  flagId: string,
  changes: Record<string, any>
): Promise<void> {
  await logAdminAction({
    adminId,
    action: 'modify_feature_flag',
    targetType: 'feature_flag',
    targetId: flagId,
    changes,
  });
}

/**
 * Log rate limit change
 */
export async function logRateLimitChange(
  adminId: string,
  limitId: string,
  changes: Record<string, any>
): Promise<void> {
  await logAdminAction({
    adminId,
    action: 'modify_rate_limit',
    targetType: 'rate_limit',
    targetId: limitId,
    changes,
  });
}

/**
 * Log content moderation action
 */
export async function logModerationAction(
  adminId: string,
  targetType: string,
  targetId: string,
  actionType: string,
  reason: string
): Promise<void> {
  await logAdminAction({
    adminId,
    action: `moderate_${actionType}`,
    targetType,
    targetId,
    reason,
  });
}

/**
 * Log admin invitation
 */
export async function logAdminInvitation(
  adminId: string,
  inviteeEmail: string,
  role: string
): Promise<void> {
  await logAdminAction({
    adminId,
    action: 'invite_admin',
    metadata: {
      inviteeEmail,
      role,
    },
  });
}

/**
 * Log admin invitation revocation
 */
export async function logAdminInvitationRevocation(
  adminId: string,
  invitationId: string,
  reason: string
): Promise<void> {
  await logAdminAction({
    adminId,
    action: 'revoke_admin_invitation',
    targetType: 'admin_invitation',
    targetId: invitationId,
    reason,
  });
}

/**
 * Log analytics access
 */
export async function logAnalyticsAccess(
  adminId: string,
  analyticsType: string,
  filters?: Record<string, any>
): Promise<void> {
  await logAdminAction({
    adminId,
    action: 'view_analytics',
    metadata: {
      analyticsType,
      filters,
    },
  });
}
