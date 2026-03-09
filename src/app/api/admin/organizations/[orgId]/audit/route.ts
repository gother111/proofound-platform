import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { requireBreakGlassPlatformAdminJson } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const breakGlass = await requireBreakGlassPlatformAdminJson(request, {
    action: 'org_audit.break_glass_read',
    targetType: 'organization',
    targetId: orgId,
    metadata: {
      route: '/api/admin/organizations/[orgId]/audit',
    },
  });

  if (breakGlass instanceof NextResponse) {
    return breakGlass;
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '200'), 1000);
  const download = url.searchParams.get('download') === 'true';

  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.orgId, orgId),
    orderBy: [desc(auditLogs.createdAt)],
    limit,
  });

  const payload = {
    orgId,
    breakGlassReason: breakGlass.reason,
    accessedAt: new Date().toISOString(),
    logs,
  };

  if (download) {
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="proofound-admin-org-audit-${orgId}.json"`,
      },
    });
  }

  return NextResponse.json(payload);
}
