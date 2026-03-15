/**
 * POST /api/admin/users/[userId]/suspend
 *
 * Suspend or reactivate a user account
 * Requires: platform_admin or super_admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction } from '@/lib/audit/admin-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminUser = await requirePlatformAdmin();
    const { userId } = await params;
    const body = await request.json();
    const { suspended } = body;

    // Get current user
    const user = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-suspension
    if (userId === adminUser.userId) {
      return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 });
    }

    // Prevent suspending super admins (unless you're a super admin)
    if (user.platformRole === 'super_admin' && adminUser.adminLevel !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot suspend a super admin' }, { status: 403 });
    }

    // Update deleted status
    await db
      .update(profiles)
      .set({
        deleted: suspended,
        updatedAt: new Date(),
        // Also disable matching when suspended
        matchingEnabled: suspended ? false : user.matchingEnabled,
      })
      .where(eq(profiles.id, userId));

    // Log the action
    await logAdminAction({
      adminId: adminUser.userId,
      action: suspended ? 'suspend_user' : 'reactivate_user',
      targetType: 'user',
      targetId: userId,
      changes: {
        previousStatus: user.deleted ? 'suspended' : 'active',
        newStatus: suspended ? 'suspended' : 'active',
      },
      metadata: {
        targetUserName: user.displayName,
      },
    });

    return NextResponse.json({
      success: true,
      message: suspended ? 'User suspended' : 'User reactivated',
    });
  } catch (error) {
    console.error('Failed to update user status:', error);

    // Check if this is a redirect
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
