import {
  expandSkillSignals as expandSignals,
  relationWeight,
} from '@/lib/matching/skill-expansion';
import { hasMeaningfulTokenOverlap, normalizePhrase, tokenOverlap } from '@/lib/matching/normalize';
import type {
  AssignmentMatchSignals,
  CandidateMatchSignals,
  CandidateProofSignal,
  DiscoveredCandidate,
  DiscoverySignal,
  LowSupplyPolicyInput,
  PublicSafeEvidenceRef,
  SkillSignal,
} from '@/lib/matching/types';

type UnknownRecord = Record<string, unknown>;

type DiscoveryInput = {
  assignment: unknown;
  candidates: unknown[];
  lowSupply?: LowSupplyPolicyInput;
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '');
}

function readSkillLabel(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return null;

  return (
    asString(value.id) ??
    asString(value.skillCode) ??
    asString(value.skill_code) ??
    asString(value.skillId) ??
    asString(value.skill_id) ??
    asString(value.label) ??
    asString(value.name) ??
    null
  );
}

function makeSignal(
  raw: string,
  source: SkillSignal['source'],
  evidenceRef?: PublicSafeEvidenceRef
): SkillSignal | null {
  const normalized = normalizePhrase(raw);
  if (!normalized) return null;
  return {
    raw,
    normalized,
    source,
    canonical: normalized,
    relationStrength: source === 'canonical_skill' ? 'direct' : undefined,
    evidenceRef,
  };
}

function addTextSignals(
  values: Array<string | null>,
  source: SkillSignal['source'],
  evidenceRef: PublicSafeEvidenceRef
): SkillSignal[] {
  return values
    .map((value) => (value ? makeSignal(value, source, evidenceRef) : null))
    .filter((signal): signal is SkillSignal => Boolean(signal));
}

function collectAssignmentSkills(assignment: UnknownRecord): SkillSignal[] {
  const rawSkills = [
    ...asStringArray(assignment.skills),
    ...asStringArray(assignment.skillIds),
    ...asStringArray(assignment.skillCodes),
    ...asStringArray(assignment.requiredSkills),
    ...asStringArray(assignment.niceSkills),
    ...asStringArray(assignment.customSkills),
  ];

  for (const key of ['mustHaveSkills', 'niceToHaveSkills']) {
    const value = assignment[key];
    if (Array.isArray(value)) {
      for (const entry of value) {
        const label = readSkillLabel(entry);
        if (label) rawSkills.push(label);
      }
    }
  }

  return rawSkills
    .map((skill) =>
      makeSignal(skill, 'canonical_skill', {
        type: 'assignment_field',
        id: asString(assignment.id),
        field: 'skills',
        label: skill,
      })
    )
    .filter((signal): signal is SkillSignal => Boolean(signal));
}

export function extractAssignmentSignals(assignment: unknown): AssignmentMatchSignals {
  const source = isRecord(assignment) ? assignment : {};
  const assignmentId = asString(source.id);
  const textFields = addTextSignals(
    [
      asString(source.role),
      asString(source.title),
      asString(source.description),
      asString(source.businessValue),
      asString(source.expectedImpact),
      asString(source.rolePurpose),
      asString(source.outcome),
    ],
    'assignment_text',
    { type: 'assignment', id: assignmentId }
  );
  const proofExpectationSignals = addTextSignals(
    [
      asString(source.proofExpectations),
      asString(source.proofExpectation),
      asString(source.verificationExpectations),
      asString(source.evidenceExpectation),
    ],
    'proof_expectation',
    { type: 'assignment_field', id: assignmentId, field: 'proof_expectations' }
  );
  const outcomeSignals = addTextSignals(
    [asString(source.expectedImpact), asString(source.businessValue), asString(source.outcome)],
    'assignment_text',
    { type: 'assignment_field', id: assignmentId, field: 'outcome' }
  );
  const customSignals = addTextSignals(
    [...asStringArray(source.customWording), asString(source.customWording)],
    'custom_wording',
    { type: 'assignment_field', id: assignmentId, field: 'custom_wording' }
  );

  return {
    assignmentId,
    canonicalSkills: collectAssignmentSkills(source),
    textSignals: textFields,
    proofExpectationSignals,
    outcomeSignals,
    customSignals,
    hardConstraints: isRecord(source.hardConstraints) ? source.hardConstraints : {},
  };
}

