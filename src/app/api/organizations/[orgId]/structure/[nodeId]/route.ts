import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizationStructure, organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

// PUT - Update a structure node
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; nodeId: string }> }
) {
  try {
    const user = await requireAuth();
    const { orgId, nodeId } = await params;

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

    // Verify the node exists and belongs to this org
    const existing = await db
      .select()
      .from(organizationStructure)
      .where(
        and(
          eq(organizationStructure.id, nodeId),
          eq(organizationStructure.orgId, orgId)
        )
      )
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Structure node not found' }, { status: 404 });
    }

    const body = await request.json();
    const { entityType, name, description, teamSize, focusArea, parentId } = body;

    // Validate entity type if provided
    if (entityType) {
      const validTypes = ['executive_team', 'department', 'team', 'working_group'];
      if (!validTypes.includes(entityType)) {
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
      }
    }

    // Prevent circular parent relationships
    if (parentId && parentId !== '') {
      // Can't be parent of itself
      if (parentId === nodeId) {
        return NextResponse.json(
          { error: 'A node cannot be its own parent' },
          { status: 400 }
        );
      }

      // Check if parentId exists and belongs to same org
      const parent = await db
        .select()
        .from(organizationStructure)
        .where(
          and(
            eq(organizationStructure.id, parentId),
            eq(organizationStructure.orgId, orgId)
          )
        )
        .limit(1);

      if (!parent || parent.length === 0) {
        return NextResponse.json({ error: 'Parent node not found' }, { status: 400 });
      }

      // Prevent circular reference - check if parentId is a descendant of nodeId
      const isDescendant = async (ancestorId: string, nodeToCheck: string): Promise<boolean> => {
        if (ancestorId === nodeToCheck) return true;

        const children = await db
          .select()
          .from(organizationStructure)
          .where(eq(organizationStructure.parentId, nodeToCheck));

        for (const child of children) {
          if (await isDescendant(ancestorId, child.id)) {
            return true;
          }
        }

        return false;
      };

      if (await isDescendant(nodeId, parentId)) {
        return NextResponse.json(
          { error: 'Cannot create circular parent relationship' },
          { status: 400 }
        );
      }
    }

    // Update the node
    const [updatedNode] = await db
      .update(organizationStructure)
      .set({
        ...(entityType && { entityType }),
        ...(name && { name: name.trim() }),
        description: description?.trim() || null,
        teamSize: teamSize ? parseInt(teamSize, 10) : null,
        focusArea: focusArea?.trim() || null,
        parentId: parentId === '' ? null : parentId || existing[0].parentId,
        updatedAt: new Date(),
      })
      .where(eq(organizationStructure.id, nodeId))
      .returning();

    return NextResponse.json(updatedNode);
  } catch (error) {
    console.error('Error updating structure node:', error);
    return NextResponse.json(
      { error: 'Failed to update structure node' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a structure node
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; nodeId: string }> }
) {
  try {
    const user = await requireAuth();
    const { orgId, nodeId } = await params;

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

    // Verify the node exists and belongs to this org
    const existing = await db
      .select()
      .from(organizationStructure)
      .where(
        and(
          eq(organizationStructure.id, nodeId),
          eq(organizationStructure.orgId, orgId)
        )
      )
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Structure node not found' }, { status: 404 });
    }

    // Check if this node has children
    const children = await db
      .select()
      .from(organizationStructure)
      .where(eq(organizationStructure.parentId, nodeId))
      .limit(1);

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a node with children. Please delete or reassign children first.' },
        { status: 400 }
      );
    }

    // Delete the node
    await db
      .delete(organizationStructure)
      .where(eq(organizationStructure.id, nodeId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting structure node:', error);
    return NextResponse.json(
      { error: 'Failed to delete structure node' },
      { status: 500 }
    );
  }
}

