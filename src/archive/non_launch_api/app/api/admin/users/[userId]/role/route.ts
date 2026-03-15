/**
 * PATCH /api/admin/users/[userId]/role
 *
 * Update a user's platform role
 * Requires: super_admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/admin';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction } from '@/lib/audit/admin-logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminUser = await requireSuperAdmin();
    const { userId } = await params;
    const body = await request.json();
    const { role } = body;

    // Validate role
    const validRoles = [null, 'platform_admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get current user
    const user = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-demotion
    if (userId === adminUser.userId && role !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 });
    }

    // Update role
    await db
      .update(profiles)
      .set({ platformRole: role, updatedAt: new Date() })
      .where(eq(profiles.id, userId));

    // Log the action
    await logAdminAction({
      adminId: adminUser.userId,
      action: 'update_user_role',
      targetType: 'user',
      targetId: userId,
      changes: {
        previousRole: user.platformRole,
        newRole: role,
      },
      metadata: {
        targetUserName: user.displayName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role || 'user'}`,
    });
  } catch (error) {
    console.error('Failed to update user role:', error);

    // Check if this is a redirect
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
