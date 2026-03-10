import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { organizationMembers, organizations } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { ensureOrganizationPrincipal, normalizeAuthorizedOrgRole } from '@/lib/authz';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';

const TRUST_PROFILE_KEYS = new Set([
  'displayName',
  'tagline',
  'mission',
  'website',
  'values',
  'principalContext',
]);

function parseValuesPayload(values: unknown): { value?: string[] | null; error?: string } {
  if (values === undefined) {
    return {};
  }

  if (values === null) {
    return { value: null };
  }

  if (!Array.isArray(values)) {
    return { error: 'Values must be an array of non-empty strings or null' };
  }

  if (values.length > 5) {
    return { error: 'Maximum of 5 values allowed' };
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) {
      return { error: 'Values must contain non-empty strings only' };
    }

    const trimmed = value.trim();
    if (seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return { value: normalized };
}

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
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
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

    const unsupportedFields = Object.keys(body).filter((key) => !TRUST_PROFILE_KEYS.has(key));
    if (unsupportedFields.length > 0) {
      return NextResponse.json(
        {
          error:
            'Only launch trust profile fields can be updated from this endpoint: displayName, tagline, mission, website, and values.',
          details: { unsupportedFields },
        },
        { status: 400 }
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
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { displayName, tagline, mission, website, values } = body;
    const parsedValues = parseValuesPayload(values);
    if (parsedValues.error) {
      return NextResponse.json({ error: parsedValues.error }, { status: 400 });
    }

    if (displayName !== undefined && (typeof displayName !== 'string' || !displayName.trim())) {
      return NextResponse.json({ error: 'Organization name cannot be empty' }, { status: 400 });
    }

    if (tagline !== undefined && tagline !== null && typeof tagline !== 'string') {
      return NextResponse.json({ error: 'Tagline must be a string or null' }, { status: 400 });
    }

    if (mission !== undefined && mission !== null && typeof mission !== 'string') {
      return NextResponse.json({ error: 'Mission must be a string or null' }, { status: 400 });
    }

    if (website !== undefined) {
      if (website !== null && typeof website !== 'string') {
        return NextResponse.json({ error: 'Website must be a string or null' }, { status: 400 });
      }
      const normalizedWebsite = normalizeOrganizationWebsite(website);
      if (normalizedWebsite.error) {
        return NextResponse.json({ error: normalizedWebsite.error }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName.trim();
    }
    if (tagline !== undefined) {
      updateData.tagline = tagline?.trim() || null;
    }
    if (mission !== undefined) {
      updateData.mission = mission?.trim() || null;
    }
    if (website !== undefined) {
      updateData.website = normalizeOrganizationWebsite(website).value;
    }
    if (values !== undefined) {
      updateData.values = parsedValues.value ?? null;
    }

    const [updatedOrg] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, orgId))
      .returning();

    return NextResponse.json({ organization: updatedOrg });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}
