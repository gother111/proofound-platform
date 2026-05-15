import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { resolveGcpCvOcrConfig } from '@/lib/expertise/gcp-cv-ocr-config';
import { resolveGcpCvOcrSafeStatus } from '@/lib/expertise/gcp-cv-ocr-status';
import { isProofArtifactOcrEligible } from '@/lib/proof-artifacts/text-extraction';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const betaContext = await loadUserBetaContext(authContext.user.id);
    const {
      data: { user: authUser },
    } = await authContext.supabase.auth.getUser();

    const visible = await isProofArtifactOcrEligible({
      userId: authContext.user.id,
      userEmail: authUser?.email ?? null,
      orgIds: betaContext.orgIds,
      roles: betaContext.roles,
    });
    const config = resolveGcpCvOcrConfig(process.env);
    const safeStatus = await resolveGcpCvOcrSafeStatus();

    return NextResponse.json(
      {
        visible,
        available: visible && config.available,
        status: safeStatus.status,
        unavailableReason: visible && config.unavailableReason ? 'temporarily_unavailable' : null,
        limits: {
          maxFileSizeMb: Math.min(config.maxFileSizeMb || 5, 5),
          maxPages: Math.min(config.maxPages || 4, 4),
          allowedMimeTypes: config.allowedMimeTypes,
        },
      },
      {
        headers: {
          'cache-control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('proof_artifact_ocr.status.failed', error);
    return NextResponse.json({ error: 'Failed to load OCR beta status' }, { status: 500 });
  }
}

async function loadUserBetaContext(userId: string) {
  const memberships = await db
    .select({
      orgId: organizationMembers.orgId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.state, 'active')));

  return {
    orgIds: memberships.map((membership) => membership.orgId),
    roles: memberships.map((membership) => membership.role),
  };
}
