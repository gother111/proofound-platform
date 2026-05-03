import { listCanonicalProofPackAggregatesForOwner } from '@/lib/proofs/canonical-pack';
import {
  listCanonicalBundlesForOwner,
  type CanonicalBundleArtifactType,
} from '@/lib/verification/canonical-bundles';
import {
  listCanonicalSkillVerificationRequestsForOwner,
  listCanonicalSkillVerificationRequestsForVerifierEmail,
  mapCanonicalSkillVerificationRequestRecord,
} from '@/lib/verification/canonical-requests';
import {
  listCanonicalImpactVerificationRequestsForOwner,
  listCanonicalImpactVerificationRequestsForVerifierEmail,
  mapCanonicalImpactVerificationRequestRecord,
} from '@/lib/verification/canonical-impact-requests';

type CanonicalProofPackAggregate = Awaited<
  ReturnType<typeof listCanonicalProofPackAggregatesForOwner>
>[number];

type SkillVerificationRecord = ReturnType<typeof mapCanonicalSkillVerificationRequestRecord>;
type ImpactVerificationRecord = ReturnType<typeof mapCanonicalImpactVerificationRequestRecord>;

type SkillDetailsRecord = {
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

type ProfileDetailsRecord = {
  id: string;
  display_name?: string | null;
  handle?: string | null;
  avatar_url?: string | null;
};

type ImpactStorySummaryRecord = {
  id: string;
  title?: string | null;
};

type CanonicalRequestContext = {
  canonicalPackId?: string | null;
  canonicalPackTitle?: string | null;
  canonicalPackSummary?: string | null;
  canonicalOutcomesSummary?: string | null;
  canonicalVerificationStatus?: string | null;
  canonicalEvidenceTitles?: string[];
};

export type VerificationComposerProofPackOption = {
  proofPackId: string;
  claimId: string;
  title: string;
  claimStatement: string;
  ownershipStatement?: string | null;
  outcomeSummary?: string | null;
  timeframe?: string | null;
  evidenceTitles: string[];
  primarySubjectType: 'skill';
  primarySubjectId: string;
};

export type VerificationRequestView = {
  id: string;
  subjectType: 'skill' | 'impact_story' | 'custom_bundle';
  subjectId: string;
  verificationKind:
    | 'skill_attestation_peer'
    | 'skill_attestation_manager'
    | 'impact_attestation'
    | 'verification_bundle';
  requestKind:
    | 'generic_verification'
    | 'human_observed_attestation'
    | 'impact_attestation'
    | 'custom_bundle';
  bundleId?: string | null;
  bundleItemCount?: number;
  bundlePreviewLabels?: string[];
  bundleArtifactTypes?: CanonicalBundleArtifactType[];
  impactStoryTitle?: string | null;
  requesterProfileId: string;
  verifierEmail: string;
  verifierSource?: 'peer' | 'manager' | 'external';
  verifierName?: string | null;
  verifierRelationship?: string | null;
  attestationRequest?: {
    skillIds: string[];
    skillLabels: string[];
  } | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  createdAt: string;
  respondedAt?: string | null;
  responseMessage?: string | null;
  expiresAt?: string | null;
  canonicalPackId?: string | null;
  canonicalPackTitle?: string | null;
  canonicalPackSummary?: string | null;
  canonicalOutcomesSummary?: string | null;
  canonicalVerificationStatus?: string | null;
  canonicalEvidenceTitles?: string[];
  proofLabel?: string | null;
  claimSummary?: string | null;
  confirmationOutcome?: string | null;
  skills?: SkillDetailsRecord;
  profiles?: ProfileDetailsRecord;
};

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
    canonicalPackId: aggregate.pack.id,
    canonicalPackTitle: aggregate.ownerFull.title || aggregate.pack.title || null,
    canonicalPackSummary: aggregate.ownerFull.summary ?? aggregate.pack.summary ?? null,
    canonicalOutcomesSummary:
      aggregate.ownerFull.outcomesSummary ?? aggregate.pack.outcomesSummary ?? null,
    canonicalVerificationStatus: aggregate.verificationStatus,
    canonicalEvidenceTitles: evidenceTitles,
  };
}

function compactComposerTimeframe(aggregate: CanonicalProofPackAggregate): string | null {
  const timeframe = aggregate.ownerFull.contract?.timeframe;
  if (!timeframe) {
    return null;
  }
  return timeframe.label || [timeframe.start, timeframe.end].filter(Boolean).join(' to ') || null;
}

