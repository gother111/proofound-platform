import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { requireBreakGlassPlatformAdminJson } from '@/lib/authz';

export const dynamic = 'force-dynamic';

type OrgAuditLogRow = typeof auditLogs.$inferSelect;

function toPreviewTargetId(log: OrgAuditLogRow, hasProtectedMetadata: boolean) {
  const targetId = log.targetId?.trim();
  if (!targetId) {
    return null;
  }

  if (hasProtectedMetadata || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetId)) {
    return '[protected target]';
  }

  return targetId;
}

function toOrgAuditPreviewEntry(log: OrgAuditLogRow) {
  const hasProtectedMetadata = Boolean(
    log.meta &&
      typeof log.meta === 'object' &&
      Object.keys(log.meta as Record<string, unknown>).length > 0
  );

  return {
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: toPreviewTargetId(log, hasProtectedMetadata),
    createdAt: log.createdAt,
    riskLabels: hasProtectedMetadata
      ? ['Protected metadata withheld', 'Use raw export only for incident review']
      : ['No protected metadata on row'],
  };
}

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
  const download = url.searchParams.get('download') === 'true';
  const limit = Math.min(Number(url.searchParams.get('limit') || (download ? '200' : '25')), 1000);

  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.orgId, orgId),
    orderBy: [desc(auditLogs.createdAt)],
    limit,
  });

  const payload = {
    orgId,
    principalType: 'trust_admin',
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

  return NextResponse.json({
    orgId,
    principalType: 'trust_admin',
    breakGlassReason: breakGlass.reason,
    accessedAt: payload.accessedAt,
    preview: {
      mode: 'minimum_necessary',
      limit,
      returned: logs.length,
      rawExportAvailableWithDownloadFlag: true,
      warning:
        'Raw org audit metadata is withheld from the dashboard preview. Use download=true only for approved incident review.',
    },
    logs: logs.map(toOrgAuditPreviewEntry),
  });
}
