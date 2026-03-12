import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listCanonicalProofPackAggregatesForOwner } from '@/lib/proofs/canonical-pack';
import { listVerificationRecordsForOwner } from '@/lib/verification/policy';
import {
  listCanonicalSkillVerificationRequestsForOwner,
  listCanonicalSkillVerificationRequestsForVerifierEmail,
  mapCanonicalSkillVerificationRequestRecord,
} from '@/lib/verification/canonical-requests';
import { VerificationsClient } from './VerificationsClient';
import { normalizeEmail } from '@/lib/verification/integrity';

export const dynamic = 'force-dynamic';

type SkillVerificationRecord = {
  id: string;
  skill_id: string;
  custom_request_id?: string | null;
  requester_profile_id: string;
  verifier_email: string;
  verifier_source: 'peer' | 'manager' | 'external';
  verifier_relationship?: string | null;
  request_kind?: 'generic_verification' | 'human_observed_attestation' | null;
  attestation_request?: {
    skillIds: string[];
    skillLabels: string[];
  } | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  created_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  expires_at?: string | null;
  skills?: {
    id: string;
    competency_level: number;
    name_i18n?: unknown;
    skills_taxonomy?: {
      name_i18n?: unknown;
      skills_l3?: {
        name_i18n?: unknown;
        skills_subcategories?: {
          name_i18n?: unknown;
          skills_categories?: {
            name_i18n?: unknown;
          };
        };
      };
    };
  };
  profiles?: {
    id: string;
    display_name?: string | null;
    handle?: string | null;
    avatar_url?: string | null;
  };
};

type SkillDetailsRecord = NonNullable<SkillVerificationRecord['skills']>;
type ProfileDetailsRecord = NonNullable<SkillVerificationRecord['profiles']>;

type ImpactVerificationRecord = {
  id: string;
  impact_story_id: string;
  requester_profile_id: string;
  verifier_email: string;
  verifier_name?: string | null;
  verifier_relationship?: string | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  created_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  expires_at?: string | null;
  impact_stories?: {
    id?: string;
    title?: string | null;
  } | null;
  profiles?: {
    id: string;
    display_name?: string | null;
    handle?: string | null;
    avatar_url?: string | null;
  } | null;
};

type UnifiedVerificationRecord = {
  request_type: 'skill' | 'impact_story';
  id: string;
  skill_id?: string;
  custom_request_id?: string | null;
  impact_story_id?: string;
  impact_story_title?: string | null;
  requester_profile_id: string;
  verifier_email: string;
  verifier_source?: 'peer' | 'manager' | 'external';
  verifier_name?: string | null;
  verifier_relationship?: string | null;
  request_kind?: 'generic_verification' | 'human_observed_attestation' | null;
  attestation_request?: {
    skillIds: string[];
    skillLabels: string[];
  } | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  created_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  expires_at?: string | null;
  skills?: SkillVerificationRecord['skills'];
  profiles?: SkillVerificationRecord['profiles'];
  canonical_pack_id?: string | null;
  canonical_pack_title?: string | null;
  canonical_pack_summary?: string | null;
  canonical_outcomes_summary?: string | null;
  canonical_verification_status?: string | null;
  canonical_evidence_titles?: string[];
};

type CanonicalRequestContext = Pick<
  UnifiedVerificationRecord,
  | 'canonical_pack_id'
  | 'canonical_pack_title'
  | 'canonical_pack_summary'
  | 'canonical_outcomes_summary'
  | 'canonical_verification_status'
  | 'canonical_evidence_titles'
>;

type CanonicalProofPackAggregate = Awaited<
  ReturnType<typeof listCanonicalProofPackAggregatesForOwner>
>[number];
type VerificationRecord = Awaited<ReturnType<typeof listVerificationRecordsForOwner>>[number];

function verificationStatusRank(status: string | null | undefined) {
  switch (status) {
    case 'verified':
      return 3;
    case 'partially_verified':
      return 2;
    case 'unverified':
      return 1;
    default:
      return 0;
  }
}