function buildComposerProofPackOptions(
  aggregates: CanonicalProofPackAggregate[]
): VerificationComposerProofPackOption[] {
  return aggregates
    .filter(
      (aggregate) =>
        aggregate.pack.primarySubjectType === 'skill' &&
        typeof aggregate.pack.primarySubjectId === 'string' &&
        aggregate.pack.primarySubjectId.length > 0
    )
    .map((aggregate) => {
      const contract = aggregate.ownerFull.contract;
      const title = aggregate.ownerFull.title || aggregate.pack.title;
      return {
        proofPackId: aggregate.pack.id,
        claimId: aggregate.pack.primarySubjectId,
        title,
        claimStatement:
          contract?.primaryClaim?.statement ||
          aggregate.ownerFull.summary ||
          aggregate.pack.summary ||
          title,
        ownershipStatement: contract?.ownershipStatement ?? null,
        outcomeSummary:
          contract?.outcomeSummary ??
          aggregate.ownerFull.outcomesSummary ??
          aggregate.pack.outcomesSummary ??
          null,
        timeframe: compactComposerTimeframe(aggregate),
        evidenceTitles: aggregate.ownerFull.items
          .map((item) => item.artifact.artifactDisplayName || item.artifact.title)
          .filter((title): title is string => typeof title === 'string' && title.trim().length > 0)
          .slice(0, 5),
        primarySubjectType: 'skill' as const,
        primarySubjectId: aggregate.pack.primarySubjectId,
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}

function toAttestationRequestShape(
  value: Record<string, unknown> | null | undefined
): VerificationRequestView['attestationRequest'] {
  if (!value || !Array.isArray(value.skillIds) || !Array.isArray(value.skillLabels)) {
    return null;
  }

  return {
    skillIds: value.skillIds.filter((item): item is string => typeof item === 'string'),
    skillLabels: value.skillLabels.filter((item): item is string => typeof item === 'string'),
  };
}

function joinLabels(labels: string[]) {
  if (labels.length <= 2) {
    return labels.join(', ');
  }

  const visible = labels.slice(0, 2);
  return `${visible.join(', ')} + ${labels.length - visible.length} more`;
}

function getSkillLabel(skill?: SkillDetailsRecord | null) {
  if (!skill) {
    return 'this skill';
  }

  if (skill.name_i18n && typeof skill.name_i18n === 'object' && 'en' in skill.name_i18n) {
    const name = (skill.name_i18n as Record<string, unknown>).en;
    if (typeof name === 'string' && name.trim().length > 0) {
      return name;
    }
  }

  const taxonomyName = skill.skills_taxonomy?.name_i18n;
  if (taxonomyName && typeof taxonomyName === 'object' && 'en' in taxonomyName) {
    const name = (taxonomyName as Record<string, unknown>).en;
    if (typeof name === 'string' && name.trim().length > 0) {
      return name;
    }
  }

  if (typeof taxonomyName === 'string' && taxonomyName.trim().length > 0) {
    return taxonomyName;
  }

  return 'this skill';
}

function buildSkillClaimSummary(
  request: SkillVerificationRecord,
  skill?: SkillDetailsRecord | null
): string {
  const attestationRequest = toAttestationRequestShape(request.attestation_request);
  const labels = attestationRequest?.skillLabels?.filter((label) => label.trim().length > 0) || [];
  if (labels.length > 0) {
    return `Observed in practice: ${joinLabels(labels)}.`;
  }

  return `That this proof demonstrates ${getSkillLabel(skill)} in real work.`;
}

function buildImpactClaimSummary(request: ImpactVerificationRecord): string {
  const snapshot =
    request.claim_snapshot && typeof request.claim_snapshot === 'object'
      ? (request.claim_snapshot as Record<string, unknown>)
      : {};

  const roleClaim =
    snapshot.roleClaim && typeof snapshot.roleClaim === 'object'
      ? (snapshot.roleClaim as Record<string, unknown>)
      : null;
  const roleLabel = roleClaim && typeof roleClaim.label === 'string' ? roleClaim.label.trim() : '';

  const outcomeClaims = Array.isArray(snapshot.outcomeClaims)
    ? snapshot.outcomeClaims
        .map((claim) =>
          claim &&
          typeof claim === 'object' &&
          typeof (claim as Record<string, unknown>).label === 'string'
            ? String((claim as Record<string, unknown>).label).trim()
            : ''
        )
        .filter((label) => label.length > 0)
    : [];

  const artifactsClaim =
    snapshot.artifactsClaim && typeof snapshot.artifactsClaim === 'object'
      ? (snapshot.artifactsClaim as Record<string, unknown>)
      : null;
  const artifactsEnabled = Boolean(artifactsClaim?.enabled);

  const parts: string[] = [];
  if (roleLabel) {
    parts.push(roleLabel);
  }
  if (outcomeClaims.length > 0) {
    parts.push(`Outcome claims: ${joinLabels(outcomeClaims)}`);
  }
  if (artifactsEnabled) {
    parts.push('Supporting artifacts authenticity');
  }

  if (parts.length === 0) {
    return 'That this proof’s role, outcomes, and supporting evidence are accurate.';
  }

  return parts.join('. ') + '.';
}

function buildBundleClaimSummary(
  bundle: Awaited<ReturnType<typeof listCanonicalBundlesForOwner>>[number]
): string {
  const labels = bundle.items
    .map((item) => item.display_label?.trim())
    .filter((label): label is string => Boolean(label));

  if (labels.length === 0) {
    return 'Selected proof-backed artifacts from an earlier grouped request.';
  }

  return `Selected proof-backed artifacts: ${joinLabels(labels)}.`;
}

function buildConfirmationOutcome(
  request: Pick<VerificationRequestView, 'subjectType' | 'requestKind'>
) {
  if (request.subjectType === 'impact_story') {
    return 'If confirmed, this Proof Pack gains a scoped impact attestation for the role, outcomes, or artifacts named here.';
  }

  if (request.subjectType === 'custom_bundle') {
    return 'If confirmed, each included proof keeps its own scoped verification record. Legacy grouped requests do not create broad trust lift.';
  }

  if (request.requestKind === 'human_observed_attestation') {
    return 'If confirmed, this Proof Pack gains a bounded observed-in-practice attestation for the named skill.';
  }

  return 'If confirmed, this Proof Pack gains a scoped non-self attestation for this skill claim.';
}

function mapSkillRequestToView(
  request: SkillVerificationRecord,
  skillDetailsById: Map<string, SkillDetailsRecord>,
  requesterProfilesById: Map<string, ProfileDetailsRecord>,
  canonicalContext: CanonicalRequestContext,
  bundleId?: string | null
): VerificationRequestView {
  const skill = skillDetailsById.get(request.skill_id);
  return {
    id: request.id,
    subjectType: 'skill',
    subjectId: request.skill_id,
    verificationKind:
      request.verifier_source === 'manager'
        ? 'skill_attestation_manager'
        : 'skill_attestation_peer',
    requestKind: request.request_kind || 'generic_verification',
    bundleId: bundleId || null,
    requesterProfileId: request.requester_profile_id,
    verifierEmail: request.verifier_email,
    verifierSource: request.verifier_source,
    verifierRelationship: request.verifier_relationship || null,
    attestationRequest: toAttestationRequestShape(request.attestation_request),
    message: request.message || null,
    status:
      request.status === 'cancelled' || request.status === 'revoked' ? 'declined' : request.status,
    createdAt: request.created_at,
    respondedAt: request.responded_at || null,
    responseMessage: request.response_message || null,
    expiresAt: request.expires_at || null,
    proofLabel: canonicalContext.canonicalPackTitle || getSkillLabel(skill),
    claimSummary: buildSkillClaimSummary(request, skill),
    confirmationOutcome: buildConfirmationOutcome({
      subjectType: 'skill',
      requestKind: request.request_kind || 'generic_verification',
    }),
    skills: skill,
    profiles: requesterProfilesById.get(request.requester_profile_id),
    ...canonicalContext,
  };
}

function mapImpactRequestToView(
  request: ImpactVerificationRecord,
  impactStoriesById: Map<string, ImpactStorySummaryRecord>,
  requesterProfilesById: Map<string, ProfileDetailsRecord>,
  canonicalContext: CanonicalRequestContext
): VerificationRequestView {
  const impactStoryTitle = impactStoriesById.get(request.impact_story_id)?.title || null;
  return {
    id: request.id,
    subjectType: 'impact_story',
    subjectId: request.impact_story_id,
    verificationKind: 'impact_attestation',
    requestKind: 'impact_attestation',
    impactStoryTitle: impactStoriesById.get(request.impact_story_id)?.title || null,
    requesterProfileId: request.requester_profile_id,
    verifierEmail: request.verifier_email,
    verifierName: request.verifier_name || null,
    verifierRelationship: request.verifier_relationship || null,
    message: request.message || null,
    status:
      request.status === 'cancelled' || request.status === 'revoked' ? 'declined' : request.status,
    createdAt: request.created_at,
    respondedAt: request.responded_at || null,
    responseMessage: request.response_message || null,
    expiresAt: request.expires_at || null,
    proofLabel: canonicalContext.canonicalPackTitle || impactStoryTitle || 'Impact story proof',
    claimSummary: buildImpactClaimSummary(request),
    confirmationOutcome: buildConfirmationOutcome({
      subjectType: 'impact_story',
      requestKind: 'impact_attestation',
    }),
    profiles: requesterProfilesById.get(request.requester_profile_id),
    ...canonicalContext,
  };
}

function mapBundleRequestToView(
  bundle: Awaited<ReturnType<typeof listCanonicalBundlesForOwner>>[number]
): VerificationRequestView {
  return {
    id: bundle.id,
    subjectType: 'custom_bundle',
    subjectId: bundle.id,
    verificationKind: 'verification_bundle',
    requestKind: 'custom_bundle',
    bundleId: bundle.id,
    bundleItemCount: bundle.items.length,
    bundlePreviewLabels: bundle.items.slice(0, 3).map((item) => item.display_label),
    bundleArtifactTypes: [...new Set(bundle.items.map((item) => item.artifact_type))],
    requesterProfileId: bundle.requester_profile_id,
    verifierEmail: bundle.verifier_email,
    verifierSource: bundle.verifier_source,
    verifierRelationship: bundle.verifier_relationship || null,
    message: bundle.message || null,
    status: bundle.status === 'cancelled' ? 'expired' : bundle.status,
    createdAt: bundle.created_at,
    respondedAt: bundle.responded_at || null,
    responseMessage: bundle.response_message || null,
    expiresAt: bundle.expires_at || null,
    proofLabel: bundle.items[0]?.display_label || 'Legacy grouped request',
    claimSummary: buildBundleClaimSummary(bundle),
    confirmationOutcome: buildConfirmationOutcome({
      subjectType: 'custom_bundle',
      requestKind: 'custom_bundle',
    }),
  };
}

export async function loadVerificationRequestFeed(params: {
  userId: string;
  userEmail: string;
  hasVerifiedEmail: boolean;
  supabase: any;
}) {
  const [
    canonicalAggregates,
    canonicalBundles,
    canonicalIncomingSkillRows,
    canonicalSentSkillRows,
    canonicalIncomingImpactRows,
    canonicalSentImpactRows,
  ] = await Promise.all([
    listCanonicalProofPackAggregatesForOwner('individual_profile', params.userId).catch(() => []),
    listCanonicalBundlesForOwner(params.userId).catch(() => []),
    params.userEmail
      ? listCanonicalSkillVerificationRequestsForVerifierEmail(params.userEmail).catch(() => [])
      : Promise.resolve([]),
    listCanonicalSkillVerificationRequestsForOwner(params.userId).catch(() => []),
    params.userEmail && params.hasVerifiedEmail
      ? listCanonicalImpactVerificationRequestsForVerifierEmail(params.userEmail).catch(() => [])
      : Promise.resolve([]),
    listCanonicalImpactVerificationRequestsForOwner(params.userId).catch(() => []),
  ]);

  const canonicalIncomingSkillRequests = canonicalIncomingSkillRows.map(
    mapCanonicalSkillVerificationRequestRecord
  );
  const canonicalSentSkillRequests = canonicalSentSkillRows.map(
    mapCanonicalSkillVerificationRequestRecord
  );
  const canonicalIncomingImpactRequests = canonicalIncomingImpactRows.map(
    mapCanonicalImpactVerificationRequestRecord
  );
  const canonicalSentImpactRequests = canonicalSentImpactRows.map(
    mapCanonicalImpactVerificationRequestRecord
  );
  const bundledSentRequestIds = new Set(
    [
      ...canonicalSentSkillRequests
        .filter((request) => Boolean(request.custom_request_id))
        .map((request) => request.id),
      ...canonicalSentImpactRequests
        .filter((request) => Boolean(request.custom_request_id))
        .map((request) => request.id),
    ].filter(
      (requestId): requestId is string => typeof requestId === 'string' && requestId.length > 0
    )
  );

  const skillIds = Array.from(
    new Set(
      [
        ...canonicalIncomingSkillRequests.map((request) => request.skill_id),
        ...canonicalSentSkillRequests.map((request) => request.skill_id),
      ].filter((skillId): skillId is string => typeof skillId === 'string' && skillId.length > 0)
    )
  );
  const requesterProfileIds = Array.from(
    new Set(
      [
        ...canonicalIncomingSkillRequests.map((request) => request.requester_profile_id),
        ...canonicalSentSkillRequests.map((request) => request.requester_profile_id),
        ...canonicalIncomingImpactRequests.map((request) => request.requester_profile_id),
        ...canonicalSentImpactRequests.map((request) => request.requester_profile_id),
        ...canonicalBundles.map((bundle) => bundle.requester_profile_id),
      ].filter(
        (profileId): profileId is string => typeof profileId === 'string' && profileId.length > 0
      )
    )
  );
  const impactStoryIds = Array.from(
    new Set(
      [...canonicalIncomingImpactRequests, ...canonicalSentImpactRequests]
        .map((request) => request.impact_story_id)
        .filter((storyId): storyId is string => typeof storyId === 'string' && storyId.length > 0)
    )
  );

  const [skillDetailsResult, requesterProfilesResult, impactStoriesResult] = await Promise.all([
    skillIds.length > 0
      ? params.supabase
          .from('skills')
          .select(
            `
              id,
              competency_level:level,
              skill_id,
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
          .in('id', skillIds)
      : Promise.resolve({ data: [], error: null } as const),
    requesterProfileIds.length > 0
      ? params.supabase
          .from('profiles')
          .select('id, display_name, handle, avatar_url')
          .in('id', requesterProfileIds)
      : Promise.resolve({ data: [], error: null } as const),
    impactStoryIds.length > 0
      ? params.supabase.from('impact_stories').select('id, title').in('id', impactStoryIds)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  if (skillDetailsResult.error) {
    console.error('Failed to load canonical verification skill details:', skillDetailsResult.error);
  }
  if (requesterProfilesResult.error) {
    console.error(
      'Failed to load requester profiles for canonical verification requests:',
      requesterProfilesResult.error
    );
  }
  if (impactStoriesResult.error) {
    console.error(
      'Failed to load impact story titles for canonical verification requests:',
      impactStoriesResult.error
    );
  }

  const skillDetailsById = new Map<string, SkillDetailsRecord>();
  (Array.isArray(skillDetailsResult.data) ? skillDetailsResult.data : []).forEach(
    (skill: SkillDetailsRecord | null | undefined) => {
      if (skill?.id) {
        skillDetailsById.set(skill.id, skill);
      }
    }
  );

  const requesterProfilesById = new Map<string, ProfileDetailsRecord>();
  (Array.isArray(requesterProfilesResult.data) ? requesterProfilesResult.data : []).forEach(
    (profile: ProfileDetailsRecord | null | undefined) => {
      if (profile?.id) {
        requesterProfilesById.set(profile.id, profile);
      }
    }
  );

  const impactStoriesById = new Map<string, ImpactStorySummaryRecord>();
  (Array.isArray(impactStoriesResult.data) ? impactStoriesResult.data : []).forEach(
    (story: ImpactStorySummaryRecord | null | undefined) => {
      if (story?.id) {
        impactStoriesById.set(story.id, story);
      }
    }
  );

  const aggregatesBySkillId = new Map<string, CanonicalProofPackAggregate[]>();
  const aggregatesByImpactStoryId = new Map<string, CanonicalProofPackAggregate[]>();

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

  const incomingRequests: VerificationRequestView[] = [
    ...canonicalIncomingSkillRequests.map((request) =>
      mapSkillRequestToView(
        request,
        skillDetailsById,
        requesterProfilesById,
        buildCanonicalRequestContext(
          pickPreferredAggregate(aggregatesBySkillId.get(request.skill_id) ?? [])
        )
      )
    ),
    ...canonicalIncomingImpactRequests.map((request) =>
      mapImpactRequestToView(
        request,
        impactStoriesById,
        requesterProfilesById,
        buildCanonicalRequestContext(
          pickPreferredAggregate(aggregatesByImpactStoryId.get(request.impact_story_id) ?? [])
        )
      )
    ),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  const sentRequests: VerificationRequestView[] = [
    ...canonicalBundles.map((bundle) => mapBundleRequestToView(bundle)),
    ...canonicalSentSkillRequests.map((request) =>
      request.custom_request_id
        ? null
        : mapSkillRequestToView(
            request,
            skillDetailsById,
            requesterProfilesById,
            buildCanonicalRequestContext(
              pickPreferredAggregate(aggregatesBySkillId.get(request.skill_id) ?? [])
            ),
            request.custom_request_id || null
          )
    ),
    ...canonicalSentImpactRequests.map((request) =>
      request.custom_request_id
        ? null
        : mapImpactRequestToView(
            request,
            impactStoriesById,
            requesterProfilesById,
            buildCanonicalRequestContext(
              pickPreferredAggregate(aggregatesByImpactStoryId.get(request.impact_story_id) ?? [])
            )
          )
    ),
  ]
    .filter((request): request is VerificationRequestView => Boolean(request))
    .filter((request) => !bundledSentRequestIds.has(request.id))
    .sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );

  return {
    incomingRequests,
    sentRequests,
    composerProofPacks: buildComposerProofPackOptions(canonicalAggregates),
  };
}