function collectCandidateSkills(candidate: UnknownRecord): SkillSignal[] {
  const rawSkills = [
    ...asStringArray(candidate.skills),
    ...asStringArray(candidate.skillIds),
    ...asStringArray(candidate.skillCodes),
    ...asStringArray(candidate.customSkills),
  ];

  const skills = candidate.skills;
  if (Array.isArray(skills)) {
    for (const entry of skills) {
      const label = readSkillLabel(entry);
      if (label) rawSkills.push(label);
    }
  } else if (isRecord(skills)) {
    rawSkills.push(...Object.keys(skills));
  }

  return [...new Set(rawSkills)]
    .map((skill) =>
      makeSignal(skill, 'canonical_skill', {
        type: 'candidate_skill',
        id: asString(candidate.profileId) ?? asString(candidate.id),
        label: skill,
      })
    )
    .filter((signal): signal is SkillSignal => Boolean(signal));
}

function collectProofSignals(candidate: UnknownRecord): CandidateProofSignal[] {
  const rawProofs = Array.isArray(candidate.proofPacks) ? candidate.proofPacks : [];
  return rawProofs.filter(isRecord).map((proof) => ({
    id: asString(proof.id),
    title: asString(proof.title),
    claim: asString(proof.claim) ?? asString(proof.primaryClaim),
    summary: asString(proof.summary),
    outcome: asString(proof.outcome) ?? asString(proof.outcomesSummary),
    ownership: asString(proof.ownership) ?? asString(proof.ownershipStatement),
    freshnessState: asString(proof.freshnessState),
    verificationStatus: asString(proof.verificationStatus),
    hasActiveNonSelfTrustAnchor:
      typeof proof.hasActiveNonSelfTrustAnchor === 'boolean'
        ? proof.hasActiveNonSelfTrustAnchor
        : null,
    hasPrimaryAnchor:
      typeof proof.hasPrimaryAnchor === 'boolean' ? proof.hasPrimaryAnchor : undefined,
    linkedSkillIds: asStringArray(proof.linkedSkillIds),
    visibility: asString(proof.visibility),
    revealGate: asString(proof.revealGate),
  }));
}

export function extractCandidateSignals(candidate: unknown): CandidateMatchSignals {
  const source = isRecord(candidate) ? candidate : {};
  const profileId = asString(source.profileId) ?? asString(source.id) ?? 'unknown-profile';
  const proofSignals = collectProofSignals(source);
  const proofTextSignals = proofSignals.flatMap((proof) =>
    addTextSignals(
      [proof.title ?? null, proof.claim ?? null, proof.summary ?? null, proof.outcome ?? null],
      'proof_text',
      { type: 'proof_pack', id: proof.id, label: proof.title ?? proof.claim ?? 'Proof Pack' }
    )
  );
  const customSignals = addTextSignals(
    [...asStringArray(source.customWording), asString(source.customWording)],
    'custom_wording',
    { type: 'candidate_skill', id: profileId, field: 'custom_wording' }
  );
  const readiness = isRecord(source.readiness) ? source.readiness : {};
  const trustSignals = isRecord(source.trustSignals) ? source.trustSignals : {};
  const constraints = isRecord(source.constraints) ? source.constraints : {};
  const privacy = isRecord(source.privacy) ? source.privacy : {};

  return {
    profileId,
    canonicalSkills: collectCandidateSkills(source),
    proofSignals,
    proofTextSignals,
    customSignals,
    trustSignals: {
      activeNonSelfTrustAnchorCount:
        typeof trustSignals.activeNonSelfTrustAnchorCount === 'number'
          ? trustSignals.activeNonSelfTrustAnchorCount
          : proofSignals.filter((proof) => proof.hasActiveNonSelfTrustAnchor).length,
      hasFreshRoleRelevantProof:
        typeof trustSignals.hasFreshRoleRelevantProof === 'boolean'
          ? trustSignals.hasFreshRoleRelevantProof
          : proofSignals.some((proof) => proof.freshnessState === 'fresh'),
      hasUnsupportedSkillClaims:
        typeof trustSignals.hasUnsupportedSkillClaims === 'boolean'
          ? trustSignals.hasUnsupportedSkillClaims
          : false,
      orphanRelevantProofCount:
        typeof trustSignals.orphanRelevantProofCount === 'number'
          ? trustSignals.orphanRelevantProofCount
          : proofSignals.filter((proof) => proof.hasPrimaryAnchor === false).length,
    },
    readiness: {
      discoverable:
        typeof readiness.discoverable === 'boolean' ? readiness.discoverable : undefined,
      matchVisible:
        typeof readiness.matchVisible === 'boolean' ? readiness.matchVisible : undefined,
      introEligible:
        typeof readiness.introEligible === 'boolean' ? readiness.introEligible : undefined,
    },
    constraints: {
      hardConstraintsSatisfied:
        typeof constraints.hardConstraintsSatisfied === 'boolean'
          ? constraints.hardConstraintsSatisfied
          : null,
      constraintMismatchCodes: asStringArray(constraints.constraintMismatchCodes),
    },
    privacy: {
      privacySafeForStage:
        typeof privacy.privacySafeForStage === 'boolean' ? privacy.privacySafeForStage : true,
      policyHold: Boolean(privacy.policyHold),
      moderationHold: Boolean(privacy.moderationHold),
      redactionHold: Boolean(privacy.redactionHold),
    },
  };
}

