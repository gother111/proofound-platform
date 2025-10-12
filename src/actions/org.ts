'use server';

import { db } from '@/db';
import { organizations, organizationMembers, orgInvitations, auditLogs } from '@/db/schema';
import { requireAuth, assertOrgRole } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { sendOrgInviteEmail } from '@/lib/email';

const updateOrgSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  legalName: z.string().max(200).optional().nullable(),
  mission: z.string().max(2000).optional().nullable(),
  website: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
});

export async function updateOrganization(orgId: string, formData: FormData) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin']);

  const data = {
    displayName: formData.get('displayName') as string | undefined,
    legalName: formData.get('legalName') as string | undefined | null,
    mission: formData.get('mission') as string | undefined | null,
    website: formData.get('website') as string | undefined | null,
    logoUrl: formData.get('logoUrl') as string | undefined | null,
  };

  const result = updateOrgSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid organization data' };
  }

  try {
    await db
      .update(organizations)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

    // Log audit event
    await db.insert(auditLogs).values({
      actorId: user.id,
      orgId,
      action: 'org.updated',
      targetType: 'organization',
      targetId: orgId,
      meta: { changes: result.data },
    });

    revalidatePath(`/app/o/${org.slug}`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update organization' };
  }
}

export async function inviteMember(orgId: string, formData: FormData) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin']);

  const data = {
    email: formData.get('email') as string,
    role: formData.get('role') as string,
  };

  const result = inviteMemberSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid invitation data' };
  }

  try {
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(orgInvitations).values({
      orgId,
      email: result.data.email,
      role: result.data.role,
      token,
      expiresAt,
      invitedBy: user.id,
    });

    // Get org details
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

    // Send email
    await sendOrgInviteEmail(result.data.email, org.displayName, result.data.role, token);

    // Log audit event
    await db.insert(auditLogs).values({
      actorId: user.id,
      orgId,
      action: 'member.invited',
      targetType: 'invitation',
      targetId: result.data.email,
      meta: { role: result.data.role },
    });

    revalidatePath(`/app/o/${org.slug}/members`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to send invitation' };
  }
}

export async function acceptInvitation(token: string) {
  const user = await requireAuth();

  try {
    // Find invitation
    const [invitation] = await db
      .select()
      .from(orgInvitations)
      .where(eq(orgInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return { error: 'Invitation not found' };
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return { error: 'Invitation expired' };
    }

    // Get org
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, invitation.orgId))
      .limit(1);

    // Add member
    await db.insert(organizationMembers).values({
      orgId: invitation.orgId,
      userId: user.id,
      role: invitation.role,
      status: 'active',
    });

    // Delete invitation
    await db.delete(orgInvitations).where(eq(orgInvitations.id, invitation.id));

    // Log audit event
    await db.insert(auditLogs).values({
      actorId: user.id,
      orgId: invitation.orgId,
      action: 'member.joined',
      targetType: 'member',
      targetId: user.id,
      meta: { role: invitation.role },
    });

    revalidatePath(`/app/o/${org.slug}`);
    return { success: true, orgSlug: org.slug };
  } catch (error: any) {
    if (error.code === '23505') {
      return { error: 'You are already a member of this organization' };
    }
    return { error: 'Failed to accept invitation' };
  }
}

export async function removeMember(orgId: string, userId: string) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin']);

  try {
    await db
      .delete(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)));

    // Log audit event
    await db.insert(auditLogs).values({
      actorId: user.id,
      orgId,
      action: 'member.removed',
      targetType: 'member',
      targetId: userId,
    });

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    revalidatePath(`/app/o/${org.slug}/members`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to remove member' };
  }
}
