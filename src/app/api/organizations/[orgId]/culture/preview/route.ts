import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

// GET - Get culture preview (what candidates see)
export async function GET(
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

    // Fetch organization with culture
    const [org] = await db
      .select({
        displayName: organizations.displayName,
        mission: organizations.mission,
        vision: organizations.vision,
        values: organizations.values,
        workCulture: organizations.workCulture,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Return preview data (what candidates would see)
    // This could be filtered based on visibility settings in the future
    return NextResponse.json({
      preview: {
        displayName: org.displayName,
        mission: org.mission,
        vision: org.vision,
        values: org.values,
        culture: org.workCulture,
      },
    });
  } catch (error) {
    console.error('Error fetching culture preview:', error);
    return NextResponse.json({ error: 'Failed to fetch culture preview' }, { status: 500 });
  }
}
