/**
 * Feature Flag Admin API - Individual Flag Operations
 *
 * GET - Get a specific feature flag
 * PATCH - Update a specific feature flag
 * DELETE - Delete a feature flag
 *
 * Authorization:
 * - GET: platform_admin or super_admin
 * - PATCH/DELETE: super_admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { db } from '@/db';
import { featureFlags, adminAuditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { log } from '@/lib/log';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ key: string }>;
}

/**
 * GET /api/admin/feature-flags/[key]
 *
 * Get a specific feature flag by key
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) return adminUser;
    const { key } = await params;

    const flag = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.key, key),
    });

    if (!flag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    log.info('admin.feature_flags.get', {
      adminId: adminUser.userId,
      key,
    });

    return NextResponse.json({ flag });
  } catch (error) {
    log.error('admin.feature_flags.get_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch feature flag' }, { status: 500 });
  }
}

// Schema for updating a feature flag
const UpdateFeatureFlagSchema = z.object({
  enabled: z.boolean().optional(),
  audience: z
    .object({
      // User targeting
      userIds: z.array(z.string().uuid()).optional(),
      userEmails: z.array(z.string().email()).optional(),
      // Percentage rollout
      percentage: z.number().min(0).max(100).optional(),
      // Organization targeting
      orgIds: z.array(z.string().uuid()).optional(),
      // Role targeting
      roles: z.array(z.string()).optional(),
      // Environment targeting
      environments: z.array(z.enum(['development', 'staging', 'production'])).optional(),
      // Custom rules (JSON expression)
      customRules: z.any().optional(),
    })
    .nullable()
    .optional(),
  description: z.string().max(500).optional(),
  reason: z.string().max(500).optional(), // Audit log reason
});

/**
 * PATCH /api/admin/feature-flags/[key]
 *
 * Update a specific feature flag
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await getAdminUser();
    const { key } = await params;

    // Only super_admin can modify feature flags
    if (!adminUser || adminUser.adminLevel !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only super admins can modify feature flags.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = UpdateFeatureFlagSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { enabled, audience, description, reason } = validationResult.data;

    // Find existing flag
    const existingFlag = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.key, key),
    });

    if (!existingFlag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    // Build update object
    const updates: {
      enabled?: boolean;
      audience?: any;
    } = {};

    if (enabled !== undefined) {
      updates.enabled = enabled;
    }

    if (audience !== undefined) {
      updates.audience = audience
        ? {
            ...audience,
            ...(description && { _description: description }),
          }
        : null;
    } else if (description !== undefined) {
      // Update only description in existing audience
      updates.audience = {
        ...((existingFlag.audience as object) || {}),
        _description: description,
      };
    }

    // Perform update
    await db.update(featureFlags).set(updates).where(eq(featureFlags.key, key));

    log.info('admin.feature_flags.updated', {
      adminId: adminUser.userId,
      key,
      changes: updates,
      previousEnabled: existingFlag.enabled,
    });

    // Audit log
    await db.insert(adminAuditLog).values({
      adminId: adminUser.userId,
      action: 'feature_flag_updated',
      targetType: 'feature_flag',
      targetId: null,
      changes: {
        key,
        updates,
        previousValue: {
          enabled: existingFlag.enabled,
          audience: existingFlag.audience,
        },
      },
      reason: reason || 'Feature flag updated',
    });

    // Fetch and return updated flag
    const updatedFlag = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.key, key),
    });

    return NextResponse.json({
      success: true,
      flag: updatedFlag,
    });
  } catch (error) {
    log.error('admin.feature_flags.update_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/feature-flags/[key]
 *
 * Delete a feature flag
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await getAdminUser();
    const { key } = await params;

    // Only super_admin can delete feature flags
    if (!adminUser || adminUser.adminLevel !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only super admins can delete feature flags.' },
        { status: 403 }
      );
    }

    // Parse optional reason from query string
    const url = new URL(request.url);
    const reason = url.searchParams.get('reason') || 'Feature flag deleted';

    // Find existing flag
    const existingFlag = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.key, key),
    });

    if (!existingFlag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    // Delete the flag
    await db.delete(featureFlags).where(eq(featureFlags.key, key));

    log.info('admin.feature_flags.deleted', {
      adminId: adminUser.userId,
      key,
      previousEnabled: existingFlag.enabled,
    });

    // Audit log
    await db.insert(adminAuditLog).values({
      adminId: adminUser.userId,
      action: 'feature_flag_deleted',
      targetType: 'feature_flag',
      targetId: null,
      changes: {
        key,
        deletedFlag: {
          enabled: existingFlag.enabled,
          audience: existingFlag.audience,
        },
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `Feature flag '${key}' deleted successfully`,
    });
  } catch (error) {
    log.error('admin.feature_flags.delete_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 });
  }
}
