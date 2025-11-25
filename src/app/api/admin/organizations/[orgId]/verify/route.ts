/**
 * POST /api/admin/organizations/[orgId]/verify
 *
 * Verify or unverify an organization
 * Requires: platform_admin or super_admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction } from '@/lib/audit/admin-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const adminUser = await requirePlatformAdmin();
    const { orgId } = await params;
    const body = await request.json();
    const { verified } = body;

    // Get current organization
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update verification status
    await db
      .update(organizations)
      .set({
        verified,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    // Log the action
    await logAdminAction({
      adminId: adminUser.userId,
      action: verified ? 'verify_organization' : 'unverify_organization',
      targetType: 'organization',
      targetId: orgId,
      changes: {
        previousStatus: org.verified ? 'verified' : 'unverified',
        newStatus: verified ? 'verified' : 'unverified',
      },
      metadata: {
        organizationName: org.displayName,
      },
    });

    return NextResponse.json({
      success: true,
      message: verified ? 'Organization verified' : 'Verification removed',
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
