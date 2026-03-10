import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { organizationMembers, organizations } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { ensureOrganizationPrincipal, normalizeAuthorizedOrgRole } from '@/lib/authz';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    const { orgId } = await params;

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.state, 'active')
      ),
      columns: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { workCulture: true },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ workCulture: org.workCulture || {} });
  } catch (error) {
    console.error('Error in culture GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    const { orgId } = await params;
    const body = await request.json();
    const principal = ensureOrganizationPrincipal(body.principalContext);

    if (!principal.ok || principal.context.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Explicit organization principal is required' },
        { status: 403 }
      );
    }

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.state, 'active')
      ),
      columns: { role: true },
    });

    const membershipRole = normalizeAuthorizedOrgRole(membership?.role);
    if (!membershipRole || !['org_owner', 'org_manager'].includes(membershipRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { principalContext: _principalContext, ...cultureData } = body;
    const updatedCulture = {
      ...cultureData,
      lastUpdated: new Date().toISOString(),
    };

    const [updated] = await db
      .update(organizations)
      .set({
        workCulture: updatedCulture,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning({ workCulture: organizations.workCulture });

    if (!updated) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ workCulture: updated.workCulture || {} });
  } catch (error) {
    console.error('Error in culture PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