export function expandSkillSignals(signals: SkillSignal[]): SkillSignal[] {
  return expandSignals(signals);
}

function lowSupplyActive(input?: LowSupplyPolicyInput): boolean {
  if (!input) return false;
  if (input.activeFallbackMode === 'browse_only_low_candidate_supply') return true;
  const threshold = input.introReadyThreshold ?? 3;
  return input.introReadyCount < threshold;
}

function pushSignal(
  signals: Set<DiscoverySignal>,
  signal: DiscoverySignal,
  refs: PublicSafeEvidenceRef[],
  ref?: PublicSafeEvidenceRef
) {
  signals.add(signal);
  if (ref) refs.push(ref);
}

function joinSignalText(signals: SkillSignal[]) {
  return signals
    .map((signal) => signal.raw || signal.normalized)
    .filter(Boolean)
    .join(' ');
}

function weakerRelation(
  left: SkillSignal['relationStrength'],
  right: SkillSignal['relationStrength']
): SkillSignal['relationStrength'] {
  const order: Record<NonNullable<SkillSignal['relationStrength']>, number> = {
    direct: 5,
    alias: 4,
    near: 3,
    moderate: 2,
    weak: 1,
  };
  if (!left) return right;
  if (!right) return left;
  return order[left] <= order[right] ? left : right;
}

