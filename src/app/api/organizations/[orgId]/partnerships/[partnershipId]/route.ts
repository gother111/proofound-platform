import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizationPartnerships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PartnershipSchema = z.object({
  partnerName: z.string().min(1),
  partnerType: z.enum(['company', 'ngo', 'government', 'academic', 'network', 'other']),
  partnershipScope: z.string().min(1),
  impactCreated: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['active', 'completed', 'suspended']),
  isVerified: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; partnershipId: string }> }
) {
  try {
    await requireAuth();
    const { orgId, partnershipId } = await params;
    const body = await request.json();
    const validated = PartnershipSchema.parse(body);

    const [partnership] = await db
      .update(organizationPartnerships)
      .set({ ...validated, updatedAt: new Date() })
      .where(
        and(
          eq(organizationPartnerships.id, partnershipId),
          eq(organizationPartnerships.orgId, orgId)
        )
      )
      .returning();

    if (!partnership) return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    return NextResponse.json(partnership);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; partnershipId: string }> }
) {
  try {
    await requireAuth();
    const { orgId, partnershipId } = await params;

    const [deleted] = await db
      .delete(organizationPartnerships)
      .where(
        and(
          eq(organizationPartnerships.id, partnershipId),
          eq(organizationPartnerships.orgId, orgId)
        )
      )
      .returning();

    if (!deleted) return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
