import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizationProjects, organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

// PUT - Update an impact entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; entryId: string }> }
) {
  try {
    const user = await requireAuth();
    const { orgId, entryId } = await params;

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

    // Verify the entry exists and belongs to this org
    const existing = await db
      .select()
      .from(organizationProjects)
      .where(
        and(
          eq(organizationProjects.id, entryId),
          eq(organizationProjects.orgId, orgId)
        )
      )
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Impact entry not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      impactCreated,
      businessValue,
      outcomes,
      startDate,
      endDate,
      status,
    } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['planning', 'active', 'completed', 'on_hold', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    // Update the entry
    const [updatedEntry] = await db
      .update(organizationProjects)
      .set({
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        ...(impactCreated && { impactCreated: impactCreated.trim() }),
        businessValue: businessValue?.trim() || existing[0].businessValue,
        outcomes: outcomes?.trim() || existing[0].outcomes,
        ...(startDate && { startDate }),
        endDate: endDate === '' ? null : endDate || existing[0].endDate,
        ...(status && { status }),
        updatedAt: new Date(),
      })
      .where(eq(organizationProjects.id, entryId))
      .returning();

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error updating impact entry:', error);
    return NextResponse.json(
      { error: 'Failed to update impact entry' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an impact entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; entryId: string }> }
) {
  try {
    const user = await requireAuth();
    const { orgId, entryId } = await params;

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

    // Verify the entry exists and belongs to this org
    const existing = await db
      .select()
      .from(organizationProjects)
      .where(
        and(
          eq(organizationProjects.id, entryId),
          eq(organizationProjects.orgId, orgId)
        )
      )
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Impact entry not found' }, { status: 404 });
    }

    // Delete the entry
    await db
      .delete(organizationProjects)
      .where(eq(organizationProjects.id, entryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting impact entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete impact entry' },
      { status: 500 }
    );
  }
}

