'use server';

import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import { authorize, canInviteTeam, canManageTeam, type OrgRole } from '@/lib/authz';
import { isActiveMembershipState, normalizeAuthorizedOrgRole } from '@/lib/authz';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendOrgInviteEmail } from '@/lib/email';
import { log } from '@/lib/log';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePublicOrganizationPortfolioSlug } from '@/lib/portfolio/public-invalidation';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
  redeemCapabilityToken,
} from '@/lib/security/capability-tokens';

const updateOrgSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  legalName: z.string().max(200).optional().nullable(),
  mission: z.string().max(2000).optional().nullable(),
  vision: z.string().max(2000).optional().nullable(),
  causes: z.array(z.string()).optional().nullable(),
  website: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['org_manager', 'org_reviewer']),
});
const INVITE_EMAIL_TIMEOUT_MS = 5000;
const PROOFOUND_SYNTHETIC_TEST_EMAIL_DOMAIN = '@test.proofound.com';

export type InviteMemberFormState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
};

function isProofoundSyntheticTestEmail(email: string) {
  return email.trim().toLowerCase().endsWith(PROOFOUND_SYNTHETIC_TEST_EMAIL_DOMAIN);
}

async function getOrgMembershipForUser(orgId: string, userId: string) {
  const supabase = await createClient({ allowCookieWrite: true });
  const { data } = await supabase
    .from('organization_members')
    .select('id, role, state')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  const role = normalizeAuthorizedOrgRole(data?.role as string | null | undefined);
  const state = data?.state as string | null | undefined;

  return {
    id: data?.id ?? null,
    role: isActiveMembershipState(state) ? role : null,
    state,
  };
}

function buildOrgAuditMeta(params: {
  principalType: 'organization' | 'trust_admin';
  actorMembershipId?: string | null;
  priorState?: string | null;
  newState?: string | null;
  breakGlassReason?: string | null;
  extra?: Record<string, unknown>;
}) {
  return {
    principalType: params.principalType,
    actorMembershipId: params.actorMembershipId ?? null,
    priorState: params.priorState ?? null,
    newState: params.newState ?? null,
    sourceSurface: 'server_action',
    breakGlassReason: params.breakGlassReason ?? null,
    ...(params.extra ?? {}),
  };
}

/** @deprecated Use PUT /api/organizations/[orgId] via apiFetch. */
export async function updateOrganization(orgId: string, formData: FormData) {
  log.warn('organization.action.update.deprecated', {
    orgId,
    replacement: 'PUT /api/organizations/[orgId]',
  });
  const user = await requireAuth();
  const membership = await getOrgMembershipForUser(orgId, user.id);
  const orgRole = membership.role;
  if (
    !authorize({
      resource: 'org_profile',
      action: 'update',
      orgRole,
    }).allowed
  ) {
    return { error: 'Insufficient permissions' };
  }

  // Parse causes from comma-separated string
  const causesRaw = formData.get('causes') as string | null;
  const causes = causesRaw
    ? causesRaw
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
        .slice(0, 5) // PRD requirement: max 5 causes
    : null;

  const data = {
    displayName: formData.get('displayName') as string | undefined,
    legalName: formData.get('legalName') as string | undefined | null,
    mission: formData.get('mission') as string | undefined | null,
    vision: formData.get('vision') as string | undefined | null,
    causes,
    website: formData.get('website') as string | undefined | null,
    logoUrl: formData.get('logoUrl') as string | undefined | null,
  };

  const result = updateOrgSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid organization data' };
  }

  if (result.data.legalName !== undefined && orgRole !== 'org_owner') {
    return { error: 'Only organization owners can update legal organization fields' };
  }

  try {
    const supabase = await createClient({ allowCookieWrite: true });
    const updateResult = await supabase
      .from('organizations')
      .update({
        display_name: result.data.displayName ?? null,
        legal_name: result.data.legalName ?? null,
        mission: result.data.mission ?? null,
        vision: result.data.vision ?? null,
        causes: result.data.causes ?? null,
        website: result.data.website ?? null,
        logo_url: result.data.logoUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (updateResult.error) {
      log.error('organization.action.update_failed', {
        orgId,
        error: updateResult.error,
      });
      return { error: 'Failed to update organization' };
    }

    const orgQuery = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('id', orgId)
      .maybeSingle();

    if (orgQuery.error || !orgQuery.data) {
      log.error('organization.action.reload_after_update_failed', {
        orgId,
        error: orgQuery.error,
      });
      return { error: 'Failed to update organization' };
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      org_id: orgId,
      action: 'org.updated',
      target_type: 'organization',
      target_id: orgId,
      meta: buildOrgAuditMeta({
        principalType: 'organization',
        actorMembershipId: membership.id,
        newState: 'active',
        extra: { changes: result.data },
      }),
    });

    revalidatePath(`/app/o/${orgQuery.data.slug}`);
    revalidatePublicOrganizationPortfolioSlug(orgQuery.data.slug);
    return { success: true };
  } catch (error) {
    log.error('organization.action.update_unexpected_failed', { orgId, error });
    return { error: 'Failed to update organization' };
  }
}

