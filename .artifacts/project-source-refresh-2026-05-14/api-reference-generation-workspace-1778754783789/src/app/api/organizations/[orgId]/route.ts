import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { organizations } from '@/db/schema';
import { getCanonicalActiveOrgMembership } from '@/lib/api/auth';
import { requireApiAuthContext } from '@/lib/auth';
import { ensureOrganizationPrincipal } from '@/lib/authz';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import { resolveOrganizationReadiness } from '@/lib/organizations/trust-profile';

const TRUST_PROFILE_KEYS = new Set([
  'displayName',
  'whyWorkMatters',
  'mission',
  'operatingContext',
  'website',
  'principalContext',
]);

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

    const membership = await getCanonicalActiveOrgMembership(authContext.supabase, user.id, orgId);

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
            'Only launch trust profile fields can be updated from this endpoint: displayName, whyWorkMatters, mission, operatingContext, and website.',
          details: { unsupportedFields },
        },
        { status: 400 }
      );
    }

    const membership = await getCanonicalActiveOrgMembership(authContext.supabase, user.id, orgId);
    if (membership?.role !== 'org_owner') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { displayName, whyWorkMatters, mission, operatingContext, website } = body;

    if (displayName !== undefined && (typeof displayName !== 'string' || !displayName.trim())) {
      return NextResponse.json({ error: 'Organization name cannot be empty' }, { status: 400 });
    }

    if (
      whyWorkMatters !== undefined &&
      whyWorkMatters !== null &&
      typeof whyWorkMatters !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Why this work matters must be a string or null' },
        { status: 400 }
      );
    }

    if (mission !== undefined && mission !== null && typeof mission !== 'string') {
      return NextResponse.json({ error: 'Mission must be a string or null' }, { status: 400 });
    }

    if (
      operatingContext !== undefined &&
      operatingContext !== null &&
      typeof operatingContext !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Operating context must be a string or null' },
        { status: 400 }
      );
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
    if (whyWorkMatters !== undefined) {
      updateData.tagline = whyWorkMatters?.trim() || null;
    }
    if (mission !== undefined) {
      updateData.mission = mission?.trim() || null;
    }
    if (operatingContext !== undefined) {
      updateData.workingContext = operatingContext?.trim() || null;
    }
    if (website !== undefined) {
      updateData.website = normalizeOrganizationWebsite(website).value;
    }
    updateData.orgReadiness = resolveOrganizationReadiness({
      displayName: displayName !== undefined ? displayName.trim() : existingOrg.displayName,
      mission: mission !== undefined ? mission?.trim() || null : existingOrg.mission,
      whyWorkMatters:
        whyWorkMatters !== undefined ? whyWorkMatters?.trim() || null : existingOrg.tagline,
      operatingContext:
        operatingContext !== undefined
          ? operatingContext?.trim() || null
          : existingOrg.workingContext,
      website:
        website !== undefined ? normalizeOrganizationWebsite(website).value : existingOrg.website,
      websiteVerifiedAt: existingOrg.websiteVerifiedAt,
      trustStatus: existingOrg.trustStatus,
      verified: existingOrg.verified,
    });

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
