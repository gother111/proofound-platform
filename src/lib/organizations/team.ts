import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { organizationMembers, profiles } from '@/db/schema';
import {
  normalizeAuthorizedOrgRole,
  normalizeMembershipState,
  type CanonicalOrgMembershipState,
  type OrgRole,
} from '@/lib/authz';

export type OrgTeamMember = {
  userId: string;
  role: OrgRole;
  status: CanonicalOrgMembershipState;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export type OrgTeamStats = {
  total: number;
  byRole: Record<OrgRole, number>;
};

export type OrgTeamData = {
  members: OrgTeamMember[];
  stats: OrgTeamStats;
};

function emptyTeamStats(): OrgTeamStats {
  return {
    total: 0,
    byRole: {
      org_owner: 0,
      org_manager: 0,
      org_reviewer: 0,
    },
  };
}

export async function getCanonicalOrgTeamData(orgId: string): Promise<OrgTeamData> {
  const rawMembers = await db
    .select({
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      state: organizationMembers.state,
      displayName: profiles.displayName,
      handle: profiles.handle,
      avatarUrl: profiles.avatarUrl,
      createdAt: organizationMembers.joinedAt,
    })
    .from(organizationMembers)
    .innerJoin(profiles, eq(profiles.id, organizationMembers.userId))
    .where(eq(organizationMembers.orgId, orgId))
    .orderBy(
      sql`case
        when ${organizationMembers.role} in ('org_owner', 'owner') then 1
        when ${organizationMembers.role} in ('org_manager', 'admin') then 2
        when ${organizationMembers.role} in ('org_reviewer', 'member', 'viewer') then 3
        else 4
      end`,
      organizationMembers.joinedAt
    );

  const members = rawMembers.flatMap((member) => {
    const role = normalizeAuthorizedOrgRole(member.role as string | null | undefined);

    if (!role) {
      console.warn('[organizations.team] skipping member with non-canonical role', {
        orgId,
        userId: member.userId,
        role: member.role,
      });
      return [];
    }

    return [
      {
        userId: member.userId,
        role,
        status: normalizeMembershipState(member.state as string | null | undefined),
        displayName: member.displayName,
        handle: member.handle,
        avatarUrl: member.avatarUrl,
        createdAt: member.createdAt,
      },
    ];
  });

  const rawRoleStats = await db
    .select({
      role: organizationMembers.role,
      count: sql<number>`count(*)::int`,
    })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.state, 'active')))
    .groupBy(organizationMembers.role);

  const stats = rawRoleStats.reduce<OrgTeamStats>((acc, row) => {
    const role = normalizeAuthorizedOrgRole(row.role as string | null | undefined);

    if (!role) {
      console.warn('[organizations.team] skipping team stats row with non-canonical role', {
        orgId,
        role: row.role,
      });
      return acc;
    }

    const count = row.count || 0;
    acc.total += count;
    acc.byRole[role] += count;
    return acc;
  }, emptyTeamStats());

  return { members, stats };
}
