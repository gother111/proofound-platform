/**
 * Admin Authorization Utilities
 *
 * Tiered admin system:
 * - super_admin: Full platform access, can modify users/orgs, invite admins
 * - platform_admin: Analytics & monitoring, read-only on most data
 * - org_admin: Organization-level admin (via organization_members.role)
 */

import { db } from '@/db';
import { profiles, organizationMembers, adminInvitations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type AdminLevel = 'super_admin' | 'platform_admin' | 'org_admin' | 'none';

export interface AdminUser {
  userId: string;
  email: string;
  platformRole: 'super_admin' | 'platform_admin' | null;
  adminLevel: AdminLevel;
}

/**
 * Check if user is a platform admin (platform_admin or super_admin)
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: {
        platformRole: true,
      },
    });

    return profile?.platformRole === 'platform_admin' || profile?.platformRole === 'super_admin';
  } catch (error) {
    console.error('Error checking platform admin status:', error);
    return false;
  }
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: {
        platformRole: true,
      },
    });

    return profile?.platformRole === 'super_admin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

/**
 * Check if user is an admin of a specific organization
 */
export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  try {
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.status, 'active')
      ),
      columns: {
        role: true,
      },
    });

    return membership?.role === 'admin' || membership?.role === 'owner';
  } catch (error) {
    console.error('Error checking org admin status:', error);
    return false;
  }
}

/**
 * Get admin level for a user
 */
export async function getAdminLevel(userId: string): Promise<AdminLevel> {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: {
        platformRole: true,
      },
    });

    if (profile?.platformRole === 'super_admin') {
      return 'super_admin';
    }

    if (profile?.platformRole === 'platform_admin') {
      return 'platform_admin';
    }

    // Check if user is admin of any organization
    const orgMembership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      ),
      columns: {
        role: true,
      },
    });

    if (orgMembership?.role === 'admin' || orgMembership?.role === 'owner') {
      return 'org_admin';
    }

    return 'none';
  } catch (error) {
    console.error('Error getting admin level:', error);
    return 'none';
  }
}

/**
 * Get current admin user (requires authentication)
 * Returns null if not authenticated or not an admin
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: {
        id: true,
        platformRole: true,
      },
    });

    if (!profile) {
      return null;
    }

    const adminLevel = await getAdminLevel(user.id);

    // Not an admin
    if (adminLevel === 'none') {
      return null;
    }

    return {
      userId: user.id,
      email: user.email!,
      platformRole: profile.platformRole,
      adminLevel,
    };
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

/**
 * Require platform admin access (middleware-style)
 * Redirects to 403 if not authorized
 */
export async function requirePlatformAdmin(): Promise<AdminUser> {
  const adminUser = await getAdminUser();

  if (!adminUser || (adminUser.adminLevel !== 'platform_admin' && adminUser.adminLevel !== 'super_admin')) {
    redirect('/403');
  }

  return adminUser;
}

/**
 * Require super admin access (middleware-style)
 * Redirects to 403 if not authorized
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const adminUser = await getAdminUser();

  if (!adminUser || adminUser.adminLevel !== 'super_admin') {
    redirect('/403');
  }

  return adminUser;
}

/**
 * Check if user can perform admin action
 * Considers both platform role and organization-specific permissions
 */
export async function canPerformAdminAction(
  userId: string,
  action: string,
  targetOrgId?: string
): Promise<boolean> {
  try {
    const adminLevel = await getAdminLevel(userId);

    // Super admins can do anything
    if (adminLevel === 'super_admin') {
      return true;
    }

    // Platform admins can read but not modify
    if (adminLevel === 'platform_admin') {
      const readActions = [
        'view_users',
        'view_organizations',
        'view_analytics',
        'view_audit_log',
        'view_reports',
      ];
      return readActions.includes(action);
    }

    // Org admins can only act on their own organization
    if (adminLevel === 'org_admin' && targetOrgId) {
      const isAdmin = await isOrgAdmin(userId, targetOrgId);
      if (isAdmin) {
        const orgActions = [
          'view_org',
          'edit_org',
          'manage_org_members',
          'view_org_analytics',
        ];
        return orgActions.includes(action);
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking admin action permission:', error);
    return false;
  }
}

/**
 * Check if email is in admin whitelist (env variable)
 * Used for auto-granting admin access on first login
 */
export function isEmailInAdminWhitelist(email: string): boolean {
  const whitelist = process.env.PLATFORM_ADMIN_EMAILS || '';
  const emails = whitelist.split(',').map(e => e.trim().toLowerCase());
  return emails.includes(email.toLowerCase());
}

/**
 * Check if user has pending admin invitation
 */
export async function getPendingAdminInvitation(email: string) {
  try {
    return await db.query.adminInvitations.findFirst({
      where: and(
        eq(adminInvitations.email, email),
        eq(adminInvitations.status, 'pending')
      ),
    });
  } catch (error) {
    console.error('Error checking admin invitation:', error);
    return null;
  }
}

/**
 * Auto-grant admin role if email is whitelisted or has invitation
 * Called during user signup/login
 */
export async function autoGrantAdminRole(userId: string, email: string): Promise<void> {
  try {
    // Check whitelist first
    if (isEmailInAdminWhitelist(email)) {
      await db
        .update(profiles)
        .set({ platformRole: 'platform_admin' })
        .where(eq(profiles.id, userId));

      console.log(`Auto-granted platform_admin role to whitelisted email: ${email}`);
      return;
    }

    // Check for pending invitation
    const invitation = await getPendingAdminInvitation(email);
    if (invitation && new Date() < invitation.expiresAt) {
      await db
        .update(profiles)
        .set({ platformRole: invitation.role })
        .where(eq(profiles.id, userId));

      await db
        .update(adminInvitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: userId,
        })
        .where(eq(adminInvitations.id, invitation.id));

      console.log(`Granted ${invitation.role} role via invitation to: ${email}`);
    }
  } catch (error) {
    console.error('Error auto-granting admin role:', error);
  }
}
