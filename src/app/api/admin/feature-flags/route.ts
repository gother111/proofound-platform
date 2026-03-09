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
import { adminAuditLog } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { log } from '@/lib/log';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import {
  FeatureFlagControlTypeSchema,
  FeatureFlagTaxonomySchema,
} from '@/lib/contracts/launch-operations';
import { getRows } from '@/lib/db/rows';

export const dynamic = 'force-dynamic';

type FeatureFlagRecord = {
  key: string;
  enabled: boolean;
  audience: Record<string, unknown> | null;
  description: string | null;
  taxonomy: string | null;
  controlType: string | null;
  owner: string | null;
  reason: string | null;
  revisitAfter: string | null;
  metadata: Record<string, unknown> | null;
  updatedAt: string | null;
};

async function listFeatureFlags(): Promise<FeatureFlagRecord[]> {
  const result = await db.execute(sql`
    select
      key,
      enabled,
      audience,
      description,
      taxonomy,
      control_type as "controlType",
      owner,
      reason,
      revisit_after as "revisitAfter",
      metadata,
      updated_at as "updatedAt"
    from feature_flags
    order by key asc
  `);

  return getRows(result as { rows?: FeatureFlagRecord[] }) as FeatureFlagRecord[];
}

async function getFeatureFlagByKey(key: string): Promise<FeatureFlagRecord | null> {
  const result = await db.execute(sql`
    select
      key,
      enabled,
      audience,
      description,
      taxonomy,
      control_type as "controlType",
      owner,
      reason,
      revisit_after as "revisitAfter",
      metadata,
      updated_at as "updatedAt"
    from feature_flags
    where key = ${key}
    limit 1
  `);

  const rows = getRows(result as { rows?: FeatureFlagRecord[] }) as FeatureFlagRecord[];
  return rows[0] ?? null;
}

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

    const flags = await listFeatureFlags();

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
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, {
      message: 'Key must start with a letter and contain only letters, numbers, and underscores',
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
  taxonomy: FeatureFlagTaxonomySchema.optional(),
  controlType: FeatureFlagControlTypeSchema.optional(),
  owner: z.string().trim().min(2).max(120).optional(),
  reason: z.string().trim().min(3).max(400).optional(),
  revisitAfter: z.string().datetime().nullable().optional(),
  metadata: z.record(z.any()).optional(),
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

    const {
      key,
      enabled,
      audience,
      description,
      taxonomy,
      controlType,
      owner,
      reason,
      revisitAfter,
      metadata,
    } = validationResult.data;

    // Check if flag exists
    const existingFlag = await getFeatureFlagByKey(key);

    let action: 'created' | 'updated';
    let previousValue: any = null;

    if (existingFlag) {
      // Update existing flag
      previousValue = {
        enabled: existingFlag.enabled,
        audience: existingFlag.audience,
        description: existingFlag.description,
        taxonomy: existingFlag.taxonomy,
        controlType: existingFlag.controlType,
        owner: existingFlag.owner,
        reason: existingFlag.reason,
        revisitAfter: existingFlag.revisitAfter,
        metadata: existingFlag.metadata,
      };

      await db.execute(sql`
          update feature_flags
          set
            enabled = ${enabled},
            audience = ${JSON.stringify(audience ?? null)}::jsonb,
            description = ${description ?? existingFlag.description ?? null},
            taxonomy = ${taxonomy ?? existingFlag.taxonomy ?? null},
            control_type = ${controlType ?? existingFlag.controlType ?? null},
            owner = ${owner ?? existingFlag.owner ?? null},
            reason = ${reason ?? existingFlag.reason ?? null},
            revisit_after = ${revisitAfter ? new Date(revisitAfter).toISOString() : null}::timestamptz,
            metadata = ${JSON.stringify({
              ...((existingFlag.metadata as Record<string, unknown> | null) ?? {}),
              ...(metadata ?? {}),
            })}::jsonb,
            updated_at = now()
          where key = ${key}
        `);

      action = 'updated';

      log.info('admin.feature_flags.updated', {
        adminId: adminUser.userId,
        key,
        enabled,
        previousEnabled: existingFlag.enabled,
      });
    } else {
      // Create new flag
      await db.execute(sql`
        insert into feature_flags (
          key,
          enabled,
          audience,
          description,
          taxonomy,
          control_type,
          owner,
          reason,
          revisit_after,
          metadata,
          updated_at
        )
        values (
          ${key},
          ${enabled},
          ${JSON.stringify(audience ?? null)}::jsonb,
          ${description ?? null},
          ${taxonomy ?? null},
          ${controlType ?? null},
          ${owner ?? null},
          ${reason ?? null},
          ${revisitAfter ? new Date(revisitAfter).toISOString() : null}::timestamptz,
          ${JSON.stringify(metadata ?? {})}::jsonb,
          now()
        )
      `);

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
        description,
        taxonomy,
        controlType,
        owner,
        revisitAfter,
        metadata,
        previousValue,
      },
      reason: reason || `Feature flag ${action}`,
    });

    // Fetch and return the updated/created flag
    const flag = await getFeatureFlagByKey(key);

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