function pickPreferredAggregate(
  aggregates: CanonicalProofPackAggregate[]
): CanonicalProofPackAggregate | null {
  if (aggregates.length === 0) {
    return null;
  }

  return [...aggregates].sort((left, right) => {
    const statusDelta =
      verificationStatusRank(right.verificationStatus) -
      verificationStatusRank(left.verificationStatus);
    if (statusDelta !== 0) {
      return statusDelta;
    }

    const rightTime = right.latestEvidenceAt ? new Date(right.latestEvidenceAt).getTime() : 0;
    const leftTime = left.latestEvidenceAt ? new Date(left.latestEvidenceAt).getTime() : 0;
    return rightTime - leftTime;
  })[0]!;
}

function buildCanonicalRequestContext(
  aggregate: CanonicalProofPackAggregate | null
): CanonicalRequestContext {
  if (!aggregate) {
    return {};
  }

  const evidenceTitles = aggregate.ownerFull.items
    .map((item) => item.artifact.title)
    .filter((title): title is string => typeof title === 'string' && title.trim().length > 0)
    .slice(0, 3);

  return {
    canonical_pack_id: aggregate.pack.id,
    canonical_pack_title: aggregate.ownerFull.title || aggregate.pack.title || null,
    canonical_pack_summary: aggregate.ownerFull.summary ?? aggregate.pack.summary ?? null,
    canonical_outcomes_summary:
      aggregate.ownerFull.outcomesSummary ?? aggregate.pack.outcomesSummary ?? null,
    canonical_verification_status: aggregate.verificationStatus,
    canonical_evidence_titles: evidenceTitles,
  };
}

function mapSkillRequestToUnified(
  request: SkillVerificationRecord,
  canonicalContext: CanonicalRequestContext
): UnifiedVerificationRecord {
  return {
    request_type: 'skill',
    id: request.id,
    skill_id: request.skill_id,
    custom_request_id: request.custom_request_id || null,
    requester_profile_id: request.requester_profile_id,
    verifier_email: request.verifier_email,
    verifier_source: request.verifier_source,
    verifier_relationship: request.verifier_relationship || null,
    request_kind: request.request_kind || 'generic_verification',
    attestation_request: request.attestation_request || null,
    message: request.message || null,
    status: request.status,
    created_at: request.created_at,
    responded_at: request.responded_at || null,
    response_message: request.response_message || null,
    expires_at: request.expires_at || null,
    skills: request.skills,
    profiles: request.profiles,
    ...canonicalContext,
  };
}

function mapImpactRequestToUnified(
  request: ImpactVerificationRecord,
  canonicalContext: CanonicalRequestContext
): UnifiedVerificationRecord {
  return {
    request_type: 'impact_story',
    id: request.id,
    impact_story_id: request.impact_story_id,
    impact_story_title: request.impact_stories?.title || null,
    requester_profile_id: request.requester_profile_id,
    verifier_email: request.verifier_email,
    verifier_name: request.verifier_name || null,
    verifier_relationship: request.verifier_relationship || null,
    message: request.message || null,
    status: request.status,
    created_at: request.created_at,
    responded_at: request.responded_at || null,
    response_message: request.response_message || null,
    expires_at: request.expires_at || null,
    profiles: request.profiles || undefined,
    ...canonicalContext,
  };
}

function toSkillVerificationRecords(rows: unknown): SkillVerificationRecord[] {
  return Array.isArray(rows) ? (rows as unknown as SkillVerificationRecord[]) : [];
}

function toImpactVerificationRecords(rows: unknown): ImpactVerificationRecord[] {
  return Array.isArray(rows) ? (rows as unknown as ImpactVerificationRecord[]) : [];
}

