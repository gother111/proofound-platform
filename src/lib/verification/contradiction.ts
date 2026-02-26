import { createAdminClient } from '@/lib/supabase/admin';
import {
  VERIFICATION_INTEGRITY_REASONS,
  getEmailDomain,
  isFreeEmailDomain,
  normalizeEmail,
  writeVerificationAuditLog,
} from '@/lib/verification/integrity';

type ReconcileInput = {
  verifierEmail?: string | null;
  verifierProfileId?: string | null;
};

type ReconcileResult = {
  flaggedSkillCount: number;
  flaggedImpactCount: number;
  impactedStoryCount: number;
};

function emptyResult(): ReconcileResult {
  return {
    flaggedSkillCount: 0,
    flaggedImpactCount: 0,
    impactedStoryCount: 0,
  };
}

type SkillVerificationRow = {
  id: string;
  requester_profile_id: string;
  verifier_source: 'peer' | 'manager' | 'external';
  requester_domain_snapshot: string | null;
  integrity_meta: Record<string, unknown> | null;
};

type ImpactVerificationRow = {
  id: string;
  impact_story_id: string;
  requester_profile_id: string;
  verifier_relationship: string | null;
  requester_domain_snapshot: string | null;
  claim_snapshot: Record<string, unknown> | null;
  integrity_meta: Record<string, unknown> | null;
};

function relationshipSuggestsSharedOrg(relationship: string | null | undefined): boolean {
  if (!relationship) {
    return false;
  }

  const rel = relationship.toLowerCase();
  if (rel.includes('client') || rel.includes('external')) {
    return false;
  }

  const sameOrgKeywords = ['manager', 'peer', 'colleague', 'coworker', 'teammate', 'supervisor'];
  return sameOrgKeywords.some((keyword) => rel.includes(keyword));
}

function sourceSuggestsSharedOrg(source: SkillVerificationRow['verifier_source']): boolean {
  return source === 'manager' || source === 'peer';
}

function shouldFlagRoleOrgMismatch(args: {
  requesterDomain: string | null;
  verifierCurrentDomain: string | null;
  expectsSameOrg: boolean;
  sharesOrganization: boolean;
}): boolean {
  if (!args.expectsSameOrg) {
    return false;
  }

  if (!args.requesterDomain || !args.verifierCurrentDomain) {
    return false;
  }

  if (isFreeEmailDomain(args.requesterDomain) || isFreeEmailDomain(args.verifierCurrentDomain)) {
    return false;
  }

  return args.requesterDomain !== args.verifierCurrentDomain && !args.sharesOrganization;
}

async function resolveVerifierIdentity(input: ReconcileInput): Promise<{
  verifierEmail: string | null;
  verifierProfileId: string | null;
  verifierCurrentDomain: string | null;
}> {
  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    console.warn('resolveVerifierIdentity: admin client unavailable', error);
    return {
      verifierEmail: normalizeEmail(input.verifierEmail),
      verifierProfileId: input.verifierProfileId || null,
      verifierCurrentDomain: getEmailDomain(input.verifierEmail),
    };
  }

  const normalizedEmail = normalizeEmail(input.verifierEmail);
  if (normalizedEmail) {
    const byProfileEmail = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!input.verifierProfileId && !byProfileEmail.error && byProfileEmail.data?.id) {
      return {
        verifierEmail: normalizedEmail,
        verifierProfileId: String(byProfileEmail.data.id),
        verifierCurrentDomain: getEmailDomain(normalizedEmail),
      };
    }

    if (input.verifierProfileId) {
      return {
        verifierEmail: normalizedEmail,
        verifierProfileId: input.verifierProfileId,
        verifierCurrentDomain: getEmailDomain(normalizedEmail),
      };
    }

    const byWorkEmail = await adminClient
      .from('individual_profiles')
      .select('user_id')
      .eq('work_email', normalizedEmail)
      .eq('work_email_verified', true)
      .maybeSingle();

    if (!byWorkEmail.error && byWorkEmail.data?.user_id) {
      return {
        verifierEmail: normalizedEmail,
        verifierProfileId: String(byWorkEmail.data.user_id),
        verifierCurrentDomain: getEmailDomain(normalizedEmail),
      };
    }

    return {
      verifierEmail: normalizedEmail,
      verifierProfileId: input.verifierProfileId || null,
      verifierCurrentDomain: getEmailDomain(normalizedEmail),
    };
  }

  if (!input.verifierProfileId) {
    return {
      verifierEmail: null,
      verifierProfileId: null,
      verifierCurrentDomain: null,
    };
  }

  const profileLookup = await adminClient
    .from('profiles')
    .select('email')
    .eq('id', input.verifierProfileId)
    .maybeSingle();

  const emailFromProfile = normalizeEmail((profileLookup.data as any)?.email || null);
  if (emailFromProfile) {
    return {
      verifierEmail: emailFromProfile,
      verifierProfileId: input.verifierProfileId,
      verifierCurrentDomain: getEmailDomain(emailFromProfile),
    };
  }

  const workEmailLookup = await adminClient
    .from('individual_profiles')
    .select('work_email')
    .eq('user_id', input.verifierProfileId)
    .eq('work_email_verified', true)
    .maybeSingle();

  const emailFromWork = normalizeEmail((workEmailLookup.data as any)?.work_email || null);
  return {
    verifierEmail: emailFromWork,
    verifierProfileId: input.verifierProfileId,
    verifierCurrentDomain: getEmailDomain(emailFromWork),
  };
}

