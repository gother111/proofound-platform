/**
 * POST /api/admin/organizations/[orgId]/verify
 *
 * Transition an organization trust tier.
 * Requires: break-glass platform admin access with an audited reason.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireBreakGlassPlatformAdminJson } from '@/lib/authz';
import { db } from '@/db';
import { organizations, organizationTrustTierTransitions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminActionInTransaction } from '@/lib/audit/admin-logger';

const OrgTrustTierSchema = z.object({
  trustTier: z.enum(['unreviewed', 'basic_trusted', 'reviewed', 'restricted']).optional(),
  verified: z.boolean().optional(),
  reasonCode: z.string().trim().min(1).max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

function coerceCurrentTier(org: {
  orgTrustTier?: string | null;
  trustStatus?: string | null;
  verified?: boolean | null;
}) {
  if (
    org.orgTrustTier === 'unreviewed' ||
    org.orgTrustTier === 'basic_trusted' ||
    org.orgTrustTier === 'reviewed' ||
    org.orgTrustTier === 'restricted'
  ) {
    return org.orgTrustTier;
  }

  if (org.verified || org.trustStatus === 'platform_reviewed') {
    return 'reviewed';
  }

  if (org.trustStatus === 'domain_verified') {
    return 'basic_trusted';
  }

  return 'unreviewed';
}

function mapCompatibilityTrustStatus(
  trustTier: 'unreviewed' | 'basic_trusted' | 'reviewed' | 'restricted'
) {
  switch (trustTier) {
    case 'reviewed':
      return 'platform_reviewed' as const;
    case 'basic_trusted':
      return 'domain_verified' as const;
    case 'restricted':
    case 'unreviewed':
    default:
      return 'unverified' as const;
  }
}

function buildTrustTierMessage(
  trustTier: 'unreviewed' | 'basic_trusted' | 'reviewed' | 'restricted'
) {
  switch (trustTier) {
    case 'basic_trusted':
      return 'Organization set to Basic trusted.';
    case 'reviewed':
      return 'Organization set to Reviewed.';
    case 'restricted':
      return 'Organization set to Restricted. Publish and intro actions are paused.';
    case 'unreviewed':
    default:
      return 'Organization set to Unreviewed.';
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const breakGlass = await requireBreakGlassPlatformAdminJson(request, {
      action: 'org_trust_tier.break_glass_update',
      targetType: 'organization',
      targetId: orgId,
      metadata: {
        route: '/api/admin/organizations/[orgId]/verify',
      },
    });

    if (breakGlass instanceof NextResponse) {
      return breakGlass;
    }

    const adminUser = breakGlass.adminUser;
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const parsedBody = OrgTrustTierSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          issues: parsedBody.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
    const trustTier =
      body.trustTier ??
      (body.verified === true ? 'reviewed' : body.verified === false ? 'unreviewed' : null);

    if (!trustTier) {
      return NextResponse.json({ error: 'trustTier or verified is required' }, { status: 400 });
    }

    // Get current organization
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const previousTier = coerceCurrentTier(org);
    const compatibilityTrustStatus = mapCompatibilityTrustStatus(trustTier);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(organizations)
        .set({
          verified: trustTier === 'reviewed',
          trustStatus: compatibilityTrustStatus,
          trustStatusUpdatedAt: now,
          orgTrustTier: trustTier,
          orgTrustTierReasonCode: body.reasonCode ?? null,
          orgTrustTierUpdatedAt: now,
          updatedAt: now,
        })
        .where(eq(organizations.id, orgId));

      await tx.insert(organizationTrustTierTransitions).values({
        orgId,
        previousTier,
        newTier: trustTier,
        reasonCode: body.reasonCode ?? null,
        actorType: 'platform_admin',
        actorId: adminUser.userId,
        metadata: {
          breakGlassReason: breakGlass.reason,
          note: body.note ?? null,
          compatibilityTrustStatus,
        },
        createdAt: now,
      });

      await logAdminActionInTransaction(tx, {
        adminId: adminUser.userId,
        action: 'set_org_trust_tier',
        targetType: 'organization',
        targetId: orgId,
        changes: {
          previousTier,
          newTier: trustTier,
          previousCompatibilityStatus: org.trustStatus ?? 'unverified',
          newCompatibilityStatus: compatibilityTrustStatus,
        },
        metadata: {
          organizationName: org.displayName,
          breakGlassReason: breakGlass.reason,
          reasonCode: body.reasonCode ?? null,
          note: body.note ?? null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      trustTier,
      message: buildTrustTierMessage(trustTier),
    });
  } catch (error) {
    console.error('Failed to update organization verification:', error);

    // Check if this is a redirect
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return NextResponse.json(
      { error: 'Failed to update organization verification' },
      { status: 500 }
    );
  }
}
