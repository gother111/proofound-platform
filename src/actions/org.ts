'use server';

import { requireAuth, assertOrgRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { sendOrgInviteEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const updateResult = await supabase
      .from('organizations')
      .update({
        display_name: result.data.displayName ?? null,
        legal_name: result.data.legalName ?? null,
        mission: result.data.mission ?? null,
        website: result.data.website ?? null,
        logo_url: result.data.logoUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (updateResult.error) {
      console.error('Failed to update organization:', updateResult.error);
      return { error: 'Failed to update organization' };
    }

    const orgQuery = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('id', orgId)
      .maybeSingle();

    if (orgQuery.error || !orgQuery.data) {
      console.error('Failed to load organization after update:', orgQuery.error);
      return { error: 'Failed to update organization' };
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      org_id: orgId,
      action: 'org.updated',
      target_type: 'organization',
      target_id: orgId,
      meta: { changes: result.data },
    });

    revalidatePath(`/o/${orgQuery.data.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Unexpected organization update error:', error);
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
    const supabase = await createClient();
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invitationInsert = await supabase.from('org_invitations').insert({
      org_id: orgId,
      email: result.data.email,
      role: result.data.role,
      token,
      expires_at: expiresAt.toISOString(),
      invited_by: user.id,
    });

    if (invitationInsert.error) {
      console.error('Failed to create invitation:', invitationInsert.error);
      return { error: 'Failed to send invitation' };
    }

    const orgQuery = await supabase
      .from('organizations')
      .select('display_name, slug')
      .eq('id', orgId)
      .maybeSingle();

    if (orgQuery.error || !orgQuery.data) {
      console.error('Failed to load organization for invite:', orgQuery.error);
      return { error: 'Failed to send invitation' };
    }

    // Send email
    await sendOrgInviteEmail(
      result.data.email,
      orgQuery.data.display_name,
      result.data.role,
      token
    );

    // Log audit event
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      org_id: orgId,
      action: 'member.invited',
      target_type: 'invitation',
      target_id: result.data.email,
      meta: { role: result.data.role },
    });

    revalidatePath(`/o/${orgQuery.data.slug}/members`);
    return { success: true };
  } catch (error) {
    console.error('Unexpected invite member error:', error);
    return { error: 'Failed to send invitation' };
  }
}

export async function acceptInvitation(token: string) {
  const user = await requireAuth();

  try {
    const supabase = await createClient();
    const invitationQuery = await supabase
      .from('org_invitations')
      .select('id, org_id, email, role, token, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (invitationQuery.error || !invitationQuery.data) {
      return { error: 'Invitation not found' };
    }

    const invitation = invitationQuery.data;

    if (new Date() > new Date(invitation.expires_at)) {
      return { error: 'Invitation expired' };
    }

    const orgQuery = await supabase
      .from('organizations')
      .select('id, slug, display_name')
      .eq('id', invitation.org_id)
      .maybeSingle();

    if (orgQuery.error || !orgQuery.data) {
      return { error: 'Organization not found' };
    }

    const memberInsert = await supabase.from('organization_members').insert({
      org_id: invitation.org_id,
      user_id: user.id,
      role: invitation.role,
      status: 'active',
    });

    if (memberInsert.error) {
      if (memberInsert.error.code === '23505') {
        return { error: 'You are already a member of this organization' };
      }
      console.error('Failed to add member:', memberInsert.error);
      return { error: 'Failed to accept invitation' };
    }

    await supabase.from('org_invitations').delete().eq('id', invitation.id);

    // Log audit event
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      org_id: invitation.org_id,
      action: 'member.joined',
      target_type: 'member',
      target_id: user.id,
      meta: { role: invitation.role },
    });

    revalidatePath(`/o/${orgQuery.data.slug}`);
    return { success: true, orgSlug: orgQuery.data.slug };
  } catch (error: any) {
    console.error('Unexpected invitation acceptance error:', error);
    return { error: 'Failed to accept invitation' };
  }
}

export async function removeMember(orgId: string, userId: string) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin']);

  try {
    const supabase = await createClient();
    const deletion = await supabase
      .from('organization_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (deletion.error) {
      console.error('Failed to remove member:', deletion.error);
      return { error: 'Failed to remove member' };
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      org_id: orgId,
      action: 'member.removed',
      target_type: 'member',
      target_id: userId,
    });

    const orgQuery = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .maybeSingle();

    if (orgQuery.data?.slug) {
      revalidatePath(`/o/${orgQuery.data.slug}/members`);
    }
    return { success: true };
  } catch (error) {
    console.error('Unexpected remove member error:', error);
    return { error: 'Failed to remove member' };
  }
}
