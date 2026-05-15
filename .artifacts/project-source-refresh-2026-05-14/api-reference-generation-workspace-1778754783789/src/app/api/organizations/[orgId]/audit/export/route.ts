import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { auditLogs, organizationMembers } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import {
  authorize,
  isActiveMembershipState,
  normalizeAuthorizedOrgRole,
  type OrgRole,
} from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgId } = await params;
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.userId, authContext.user.id)
    ),
    columns: { id: true, role: true, state: true },
  });

  const orgRole = isActiveMembershipState(membership?.state)
    ? (normalizeAuthorizedOrgRole(membership?.role) as OrgRole | null)
    : null;

  if (
    !authorize({
      resource: 'org_audit_logs',
      action: 'export',
      orgRole,
    }).allowed
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '500'), 1000);

  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.orgId, orgId),
    orderBy: [desc(auditLogs.createdAt)],
    limit,
  });

  const body = JSON.stringify(
    {
      orgId,
      exportedAt: new Date().toISOString(),
      exportedBy: authContext.user.id,
      principalType: 'organization',
      actorMembershipId: membership?.id ?? null,
      logs,
    },
    null,
    2
  );

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="proofound-org-audit-${orgId}.json"`,
    },
  });
}