export function discoverPossibleMatches(input: DiscoveryInput): DiscoveredCandidate[] {
  const assignmentSignals = extractAssignmentSignals(input.assignment);
  const assignmentExpanded = expandSignals([
    ...assignmentSignals.canonicalSkills,
    ...assignmentSignals.customSignals,
  ]);
  const assignmentText = joinSignalText([
    ...assignmentSignals.textSignals,
    ...assignmentSignals.proofExpectationSignals,
    ...assignmentSignals.outcomeSignals,
    ...assignmentSignals.customSignals,
  ]);
  const supplyIsLow = lowSupplyActive(input.lowSupply);

  const discovered = input.candidates
    .map(extractCandidateSignals)
    .map((candidateSignals): DiscoveredCandidate | null => {
      const candidateExpanded = expandSignals([
        ...candidateSignals.canonicalSkills,
        ...candidateSignals.customSignals,
      ]);
      const discoverySignals = new Set<DiscoverySignal>();
      const matchedPhrases = new Set<string>();
      const evidenceRefs: PublicSafeEvidenceRef[] = [];
      let internalOrder = 0;

      for (const assignmentSignal of assignmentExpanded) {
        for (const candidateSignal of candidateExpanded) {
          const samePhrase = assignmentSignal.normalized === candidateSignal.normalized;
          const sameCanonical =
            assignmentSignal.canonical &&
            candidateSignal.canonical &&
            assignmentSignal.canonical === candidateSignal.canonical;

          const directCanonicalOverlap =
            samePhrase &&
            assignmentSignal.relationStrength === 'direct' &&
            candidateSignal.relationStrength === 'direct';

          if (directCanonicalOverlap) {
            pushSignal(
              discoverySignals,
              'canonical_skill_overlap',
              evidenceRefs,
              candidateSignal.evidenceRef
            );
            internalOrder += relationWeight('direct');
            matchedPhrases.add(candidateSignal.raw || candidateSignal.normalized);
          } else if (samePhrase || sameCanonical) {
            const relation = weakerRelation(
              assignmentSignal.relationStrength,
              candidateSignal.relationStrength
            );
            if (relation === 'alias') {
              pushSignal(
                discoverySignals,
                'alias_skill_overlap',
                evidenceRefs,
                candidateSignal.evidenceRef
              );
            } else {
              pushSignal(
                discoverySignals,
                'adjacent_skill_overlap',
                evidenceRefs,
                candidateSignal.evidenceRef
              );
            }
            internalOrder += relationWeight(relation);
            matchedPhrases.add(candidateSignal.raw || candidateSignal.normalized);
          }
        }
      }

      const proofText = joinSignalText(candidateSignals.proofTextSignals);
      if (hasMeaningfulTokenOverlap(assignmentText, proofText, 2)) {
        const overlap = tokenOverlap(assignmentText, proofText).overlap;
        pushSignal(
          discoverySignals,
          'proof_text_overlap',
          evidenceRefs,
          candidateSignals.proofTextSignals[0]?.evidenceRef
        );
        internalOrder += 18 + overlap.length * 3;
        for (const phrase of overlap) matchedPhrases.add(phrase);
      }

      const assignmentOutcomeText = joinSignalText(assignmentSignals.outcomeSignals);
      const proofOutcomeText = candidateSignals.proofSignals
        .map((proof) => proof.outcome)
        .filter(Boolean)
        .join(' ');
      if (hasMeaningfulTokenOverlap(assignmentOutcomeText, proofOutcomeText, 2)) {
        pushSignal(
          discoverySignals,
          'role_relevant_outcome',
          evidenceRefs,
          candidateSignals.proofTextSignals[0]?.evidenceRef
        );
        internalOrder += 28;
      }

      const proofExpectationText = joinSignalText(assignmentSignals.proofExpectationSignals);
      if (hasMeaningfulTokenOverlap(proofExpectationText, proofText, 2)) {
        pushSignal(
          discoverySignals,
          'proof_expectation_overlap',
          evidenceRefs,
          candidateSignals.proofTextSignals[0]?.evidenceRef
        );
        internalOrder += 18;
      }

      const customCandidateText = joinSignalText(candidateSignals.customSignals);
      if (hasMeaningfulTokenOverlap(assignmentText, customCandidateText, 2)) {
        pushSignal(
          discoverySignals,
          'custom_wording_overlap',
          evidenceRefs,
          candidateSignals.customSignals[0]?.evidenceRef
        );
        internalOrder += 12;
      }

      const broadOnly =
        !discoverySignals.has('canonical_skill_overlap') &&
        !discoverySignals.has('alias_skill_overlap') &&
        discoverySignals.size > 0;
      const lowSupplyExpanded = supplyIsLow && broadOnly;
      if (lowSupplyExpanded) {
        pushSignal(discoverySignals, 'low_supply_expanded_discovery', evidenceRefs, {
          type: 'assignment',
          id: assignmentSignals.assignmentId,
          field: 'low_supply_policy',
        });
        internalOrder += 1;
      }

      if (discoverySignals.size === 0) return null;

      return {
        profileId: candidateSignals.profileId,
        discoverySignals: [...discoverySignals],
        matchedPhrases: [...matchedPhrases].sort(),
        evidenceRefs,
        assignmentSignals,
        candidateSignals,
        lowSupplyExpanded,
        internalOrder,
      };
    })
    .filter((candidate): candidate is DiscoveredCandidate => Boolean(candidate));

  return discovered.sort((left, right) => {
    const order = right.internalOrder - left.internalOrder;
    if (order !== 0) return order;
    return left.profileId.localeCompare(right.profileId);
  });
}
