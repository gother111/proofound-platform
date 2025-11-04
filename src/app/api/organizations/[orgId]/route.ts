import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

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
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
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
    if (displayName !== undefined && !displayName.trim()) {
      return NextResponse.json(
        { error: 'Organization name cannot be empty' },
        { status: 400 }
      );
    }

    // Validate causes limit
    if (causes && Array.isArray(causes) && causes.length > 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 causes allowed' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (legalName !== undefined) updateData.legalName = legalName?.trim() || null;
    if (mission !== undefined) updateData.mission = mission?.trim() || null;
    if (vision !== undefined) updateData.vision = vision?.trim() || null;
    if (causes !== undefined) updateData.causes = causes;
    if (website !== undefined) updateData.website = website?.trim() || null;
    if (tagline !== undefined) updateData.tagline = tagline?.trim() || null;
    if (industry !== undefined) updateData.industry = industry;
    if (organizationSize !== undefined) updateData.organizationSize = organizationSize;
    if (impactArea !== undefined) updateData.impactArea = impactArea;
    if (legalForm !== undefined) updateData.legalForm = legalForm;
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
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

