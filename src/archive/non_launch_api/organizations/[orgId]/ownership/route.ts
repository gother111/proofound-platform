import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { organizationOwnership } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isActiveOrgMember } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

const OwnershipSchema = z.object({
  entityType: z.enum(['individual', 'organization', 'collective', 'government']),
  entityName: z.string().min(1, 'Entity name is required'),
  ownershipPercentage: z.string().optional().nullable(),
  controlType: z.enum(['voting_rights', 'board_seat', 'veto_power', 'management', 'other']),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().default(true),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const { orgId } = await params;

    const canRead = await isActiveOrgMember(supabase as any, user.id, orgId, [
      'org_owner',
      'org_manager',
      'org_reviewer',
    ]);
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ownership = await db
      .select()
      .from(organizationOwnership)
      .where(eq(organizationOwnership.orgId, orgId))
      .orderBy(organizationOwnership.createdAt);

    return NextResponse.json({ ownership });
  } catch (error) {
    console.error('Error fetching ownership:', error);
    return NextResponse.json({ error: 'Failed to fetch ownership' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const { orgId } = await params;
    const body = await request.json();
    const validated = OwnershipSchema.parse(body);

    const canWrite = await isActiveOrgMember(supabase as any, user.id, orgId, ['org_owner']);
    if (!canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [ownership] = await db
      .insert(organizationOwnership)
      .values({
        orgId,
        ...validated,
      })
      .returning();

    return NextResponse.json(ownership, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating ownership:', error);
    return NextResponse.json({ error: 'Failed to create ownership' }, { status: 500 });
  }
}
