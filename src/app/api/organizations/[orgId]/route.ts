import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import { LEGAL_FORM_VALUES, ORGANIZATION_SIZE_VALUES } from '@/lib/organizations/profile-options';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ORGANIZATION_SIZE_SET = new Set<string>(ORGANIZATION_SIZE_VALUES);
const LEGAL_FORM_SET = new Set<string>(LEGAL_FORM_VALUES);

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// GET - Fetch organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await requireAuth();
    const { orgId } = await params;

    // Verify user is a member of the organization
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.status, 'active')
        )
      )
      .limit(1);

    if (!membership || membership.length === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Fetch organization
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}

// PUT - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await requireAuth();
    const { orgId } = await params;

    // Verify user has admin or owner role
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.status, 'active')
        )
      )
      .limit(1);

    if (
      !membership ||
      membership.length === 0 ||
      !['owner', 'admin'].includes(membership[0].role)
    ) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      displayName,
      legalName,
      mission,
      vision,
      causes,
      website,
      tagline,
      industry,
      organizationSize,
      impactArea,
      legalForm,
      foundedDate,
      values,
    } = body;

    // Validate displayName if provided
    if (displayName !== undefined && (typeof displayName !== 'string' || !displayName.trim())) {
      return NextResponse.json({ error: 'Organization name cannot be empty' }, { status: 400 });
    }

    if (website !== undefined && website !== null && typeof website !== 'string') {
      return NextResponse.json({ error: 'Website must be a string or null' }, { status: 400 });
    }

    if (causes !== undefined) {
      if (causes !== null && !Array.isArray(causes)) {
        return NextResponse.json(
          { error: 'Causes must be an array of non-empty strings or null' },
          { status: 400 }
        );
      }

      if (Array.isArray(causes)) {
        if (causes.length > 5) {
          return NextResponse.json({ error: 'Maximum of 5 causes allowed' }, { status: 400 });
        }

        const hasInvalidCause = causes.some((cause) => typeof cause !== 'string' || !cause.trim());
        if (hasInvalidCause) {
          return NextResponse.json(
            { error: 'Causes must contain non-empty strings only' },
            { status: 400 }
          );
        }
      }
    }

    if (foundedDate !== undefined) {
      if (foundedDate !== null && typeof foundedDate !== 'string') {
        return NextResponse.json(
          { error: 'Founded date must be a YYYY-MM-DD string or null' },
          { status: 400 }
        );
      }

      if (typeof foundedDate === 'string' && !isValidIsoDate(foundedDate)) {
        return NextResponse.json(
          { error: 'Founded date must be a valid YYYY-MM-DD date' },
          { status: 400 }
        );
      }
    }

    if (organizationSize !== undefined) {
      if (organizationSize !== null && typeof organizationSize !== 'string') {
        return NextResponse.json(
          { error: 'Organization size must be a valid option or null' },
          { status: 400 }
        );
      }

      const normalizedOrganizationSize = organizationSize?.trim() || null;
      if (
        normalizedOrganizationSize !== null &&
        !ORGANIZATION_SIZE_SET.has(normalizedOrganizationSize)
      ) {
        return NextResponse.json(
          { error: 'Organization size must be one of the supported values' },
          { status: 400 }
        );
      }
    }

    if (legalForm !== undefined) {
      if (legalForm !== null && typeof legalForm !== 'string') {
        return NextResponse.json(
          { error: 'Legal form must be a valid option or null' },
          { status: 400 }
        );
      }

      const normalizedLegalForm = legalForm?.trim() || null;
      if (normalizedLegalForm !== null && !LEGAL_FORM_SET.has(normalizedLegalForm)) {
        return NextResponse.json(
          { error: 'Legal form must be one of the supported values' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (legalName !== undefined) updateData.legalName = legalName?.trim() || null;
    if (mission !== undefined) updateData.mission = mission?.trim() || null;
    if (vision !== undefined) updateData.vision = vision?.trim() || null;
    if (causes !== undefined) {
      updateData.causes = Array.isArray(causes) ? causes.map((cause) => cause.trim()) : causes;
    }
    if (website !== undefined) {
      const normalizedWebsite = normalizeOrganizationWebsite(website);
      if (normalizedWebsite.error) {
        return NextResponse.json({ error: normalizedWebsite.error }, { status: 400 });
      }
      updateData.website = normalizedWebsite.value;
    }
    if (tagline !== undefined) updateData.tagline = tagline?.trim() || null;
    if (industry !== undefined) updateData.industry = industry?.trim() || null;
    if (organizationSize !== undefined)
      updateData.organizationSize = organizationSize?.trim() || null;
    if (impactArea !== undefined) updateData.impactArea = impactArea?.trim() || null;
    if (legalForm !== undefined) updateData.legalForm = legalForm?.trim() || null;
    if (foundedDate !== undefined) updateData.foundedDate = foundedDate;
    if (values !== undefined) updateData.values = values;

    // Update organization
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
