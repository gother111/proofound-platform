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

type CanonicalVerificationRow = {
  id: string;
  owner_id: string;
  subject_type: 'skill' | 'impact_story' | string;
  subject_id: string;
  verifier_profile_id: string | null;
  metadata: Record<string, unknown> | null;
  claim_snapshot: Record<string, unknown> | null;
};

function emptyResult(): ReconcileResult {
  return {
    flaggedSkillCount: 0,
    flaggedImpactCount: 0,
    impactedStoryCount: 0,
  };
}

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

function sourceSuggestsSharedOrg(source: string | null | undefined): boolean {
  return source === 'manager' || source === 'peer';
}

function shouldFlagRoleOrgMismatch(args: {
  requesterDomain: string | null;
  verifierCurrentDomain: string | null;
  expectsSameOrg: boolean;
  sharesOrganization: boolean;
}) {
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

function getMetadata(row: CanonicalVerificationRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
    ? row.metadata
    : {};
}

function getClaimSnapshot(row: CanonicalVerificationRow): Record<string, unknown> {
  return row.claim_snapshot &&
    typeof row.claim_snapshot === 'object' &&
    !Array.isArray(row.claim_snapshot)
    ? row.claim_snapshot
    : {};
}

function getRequesterDomainSnapshot(row: CanonicalVerificationRow): string | null {
  const metadata = getMetadata(row);
  const requesterEmail =
    typeof metadata.requesterEmailSnapshot === 'string' ? metadata.requesterEmailSnapshot : null;
  const fromClaim = (() => {
    const claimSnapshot = getClaimSnapshot(row);
    const context =
      claimSnapshot.context && typeof claimSnapshot.context === 'object'
        ? (claimSnapshot.context as Record<string, unknown>)
        : null;
    const email =
      typeof context?.requesterEmail === 'string'
        ? context.requesterEmail
        : typeof context?.requester_email === 'string'
          ? context.requester_email
          : null;
    return email;
  })();

  return getEmailDomain(requesterEmail || fromClaim);
}

function getSkillVerifierSource(row: CanonicalVerificationRow): string | null {
  const metadata = getMetadata(row);
  return typeof metadata.verifierSource === 'string' ? metadata.verifierSource : null;
}

function getImpactVerifierRelationship(row: CanonicalVerificationRow): string | null {
  const metadata = getMetadata(row);
  if (typeof metadata.verifierRelationship === 'string') {
    return metadata.verifierRelationship;
  }

  const claimSnapshot = getClaimSnapshot(row);
  return typeof claimSnapshot.verifierRelationship === 'string'
    ? claimSnapshot.verifierRelationship
    : null;
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

  const emailFromProfile = normalizeEmail(
    (profileLookup.data as { email?: string | null } | null)?.email || null
  );
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

  const emailFromWork = normalizeEmail(
    (workEmailLookup.data as { work_email?: string | null } | null)?.work_email || null
  );
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
  for (const row of data as Array<{ user_id?: string | null; org_id?: string | null }>) {
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
  for (const row of data as Array<{ org_id?: string | null }>) {
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

async function flagVerificationRecord(
  row: CanonicalVerificationRow,
  contradictionMeta: Record<string, unknown>
) {
  const adminClient = createAdminClient();
  const metadata = getMetadata(row);
  const integrityMeta =
    metadata.integrityMeta && typeof metadata.integrityMeta === 'object'
      ? (metadata.integrityMeta as Record<string, unknown>)
      : {};

  await adminClient
    .from('verification_records')
    .update({
      integrity_status: 'flagged',
      integrity_reason: VERIFICATION_INTEGRITY_REASONS.VERIFIER_PROFILE_CONTRADICTION,
      metadata: {
        ...metadata,
        integrityMeta: {
          ...integrityMeta,
          contradiction: contradictionMeta,
        },
        integrityFlaggedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  await writeVerificationAuditLog({
    actorId: null,
    action: 'verification.integrity.flagged',
    targetType:
      row.subject_type === 'skill'
        ? 'skill_verification_request'
        : 'impact_story_verification_request',
    targetId: row.id,
    meta: {
      reason: VERIFICATION_INTEGRITY_REASONS.VERIFIER_PROFILE_CONTRADICTION,
      contradiction: contradictionMeta,
      subject_type: row.subject_type,
      subject_id: row.subject_id,
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
      .from('verification_records')
      .select('id', { count: 'exact', head: true })
      .eq('subject_type', 'impact_story')
      .eq('subject_id', storyId)
      .eq('status', 'verified')
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
    const { data, error } = await adminClient
      .from('verification_records')
      .select(
        'id, owner_id, subject_type, subject_id, verifier_profile_id, metadata, claim_snapshot'
      )
      .eq('status', 'verified')
      .eq('integrity_status', 'clear')
      .contains('metadata', { verifierEmail: identity.verifierEmail });

    if (error || !data) {
      if (error) {
        console.error(
          'Failed to load canonical verification records for contradiction scan:',
          error
        );
      }
      return emptyResult();
    }

    const rows = (data as CanonicalVerificationRow[]).filter(
      (row) => row.subject_type === 'skill' || row.subject_type === 'impact_story'
    );

    if (rows.length === 0) {
      return emptyResult();
    }

    const requesterIds = Array.from(new Set(rows.map((row) => row.owner_id)));
    const [requesterOrgMap, verifierOrgIds] = await Promise.all([
      buildRequesterOrgMap(requesterIds),
      getVerifierOrganizations(identity.verifierProfileId),
    ]);

    let flaggedSkillCount = 0;
    let flaggedImpactCount = 0;
    const impactedStoryIds = new Set<string>();

    for (const row of rows) {
      const requesterDomain = getRequesterDomainSnapshot(row);
      const sharesOrg = hasOrgIntersection(requesterOrgMap, row.owner_id, verifierOrgIds);

      if (row.subject_type === 'skill') {
        const verifierSource = getSkillVerifierSource(row);
        const shouldFlag = shouldFlagRoleOrgMismatch({
          requesterDomain,
          verifierCurrentDomain: identity.verifierCurrentDomain,
          expectsSameOrg: sourceSuggestsSharedOrg(verifierSource),
          sharesOrganization: sharesOrg,
        });

        if (!shouldFlag) {
          continue;
        }

        await flagVerificationRecord(row, {
          type: 'role_org_mismatch',
          verifier_source: verifierSource,
          requester_domain_snapshot: requesterDomain,
          verifier_current_domain: identity.verifierCurrentDomain,
          shares_organization: sharesOrg,
        });
        flaggedSkillCount += 1;
        continue;
      }

      const verifierRelationship = getImpactVerifierRelationship(row);
      const shouldFlag = shouldFlagRoleOrgMismatch({
        requesterDomain,
        verifierCurrentDomain: identity.verifierCurrentDomain,
        expectsSameOrg: relationshipSuggestsSharedOrg(verifierRelationship),
        sharesOrganization: sharesOrg,
      });

      if (!shouldFlag) {
        continue;
      }

      await flagVerificationRecord(row, {
        type: 'role_org_mismatch',
        verifier_relationship: verifierRelationship,
        requester_domain_snapshot: requesterDomain,
        verifier_current_domain: identity.verifierCurrentDomain,
        shares_organization: sharesOrg,
      });
      flaggedImpactCount += 1;
      impactedStoryIds.add(row.subject_id);
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