export async function inviteMember(orgId: string, formData: FormData) {
  const user = await requireAuth();
  const membership = await getOrgMembershipForUser(orgId, user.id);
  const orgRole = membership.role;
  if (!canInviteTeam(orgRole)) {
    return { error: 'Insufficient permissions' };
  }

  const data = {
    email: formData.get('email') as string,
    role: formData.get('role') as string,
  };

  const result = inviteMemberSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid invitation data' };
  }

  try {
    const supabase = await createClient({ allowCookieWrite: true });
    const adminClient = createAdminClient();
    const normalizedEmail = result.data.email.trim().toLowerCase();
    const existingInviteQuery = await supabase
      .from('org_invitations')
      .select('id, status, expires_at')
      .eq('org_id', orgId)
      .ilike('email', normalizedEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (existingInviteQuery.error) {
      log.error('organization.invite.existing_check_failed', {
        orgId,
        error: existingInviteQuery.error,
      });
      return { error: 'Failed to send invitation' };
    }

    if (existingInviteQuery.data) {
      return { error: 'An active invitation is already pending for this email' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    const invitationId = crypto.randomUUID();
    let membershipId: string | null = null;
    const issued = await issueCapabilityToken({
      tokenClass: CAPABILITY_TOKEN_CLASSES.ORG_MEMBER_INVITE,
      sourceTable: 'org_invitations',
      sourceId: invitationId,
      actionScope: 'org_invitation.accept',
      subjectType: 'organization',
      subjectId: orgId,
      actorBinding: CAPABILITY_BINDINGS.EMAIL_HASH,
      actorEmail: result.data.email,
      expiresAt,
      singleUse: true,
      maxUses: 1,
      metadata: {
        role: result.data.role,
      },
    });

    const invitationInsert = await adminClient.from('org_invitations').insert({
      id: invitationId,
      org_id: orgId,
      membership_id: membershipId,
      email: normalizedEmail,
      role: result.data.role,
      status: 'pending',
      token_hash: issued.tokenHash,
      capability_token_id: issued.token.id,
      last_sent_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      invited_by: user.id,
      updated_at: new Date().toISOString(),
    });

    if (invitationInsert.error) {
      log.error('organization.invite.create_failed', {
        orgId,
        invitationId,
        role: result.data.role,
        error: invitationInsert.error,
      });
      return { error: 'Failed to send invitation' };
    }
    const orgQuery = await supabase
      .from('organizations')
      .select('display_name, slug')
      .eq('id', orgId)
      .maybeSingle();

    if (orgQuery.error || !orgQuery.data) {
      log.error('organization.invite.organization_load_failed', {
        orgId,
        invitationId,
        error: orgQuery.error,
      });
      return { error: 'Failed to send invitation' };
    }
    let warning: string | undefined;
    if (isProofoundSyntheticTestEmail(normalizedEmail)) {
      warning = 'Invitation saved. Email delivery is skipped for local Proofound test addresses.';
    } else {
      try {
        await Promise.race([
          sendOrgInviteEmail(
            result.data.email,
            orgQuery.data.display_name,
            result.data.role,
            issued.rawToken,
            orgQuery.data.slug
          ),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('org_invite_email_timeout'));
            }, INVITE_EMAIL_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        log.warn('organization.invite.email_delivery_unconfirmed', {
          orgId,
          invitationId,
          role: result.data.role,
          error,
        });
        warning =
          'Invitation saved, but email delivery could not be confirmed. Ask the collaborator to use the latest invite link before expecting access.';
      }
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      org_id: orgId,
      action: 'member.invited',
      target_type: 'invitation',
      target_id: result.data.email,
      meta: buildOrgAuditMeta({
        principalType: 'organization',
        actorMembershipId: membership.id,
        priorState: null,
        newState: 'invited_pending',
        extra: { role: result.data.role, email: normalizedEmail, invitationId },
      }),
    });
    revalidatePath(`/app/o/${orgQuery.data.slug}/members`);
    return warning ? { success: true, warning } : { success: true };
  } catch (error) {
    log.error('organization.invite.unexpected_failed', { orgId, error });
    return { error: 'Failed to send invitation' };
  }
}

export async function inviteMemberFormAction(
  orgId: string,
  _state: InviteMemberFormState,
  formData: FormData
): Promise<InviteMemberFormState> {
  const result = await inviteMember(orgId, formData);

  if (result.error) {
    return {
      status: 'error',
      message: result.error,
    };
  }

  return {
    status: 'success',
    message:
      result.warning ??
      'Invitation sent. The collaborator must accept their tokenized email invite before access is granted.',
  };
}

export async function acceptInvitation(token: string) {
  const user = await requireAuth();

  try {
    const supabase = await createClient({ allowCookieWrite: true });
    const adminClient = createAdminClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const redeemed = await redeemCapabilityToken(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.ORG_MEMBER_INVITE,
      actor: {
        email: authUser?.email ?? null,
        profileId: user.id,
        principalType: 'user_account',
      },
      consume: true,
      metadata: { surface: 'org_accept_invitation' },
    });

    if (!redeemed.ok) {
      return { error: 'Invitation unavailable' };
    }

    const invitationQuery = await adminClient
      .from('org_invitations')
      .select('id, org_id, membership_id, email, role, status, expires_at, accepted_at, revoked_at')
      .eq('id', redeemed.token.source_id)
      .maybeSingle();

    if (invitationQuery.error || !invitationQuery.data) {
      return { error: 'Invitation not found' };
    }

    const invitation = invitationQuery.data;

    if (invitation.status === 'accepted' || invitation.accepted_at) {
      return { error: 'Invitation already accepted' };
    }

    if (invitation.status === 'revoked' || invitation.revoked_at) {
      return { error: 'Invitation revoked' };
    }

    if (new Date() > new Date(invitation.expires_at)) {
      await adminClient
        .from('org_invitations')
        .update({
          status: 'expired',
          expired_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);
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

    let membershipId = invitation.membership_id as string | null;
    const invitationRole = normalizeAuthorizedOrgRole(invitation.role);
    if (!invitationRole) {
      log.error('organization.invitation_accept.non_canonical_role', {
        invitationId: invitation.id,
        orgId: invitation.org_id,
        role: invitation.role,
      });
      return { error: 'Invitation role is invalid' };
    }

    const membershipUpdatePayload = {
      user_id: user.id,
      role: invitationRole,
      state: 'active',
      accepted_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (membershipId) {
      const membershipUpdate = await adminClient
        .from('organization_members')
        .update(membershipUpdatePayload)
        .eq('id', membershipId)
        .eq('org_id', invitation.org_id);

      if (membershipUpdate.error) {
        log.error('organization.invitation_accept.membership_activate_failed', {
          invitationId: invitation.id,
          orgId: invitation.org_id,
          membershipId,
          error: membershipUpdate.error,
        });
        return { error: 'Failed to accept invitation' };
      }
    } else {
      const memberInsert = await adminClient
        .from('organization_members')
        .insert({
          id: crypto.randomUUID(),
          org_id: invitation.org_id,
          ...membershipUpdatePayload,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (memberInsert.error || !memberInsert.data) {
        if (memberInsert.error?.code === '23505') {
          return { error: 'You are already a member of this organization' };
        }
        log.error('organization.invitation_accept.member_insert_failed', {
          invitationId: invitation.id,
          orgId: invitation.org_id,
          error: memberInsert.error,
        });
        return { error: 'Failed to accept invitation' };
      }

      membershipId = memberInsert.data.id;
    }

    const inviteUpdate = await adminClient
      .from('org_invitations')
      .update({
        membership_id: membershipId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by_profile_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (inviteUpdate.error) {
      log.error('organization.invitation_accept.status_update_failed', {
        invitationId: invitation.id,
        orgId: invitation.org_id,
        membershipId,
        error: inviteUpdate.error,
      });
      return { error: 'Failed to accept invitation' };
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      org_id: invitation.org_id,
      action: 'member.joined',
      target_type: 'member',
      target_id: user.id,
      meta: buildOrgAuditMeta({
        principalType: 'organization',
        actorMembershipId: membershipId,
        priorState: 'invited_pending',
        newState: 'active',
        extra: { role: invitationRole },
      }),
    });

    revalidatePath(`/app/o/${orgQuery.data.slug}`);
    return { success: true, orgSlug: orgQuery.data.slug };
  } catch (error: any) {
    log.error('organization.invitation_accept.unexpected_failed', { error });
    return { error: 'Failed to accept invitation' };
  }
}

export async function removeMember(orgId: string, userId: string) {
  const user = await requireAuth();
  const membership = await getOrgMembershipForUser(orgId, user.id);
  const orgRole = membership.role;
  if (!canManageTeam(orgRole)) {
    return { error: 'Insufficient permissions' };
  }

  try {
    const supabase = await createClient();
    const removal = await supabase
      .from('organization_members')
      .update({
        state: 'removed',
        removed_at: new Date().toISOString(),
        removed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (removal.error) {
      log.error('organization.member.remove_failed', {
        orgId,
        targetUserId: userId,
        error: removal.error,
      });
      return { error: 'Failed to remove member' };
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      org_id: orgId,
      action: 'member.removed',
      target_type: 'member',
      target_id: userId,
      meta: buildOrgAuditMeta({
        principalType: 'organization',
        actorMembershipId: membership.id,
        priorState: 'active',
        newState: 'removed',
      }),
    });

    const orgQuery = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .maybeSingle();

    if (orgQuery.data?.slug) {
      revalidatePath(`/app/o/${orgQuery.data.slug}/members`);
    }
    return { success: true };
  } catch (error) {
    log.error('organization.member.remove_unexpected_failed', {
      orgId,
      targetUserId: userId,
      error,
    });
    return { error: 'Failed to remove member' };
  }
}

export async function initiateOwnershipTransfer(orgId: string, targetUserId: string) {
  const user = await requireAuth();
  const supabase = await createClient({ allowCookieWrite: true });
  const actorMembership = await getOrgMembershipForUser(orgId, user.id);

  if (actorMembership.role !== 'org_owner') {
    return { error: 'Only organization owners can transfer ownership' };
  }

  const { data: memberships, error } = await supabase
    .from('organization_members')
    .select('id, user_id, role, state')
    .eq('org_id', orgId)
    .in('user_id', [user.id, targetUserId]);

  if (error) {
    log.error('organization.ownership_transfer.memberships_load_failed', {
      orgId,
      targetUserId,
      error,
    });
    return { error: 'Failed to initiate ownership transfer' };
  }

  const currentOwner = memberships?.find((item) => item.user_id === user.id);
  const targetMembership = memberships?.find((item) => item.user_id === targetUserId);

  if (!currentOwner || !isActiveMembershipState(currentOwner.state)) {
    return { error: 'Current ownership record not found' };
  }

  if (!targetMembership || !isActiveMembershipState(targetMembership.state)) {
    return { error: 'Target user must have an active membership' };
  }

  const targetRole = normalizeAuthorizedOrgRole(targetMembership.role);
  if (!targetRole) {
    return { error: 'Target user is not eligible for ownership transfer' };
  }

  const transferUpdate = await supabase
    .from('organization_members')
    .update({
      role: 'org_owner',
      state: 'ownership_transfer_pending',
      ownership_transfer_from_membership_id: currentOwner.id,
      ownership_transfer_target_user_id: targetUserId,
      ownership_transfer_initiated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetMembership.id);

  if (transferUpdate.error) {
    log.error('organization.ownership_transfer.initiate_update_failed', {
      orgId,
      targetUserId,
      targetMembershipId: targetMembership.id,
      error: transferUpdate.error,
    });
    return { error: 'Failed to initiate ownership transfer' };
  }

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    org_id: orgId,
    action: 'member.ownership_transfer_initiated',
    target_type: 'member',
    target_id: targetUserId,
    meta: buildOrgAuditMeta({
      principalType: 'organization',
      actorMembershipId: actorMembership.id,
      priorState: 'active',
      newState: 'ownership_transfer_pending',
      extra: {
        fromMembershipId: currentOwner.id,
        targetMembershipId: targetMembership.id,
        previousTargetRole: targetRole,
      },
    }),
  });

  return { success: true };
}

export async function acceptOwnershipTransfer(orgId: string) {
  const user = await requireAuth();
  const supabase = await createClient({ allowCookieWrite: true });
  const { data: targetMembership, error } = await supabase
    .from('organization_members')
    .select(
      'id, user_id, role, state, ownership_transfer_from_membership_id, ownership_transfer_target_user_id'
    )
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !targetMembership) {
    log.error('organization.ownership_transfer.target_load_failed', {
      orgId,
      userId: user.id,
      error,
    });
    return { error: 'Failed to accept ownership transfer' };
  }

  if (
    targetMembership.state !== 'ownership_transfer_pending' ||
    targetMembership.ownership_transfer_target_user_id !== user.id
  ) {
    return { error: 'No pending ownership transfer found' };
  }

  const previousMembershipId = targetMembership.ownership_transfer_from_membership_id;
  if (!previousMembershipId) {
    return { error: 'Ownership transfer record is incomplete' };
  }

  const demotePrevious = await supabase
    .from('organization_members')
    .update({
      role: 'org_manager',
      state: 'active',
      ownership_transfer_accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', previousMembershipId)
    .eq('org_id', orgId);

  if (demotePrevious.error) {
    log.error('organization.ownership_transfer.previous_owner_demote_failed', {
      orgId,
      previousMembershipId,
      error: demotePrevious.error,
    });
    return { error: 'Failed to accept ownership transfer' };
  }

  const activateTarget = await supabase
    .from('organization_members')
    .update({
      role: 'org_owner',
      state: 'active',
      accepted_at: new Date().toISOString(),
      ownership_transfer_accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetMembership.id)
    .eq('org_id', orgId);

  if (activateTarget.error) {
    log.error('organization.ownership_transfer.target_activate_failed', {
      orgId,
      targetMembershipId: targetMembership.id,
      error: activateTarget.error,
    });
    return { error: 'Failed to accept ownership transfer' };
  }

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    org_id: orgId,
    action: 'member.ownership_transfer_accepted',
    target_type: 'member',
    target_id: user.id,
    meta: buildOrgAuditMeta({
      principalType: 'organization',
      actorMembershipId: targetMembership.id,
      priorState: 'ownership_transfer_pending',
      newState: 'active',
      extra: {
        previousOwnerMembershipId: previousMembershipId,
      },
    }),
  });

  return { success: true };
}