function mergeSkillVerificationRecords(
  canonical: SkillVerificationRecord[],
  legacy: SkillVerificationRecord[]
) {
  const merged = new Map<string, SkillVerificationRecord>();

  canonical.forEach((record) => {
    merged.set(record.id, record);
  });

  legacy.forEach((record) => {
    if (!merged.has(record.id)) {
      merged.set(record.id, record);
    }
  });

  return Array.from(merged.values()).sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

function toAttestationRequestShape(
  value: Record<string, unknown> | null | undefined
): SkillVerificationRecord['attestation_request'] {
  if (!value || !Array.isArray(value.skillIds) || !Array.isArray(value.skillLabels)) {
    return null;
  }

  return {
    skillIds: value.skillIds.filter((item): item is string => typeof item === 'string'),
    skillLabels: value.skillLabels.filter((item): item is string => typeof item === 'string'),
  };
}

function toSkillVerificationRecordFromCanonical(
  request: ReturnType<typeof mapCanonicalSkillVerificationRequestRecord>,
  skillDetailsById: Map<string, SkillDetailsRecord>,
  requesterProfilesById: Map<string, ProfileDetailsRecord>
): SkillVerificationRecord {
  return {
    id: request.id,
    skill_id: request.skill_id,
    custom_request_id: null,
    requester_profile_id: request.requester_profile_id,
    verifier_email: request.verifier_email,
    verifier_source: request.verifier_source,
    verifier_relationship: request.verifier_relationship,
    request_kind: request.request_kind,
    attestation_request: toAttestationRequestShape(request.attestation_request),
    message: request.message,
    status: request.status,
    created_at: request.created_at,
    responded_at: request.responded_at,
    response_message: request.response_message,
    expires_at: request.expires_at,
    skills: skillDetailsById.get(request.skill_id),
    profiles: requesterProfilesById.get(request.requester_profile_id),
  };
}

export default async function VerificationsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user's email
  const { data: authUser } = await supabase.auth.getUser();
  const userEmail = normalizeEmail(authUser.user?.email || null) || '';
  const hasVerifiedEmail = Boolean(authUser.user?.email_confirmed_at);

  const verificationSelect = `
    id,
    skill_id,
    custom_request_id,
    requester_profile_id,
    verifier_email,
    verifier_source,
    verifier_relationship,
    request_kind,
    attestation_request,
    message,
    status,
    created_at,
    responded_at,
    response_message,
    expires_at,
    skills:skills!skill_verification_requests_skill_id_fkey (
      id,
      competency_level:level,
      skills_taxonomy:skills_taxonomy!skills_skill_code_fkey (
        name_i18n,
        skills_l3:skills_l3!skills_taxonomy_cat_id_subcat_id_l3_id_fkey (
          name_i18n,
          skills_subcategories:skills_subcategories!skills_l3_cat_id_subcat_id_fkey (
            name_i18n,
            skills_categories:skills_categories!skills_subcategories_cat_id_fkey (
              name_i18n
            )
          )
        )
      )
    ),
    profiles:profiles!skill_verification_requests_requester_profile_id_fkey (
      id,
      display_name,
      handle,
      avatar_url
    )
  `;

  const [incomingResult, sentResult] = await Promise.all([
    userEmail
      ? supabase
          .from('skill_verification_requests')
          .select(verificationSelect)
          .eq('verifier_email', userEmail)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null } as const),
    supabase
      .from('skill_verification_requests')
      .select(verificationSelect)
      .eq('requester_profile_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const sentImpactResult = await supabase
    .from('impact_story_verification_requests')
    .select(
      `
        id,
        impact_story_id,
        requester_profile_id,
        verifier_email,
        verifier_name,
        verifier_relationship,
        message,
        status,
        created_at,
        responded_at,
        response_message,
        expires_at,
        impact_stories:impact_story_id (
          id,
          title
        )
      `
    )
    .eq('requester_profile_id', user.id)
    .order('created_at', { ascending: false });

  const [
    canonicalAggregates,
    verificationRecords,
    canonicalIncomingSkillRows,
    canonicalSentSkillRows,
  ] = await Promise.all([
    listCanonicalProofPackAggregatesForOwner('individual_profile', user.id).catch(() => []),
    listVerificationRecordsForOwner('individual_profile', user.id).catch(() => []),
    userEmail
      ? listCanonicalSkillVerificationRequestsForVerifierEmail(userEmail).catch(() => [])
      : Promise.resolve([]),
    listCanonicalSkillVerificationRequestsForOwner(user.id).catch(() => []),
  ]);

  let incomingImpactResult: { data: unknown[] | null; error: unknown | null } = {
    data: [],
    error: null,
  };
  if (userEmail && hasVerifiedEmail) {
    try {
      const adminClient = createAdminClient();
      const adminResult = await adminClient
        .from('impact_story_verification_requests')
        .select(
          `
            id,
            impact_story_id,
            requester_profile_id,
            verifier_email,
            verifier_name,
            verifier_relationship,
            message,
            status,
            created_at,
            responded_at,
            response_message,
            expires_at,
            impact_stories:impact_story_id (
              id,
              title
            ),
            profiles:requester_profile_id (
              id,
              display_name,
              handle,
              avatar_url
            )
          `
        )
        .eq('verifier_email', userEmail)
        .order('created_at', { ascending: false });

      incomingImpactResult = {
        data: adminResult.data as unknown[] | null,
        error: adminResult.error as unknown,
      };
    } catch (error) {
      incomingImpactResult = { data: null, error };
    }
  }

  if (incomingResult.error) {
    console.error('Failed to load incoming verification requests:', incomingResult.error);
  }
  if (sentResult.error) {
    console.error('Failed to load sent verification requests:', sentResult.error);
  }
  if (sentImpactResult.error) {
    console.error('Failed to load sent impact verification requests:', sentImpactResult.error);
  }
  if (incomingImpactResult.error) {
    console.error(
      'Failed to load incoming impact verification requests:',
      incomingImpactResult.error
    );
  }

  const incomingSkillRequests = toSkillVerificationRecords(incomingResult.data);
  const incomingImpactRequests = toImpactVerificationRecords(incomingImpactResult.data);
  const sentSkillRequests = toSkillVerificationRecords(sentResult.data);
  const sentImpactRequests = toImpactVerificationRecords(sentImpactResult.data);
  const canonicalIncomingSkillRequests = canonicalIncomingSkillRows.map(
    mapCanonicalSkillVerificationRequestRecord
  );
  const canonicalSentSkillRequests = canonicalSentSkillRows.map(
    mapCanonicalSkillVerificationRequestRecord
  );

  const canonicalSkillIds = Array.from(
    new Set(
      [...canonicalIncomingSkillRequests, ...canonicalSentSkillRequests]
        .map((request) => request.skill_id)
        .filter((skillId): skillId is string => typeof skillId === 'string' && skillId.length > 0)
    )
  );
  const canonicalRequesterProfileIds = Array.from(
    new Set(
      [...canonicalIncomingSkillRequests, ...canonicalSentSkillRequests]
        .map((request) => request.requester_profile_id)
        .filter(
          (profileId): profileId is string => typeof profileId === 'string' && profileId.length > 0
        )
    )
  );

  const [canonicalSkillDetailsResult, canonicalRequesterProfilesResult] = await Promise.all([
    canonicalSkillIds.length > 0
      ? supabase
          .from('skills')
          .select(
            `
              id,
              competency_level:level,
              skill_id,
              custom_skill_name,
              skills_taxonomy:skills_taxonomy!skills_skill_code_fkey (
                name_i18n,
                skills_l3:skills_l3!skills_taxonomy_cat_id_subcat_id_l3_id_fkey (
                  name_i18n,
                  skills_subcategories:skills_subcategories!skills_l3_cat_id_subcat_id_fkey (
                    name_i18n,
                    skills_categories:skills_categories!skills_subcategories_cat_id_fkey (
                      name_i18n
                    )
                  )
                )
              )
            `
          )
          .in('id', canonicalSkillIds)
      : Promise.resolve({ data: [], error: null } as const),
    canonicalRequesterProfileIds.length > 0
      ? supabase
          .from('profiles')
          .select('id, display_name, handle, avatar_url')
          .in('id', canonicalRequesterProfileIds)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  if (canonicalSkillDetailsResult.error) {
    console.error(
      'Failed to load canonical skill verification details:',
      canonicalSkillDetailsResult.error
    );
  }
  if (canonicalRequesterProfilesResult.error) {
    console.error(
      'Failed to load canonical requester profiles for verification requests:',
      canonicalRequesterProfilesResult.error
    );
  }

  const canonicalSkillDetailsById = new Map<string, SkillDetailsRecord>();
  (Array.isArray(canonicalSkillDetailsResult.data) ? canonicalSkillDetailsResult.data : []).forEach(
    (skill) => {
      if (skill?.id) {
        canonicalSkillDetailsById.set(skill.id as string, skill as SkillDetailsRecord);
      }
    }
  );
  const canonicalRequesterProfilesById = new Map<string, ProfileDetailsRecord>();
  (Array.isArray(canonicalRequesterProfilesResult.data)
    ? canonicalRequesterProfilesResult.data
    : []
  ).forEach((profile) => {
    if (profile?.id) {
      canonicalRequesterProfilesById.set(profile.id as string, profile as ProfileDetailsRecord);
    }
  });

  const enrichedIncomingSkillRequests = mergeSkillVerificationRecords(
    canonicalIncomingSkillRequests.map((request) =>
      toSkillVerificationRecordFromCanonical(
        request,
        canonicalSkillDetailsById,
        canonicalRequesterProfilesById
      )
    ),
    incomingSkillRequests
  );
  const enrichedSentSkillRequests = mergeSkillVerificationRecords(
    canonicalSentSkillRequests.map((request) =>
      toSkillVerificationRecordFromCanonical(
        request,
        canonicalSkillDetailsById,
        canonicalRequesterProfilesById
      )
    ),
    sentSkillRequests
  );

  const aggregatesBySkillId = new Map<string, CanonicalProofPackAggregate[]>();
  const aggregatesByImpactStoryId = new Map<string, CanonicalProofPackAggregate[]>();
  const aggregateByVerificationRequestId = new Map<string, CanonicalProofPackAggregate>();

  canonicalAggregates.forEach((aggregate) => {
    if (aggregate.pack.primarySubjectType === 'skill' && aggregate.pack.primarySubjectId) {
      const existing = aggregatesBySkillId.get(aggregate.pack.primarySubjectId) ?? [];
      existing.push(aggregate);
      aggregatesBySkillId.set(aggregate.pack.primarySubjectId, existing);
    }

    if (aggregate.pack.primarySubjectType === 'impact_story' && aggregate.pack.primarySubjectId) {
      const existing = aggregatesByImpactStoryId.get(aggregate.pack.primarySubjectId) ?? [];
      existing.push(aggregate);
      aggregatesByImpactStoryId.set(aggregate.pack.primarySubjectId, existing);
    }
  });

  verificationRecords.forEach((record) => {
    if (
      record.sourceRequestTable !== 'impact_story_verification_requests' ||
      !record.sourceRequestId
    ) {
      return;
    }

    const linkedAggregate = canonicalAggregates.find(
      (aggregate) =>
        aggregate.verificationReferences.some((reference) => reference.id === record.id) ||
        (record.proofArtifactId
          ? aggregate.items.some(({ artifact }) => artifact.id === record.proofArtifactId)
          : false)
    );

    if (linkedAggregate) {
      aggregateByVerificationRequestId.set(record.sourceRequestId, linkedAggregate);
    }
  });

  const incomingRequests: UnifiedVerificationRecord[] = [
    ...enrichedIncomingSkillRequests.map((request) =>
      mapSkillRequestToUnified(
        request,
        buildCanonicalRequestContext(
          pickPreferredAggregate(aggregatesBySkillId.get(request.skill_id) ?? [])
        )
      )
    ),
    ...incomingImpactRequests.map((request) =>
      mapImpactRequestToUnified(
        request,
        buildCanonicalRequestContext(
          aggregateByVerificationRequestId.get(request.id) ??
            pickPreferredAggregate(aggregatesByImpactStoryId.get(request.impact_story_id) ?? [])
        )
      )
    ),
  ].sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  const sentRequests: UnifiedVerificationRecord[] = [
    ...enrichedSentSkillRequests.map((request) =>
      mapSkillRequestToUnified(
        request,
        buildCanonicalRequestContext(
          pickPreferredAggregate(aggregatesBySkillId.get(request.skill_id) ?? [])
        )
      )
    ),
    ...sentImpactRequests.map((request) =>
      mapImpactRequestToUnified(
        request,
        buildCanonicalRequestContext(
          aggregateByVerificationRequestId.get(request.id) ??
            pickPreferredAggregate(aggregatesByImpactStoryId.get(request.impact_story_id) ?? [])
        )
      )
    ),
  ].sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  return (
    <VerificationsClient
      incomingRequests={incomingRequests}
      sentRequests={sentRequests}
      userEmail={userEmail}
    />
  );
}
