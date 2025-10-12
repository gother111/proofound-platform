import { createClient } from './supabase/server';
import { db } from '@/db';
import { profiles, organizations, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  return profile || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function getUserOrganizations(userId: string) {
  const memberships = await db
    .select({
      org: organizations,
      membership: organizationMembers,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, 'active')));

  return memberships;
}

export async function getActiveOrg(slug: string, userId: string) {
  const [result] = await db
    .select({
      org: organizations,
      membership: organizationMembers,
    })
    .from(organizations)
    .innerJoin(organizationMembers, eq(organizations.id, organizationMembers.orgId))
    .where(
      and(
        eq(organizations.slug, slug),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      )
    )
    .limit(1);

  return result || null;
}

export async function assertOrgRole(orgId: string, userId: string, roles: string[]) {
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      )
    )
    .limit(1);

  if (!membership || !roles.includes(membership.role)) {
    throw new Error('Insufficient permissions');
  }

  return membership;
}

export type Role = 'owner' | 'admin' | 'member' | 'viewer';
