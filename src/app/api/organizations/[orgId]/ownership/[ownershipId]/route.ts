import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { organizationOwnership } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const OwnershipSchema = z.object({
  entityType: z.enum(['individual', 'organization', 'collective', 'government']),
  entityName: z.string().min(1),
  ownershipPercentage: z.string().optional().nullable(),
  controlType: z.enum(['voting_rights', 'board_seat', 'veto_power', 'management', 'other']),
  description: z.string().optional().nullable(),
  isPublic: z.boolean(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; ownershipId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { orgId, ownershipId } = await params;
    const body = await request.json();
    const validated = OwnershipSchema.parse(body);

    const [ownership] = await db
      .update(organizationOwnership)
      .set({ ...validated, updatedAt: new Date() })
      .where(and(eq(organizationOwnership.id, ownershipId), eq(organizationOwnership.orgId, orgId)))
      .returning();

    if (!ownership)
      return NextResponse.json({ error: 'Ownership record not found' }, { status: 404 });
    return NextResponse.json(ownership);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; ownershipId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { orgId, ownershipId } = await params;

    const [deleted] = await db
      .delete(organizationOwnership)
      .where(and(eq(organizationOwnership.id, ownershipId), eq(organizationOwnership.orgId, orgId)))
      .returning();

    if (!deleted)
      return NextResponse.json({ error: 'Ownership record not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
