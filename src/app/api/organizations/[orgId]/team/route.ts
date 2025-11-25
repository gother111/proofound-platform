/**
 * Organization Team API
 * GET /api/organizations/[orgId]/team
 *
 * Fetches team members for an organization
 * Used by TeamRolesCard dashboard widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizationMembers, profiles } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await requireAuth();
    const { orgId } = await params;

    // Verify user is a member
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

    // Fetch team members with profile info
    const members = await db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        status: organizationMembers.status,
        displayName: profiles.displayName,
        handle: profiles.handle,
        avatarUrl: profiles.avatarUrl,
        createdAt: organizationMembers.createdAt,
      })
      .from(organizationMembers)
      .innerJoin(profiles, eq(profiles.id, organizationMembers.userId))
      .where(eq(organizationMembers.orgId, orgId))
      .orderBy(
        sql`case 
          when ${organizationMembers.role} = 'owner' then 1 
          when ${organizationMembers.role} = 'admin' then 2 
          when ${organizationMembers.role} = 'member' then 3 
          else 4 
        end`
      );

    // Get role stats
    const roleStats = await db
      .select({
        role: organizationMembers.role,
        count: sql<number>`count(*)::int`,
      })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.status, 'active')))
      .groupBy(organizationMembers.role);

    const stats = {
      total: roleStats.reduce((sum, r) => sum + (r.count || 0), 0),
      owners: roleStats.find((r) => r.role === 'owner')?.count || 0,
      admins: roleStats.find((r) => r.role === 'admin')?.count || 0,
      members: roleStats.find((r) => r.role === 'member')?.count || 0,
      viewers: roleStats.find((r) => r.role === 'viewer')?.count || 0,
    };

    return NextResponse.json({
      members,
      stats,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team members',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
