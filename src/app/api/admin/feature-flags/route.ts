/**
 * Feature Flags Admin API
 *
 * GET - List all feature flags
 * POST - Create or update a feature flag
 *
 * Authorization:
 * - GET: platform_admin or super_admin
 * - POST: super_admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';
import { db } from '@/db';
import { featureFlags, adminAuditLog } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { log } from '@/lib/log';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/feature-flags
 *
 * List all feature flags
 */
export async function GET() {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const flags = await db.select().from(featureFlags).orderBy(asc(featureFlags.key));

    log.info('admin.feature_flags.list', {
      adminId: adminUser.userId,
      flagCount: flags.length,
    });

    return NextResponse.json({
      flags,
      count: flags.length,
    });
  } catch (error) {
    log.error('admin.feature_flags.list_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

// Schema for creating/updating a feature flag
const FeatureFlagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z][a-z0-9_]*$/, {
      message:
        'Key must start with lowercase letter and contain only lowercase letters, numbers, and underscores',
    }),
  enabled: z.boolean().default(false),
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
});

/**
 * POST /api/admin/feature-flags
 *
 * Create or update a feature flag (upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();

    // Only super_admin can modify feature flags
    if (!adminUser || adminUser.adminLevel !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only super admins can modify feature flags.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = FeatureFlagSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { key, enabled, audience, description } = validationResult.data;

    // Check if flag exists
    const existingFlag = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.key, key),
    });

    let action: 'created' | 'updated';
    let previousValue: any = null;

    if (existingFlag) {
      // Update existing flag
      previousValue = {
        enabled: existingFlag.enabled,
        audience: existingFlag.audience,
      };

      await db
        .update(featureFlags)
        .set({
          enabled,
          audience: audience
            ? {
                ...audience,
                ...(description && { _description: description }),
              }
            : null,
        })
        .where(eq(featureFlags.key, key));

      action = 'updated';

      log.info('admin.feature_flags.updated', {
        adminId: adminUser.userId,
        key,
        enabled,
        previousEnabled: existingFlag.enabled,
      });
    } else {
      // Create new flag
      await db.insert(featureFlags).values({
        key,
        enabled,
        audience: audience
          ? {
              ...audience,
              ...(description && { _description: description }),
            }
          : null,
      });

      action = 'created';

      log.info('admin.feature_flags.created', {
        adminId: adminUser.userId,
        key,
        enabled,
      });
    }

    // Audit log
    await db.insert(adminAuditLog).values({
      adminId: adminUser.userId,
      action: `feature_flag_${action}`,
      targetType: 'feature_flag',
      targetId: null, // Feature flags use string keys
      changes: {
        key,
        enabled,
        audience,
        previousValue,
      },
      reason: body.reason || `Feature flag ${action}`,
    });

    // Fetch and return the updated/created flag
    const flag = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.key, key),
    });

    return NextResponse.json({
      success: true,
      action,
      flag,
    });
  } catch (error) {
    log.error('admin.feature_flags.create_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to create/update feature flag' }, { status: 500 });
  }
}