async function buildRequesterOrgMap(requesterIds: string[]): Promise<Map<string, Set<string>>> {
  if (requesterIds.length === 0) {
    return new Map();
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('organization_members')
    .select('user_id, org_id')
    .in('user_id', requesterIds)
    .eq('status', 'active');

  if (error || !data) {
    return new Map();
  }

  const map = new Map<string, Set<string>>();
  for (const row of data as any[]) {
    const userId = String(row.user_id || '');
    const orgId = String(row.org_id || '');
    if (!userId || !orgId) {
      continue;
    }

    if (!map.has(userId)) {
      map.set(userId, new Set());
    }

    map.get(userId)?.add(orgId);
  }

  return map;
}

async function getVerifierOrganizations(verifierProfileId: string | null): Promise<Set<string>> {
  if (!verifierProfileId) {
    return new Set();
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('organization_members')
    .select('org_id')
    .eq('user_id', verifierProfileId)
    .eq('status', 'active');

  if (error || !data) {
    return new Set();
  }

  const orgIds = new Set<string>();
  for (const row of data as any[]) {
    const orgId = String(row.org_id || '');
    if (orgId) {
      orgIds.add(orgId);
    }
  }

  return orgIds;
}

function hasOrgIntersection(
  requesterOrgMap: Map<string, Set<string>>,
  requesterId: string,
  verifierOrgIds: Set<string>
): boolean {
  const requesterOrgIds = requesterOrgMap.get(requesterId);
  if (!requesterOrgIds || requesterOrgIds.size === 0 || verifierOrgIds.size === 0) {
    return false;
  }

  for (const orgId of requesterOrgIds) {
    if (verifierOrgIds.has(orgId)) {
      return true;
    }
  }

  return false;
}

async function flagSkillRequest(
  row: SkillVerificationRow,
  contradictionMeta: Record<string, unknown>
) {
  const adminClient = createAdminClient();
  const integrityMeta = {
    ...(row.integrity_meta || {}),
    contradiction: contradictionMeta,
  };

  await adminClient
    .from('skill_verification_requests')
    .update({
      integrity_status: 'flagged',
      integrity_reason: VERIFICATION_INTEGRITY_REASONS.VERIFIER_PROFILE_CONTRADICTION,
      integrity_meta: integrityMeta,
      integrity_flagged_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  await writeVerificationAuditLog({
    actorId: null,
    action: 'verification.integrity.flagged',
    targetType: 'skill_verification_request',
    targetId: row.id,
    meta: {
      reason: VERIFICATION_INTEGRITY_REASONS.VERIFIER_PROFILE_CONTRADICTION,
      contradiction: contradictionMeta,
    },
  });
}

async function flagImpactRequest(
  row: ImpactVerificationRow,
  contradictionMeta: Record<string, unknown>
) {
  const adminClient = createAdminClient();
  const integrityMeta = {
    ...(row.integrity_meta || {}),
    contradiction: contradictionMeta,
  };

  await adminClient
    .from('impact_story_verification_requests')
    .update({
      integrity_status: 'flagged',
      integrity_reason: VERIFICATION_INTEGRITY_REASONS.VERIFIER_PROFILE_CONTRADICTION,
      integrity_meta: integrityMeta,
      integrity_flagged_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  await writeVerificationAuditLog({
    actorId: null,
    action: 'verification.integrity.flagged',
    targetType: 'impact_story_verification_request',
    targetId: row.id,
    meta: {
      reason: VERIFICATION_INTEGRITY_REASONS.VERIFIER_PROFILE_CONTRADICTION,
      contradiction: contradictionMeta,
    },
  });
}

async function reconcileImpactStoryVerifiedState(impactStoryIds: Set<string>) {
  if (impactStoryIds.size === 0) {
    return;
  }

  const adminClient = createAdminClient();

  for (const storyId of impactStoryIds) {
    const { count, error } = await adminClient
      .from('impact_story_verification_requests')
      .select('id', { count: 'exact', head: true })
      .eq('impact_story_id', storyId)
      .eq('status', 'accepted')
      .eq('integrity_status', 'clear');

    if (error) {
      continue;
    }

    if ((count || 0) === 0) {
      await adminClient
        .from('impact_stories')
        .update({ verified: false, updated_at: new Date().toISOString() })
        .eq('id', storyId);
    }
  }
}

export async function reconcileVerifierContradictions(
  input: ReconcileInput
): Promise<ReconcileResult> {
  try {
    const identity = await resolveVerifierIdentity(input);
    if (!identity.verifierEmail) {
      return emptyResult();
    }

    const adminClient = createAdminClient();

    const [skillRequestsResult, impactRequestsResult] = await Promise.all([
      adminClient
        .from('skill_verification_requests')
        .select(
          'id, requester_profile_id, verifier_source, requester_domain_snapshot, integrity_meta'
        )
        .eq('verifier_email', identity.verifierEmail)
        .eq('status', 'accepted')
        .eq('integrity_status', 'clear'),
      adminClient
        .from('impact_story_verification_requests')
        .select(
          'id, impact_story_id, requester_profile_id, verifier_relationship, requester_domain_snapshot, claim_snapshot, integrity_meta'
        )
        .eq('verifier_email', identity.verifierEmail)
        .eq('status', 'accepted')
        .eq('integrity_status', 'clear'),
    ]);

    const skillRequests = (skillRequestsResult.data || []) as SkillVerificationRow[];
    const impactRequests = (impactRequestsResult.data || []) as ImpactVerificationRow[];

    if (skillRequests.length === 0 && impactRequests.length === 0) {
      return emptyResult();
    }

    const requesterIds = Array.from(
      new Set([
        ...skillRequests.map((row) => row.requester_profile_id),
        ...impactRequests.map((row) => row.requester_profile_id),
      ])
    );

    const [requesterOrgMap, verifierOrgIds] = await Promise.all([
      buildRequesterOrgMap(requesterIds),
      getVerifierOrganizations(identity.verifierProfileId),
    ]);

    let flaggedSkillCount = 0;
    let flaggedImpactCount = 0;
    const impactedStoryIds = new Set<string>();

    for (const row of skillRequests) {
      const sharesOrg = hasOrgIntersection(
        requesterOrgMap,
        row.requester_profile_id,
        verifierOrgIds
      );
      const shouldFlag = shouldFlagRoleOrgMismatch({
        requesterDomain: row.requester_domain_snapshot,
        verifierCurrentDomain: identity.verifierCurrentDomain,
        expectsSameOrg: sourceSuggestsSharedOrg(row.verifier_source),
        sharesOrganization: sharesOrg,
      });

      if (!shouldFlag) {
        continue;
      }

      await flagSkillRequest(row, {
        type: 'role_org_mismatch',
        verifier_source: row.verifier_source,
        requester_domain_snapshot: row.requester_domain_snapshot,
        verifier_current_domain: identity.verifierCurrentDomain,
        shares_organization: sharesOrg,
      });
      flaggedSkillCount += 1;
    }

    for (const row of impactRequests) {
      const claimRelationship =
        row.verifier_relationship ||
        (row.claim_snapshot && typeof row.claim_snapshot === 'object'
          ? String((row.claim_snapshot as any).verifierRelationship || '')
          : '');

      const expectsSameOrg = relationshipSuggestsSharedOrg(claimRelationship);
      const sharesOrg = hasOrgIntersection(
        requesterOrgMap,
        row.requester_profile_id,
        verifierOrgIds
      );
      const shouldFlag = shouldFlagRoleOrgMismatch({
        requesterDomain: row.requester_domain_snapshot,
        verifierCurrentDomain: identity.verifierCurrentDomain,
        expectsSameOrg,
        sharesOrganization: sharesOrg,
      });

      if (!shouldFlag) {
        continue;
      }

      await flagImpactRequest(row, {
        type: 'role_org_mismatch',
        verifier_relationship: row.verifier_relationship,
        requester_domain_snapshot: row.requester_domain_snapshot,
        verifier_current_domain: identity.verifierCurrentDomain,
        shares_organization: sharesOrg,
      });
      flaggedImpactCount += 1;
      impactedStoryIds.add(row.impact_story_id);
    }

    await reconcileImpactStoryVerifiedState(impactedStoryIds);

    return {
      flaggedSkillCount,
      flaggedImpactCount,
      impactedStoryCount: impactedStoryIds.size,
    };
  } catch (error) {
    console.error('reconcileVerifierContradictions failed:', error);
    return emptyResult();
  }
}
