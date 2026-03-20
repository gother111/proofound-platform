import { z } from 'zod';

export const MAX_SKILLS_PER_ATTESTATION = 3;

export const ATTESTATION_REQUEST_KINDS = [
  'generic_verification',
  'human_observed_attestation',
] as const;
export type AttestationRequestKind = (typeof ATTESTATION_REQUEST_KINDS)[number];

export const HUMAN_OBSERVED_CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type HumanObservedConfidenceLevel = (typeof HUMAN_OBSERVED_CONFIDENCE_LEVELS)[number];
export const HUMAN_OBSERVED_VERDICTS = ['yes', 'partly', 'no'] as const;
export type HumanObservedVerdict = (typeof HUMAN_OBSERVED_VERDICTS)[number];

export const HUMAN_OBSERVED_SKILL_FAMILIES = [
  'communication',
  'collaboration',
  'leadership',
  'conflict_resolution',
  'adaptability',
  'reliability',
  'professional_judgment',
  'language_ability',
] as const;
export type HumanObservedSkillFamily = (typeof HUMAN_OBSERVED_SKILL_FAMILIES)[number];

export type AttestationSkillInput = {
  id: string;
  label: string;
  skillCode?: string | null;
  skillId?: string | null;
};

export type HumanObservedAttestationRequestPayload = {
  requestKind: 'human_observed_attestation';
  skillIds: string[];
  skillLabels: string[];
  skillFamilies: HumanObservedSkillFamily[];
};

export type HumanObservedAttestationResponsePayload = {
  verdict: HumanObservedVerdict;
  relationshipToSubject: string;
  workedTogetherWhere: string;
  observationDuration: string;
  observationRecency: string;
  skillIds: string[];
  skillLabels: string[];
  observedBehaviorNote: string;
  confidenceLevel: HumanObservedConfidenceLevel;
  conflictBiasDisclosure: string | null;
};

const SkillIdSchema = z.string().uuid();
const ObservedBehaviorNoteSchema = z.string().trim().min(20).max(560);

const GENERIC_PRAISE_PATTERNS = [
  /\b(great|excellent|amazing|strong|good|fantastic)\b/i,
  /\b(team player|hard worker|rockstar|superstar)\b/i,
  /\b(highly recommend|would recommend)\b/i,
];

function looksLikeGenericPraise(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (
    normalized.length < 40 &&
    GENERIC_PRAISE_PATTERNS.some((pattern) => pattern.test(normalized))
  ) {
    return true;
  }

  return false;
}

export const HumanObservedAttestationResponseSchema = z
  .object({
    verdict: z.enum(HUMAN_OBSERVED_VERDICTS),
    relationshipToSubject: z.string().trim().min(2).max(120),
    workedTogetherWhere: z.string().trim().min(5).max(400),
    observationDuration: z.string().trim().min(2).max(120),
    observationRecency: z.string().trim().min(4).max(80),
    skillIds: z.array(SkillIdSchema).min(1).max(MAX_SKILLS_PER_ATTESTATION),
    observedBehaviorNote: ObservedBehaviorNoteSchema,
    confidenceLevel: z.enum(HUMAN_OBSERVED_CONFIDENCE_LEVELS),
    conflictBiasDisclosure: z
      .string()
      .trim()
      .max(400)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
  })
  .superRefine((value, ctx) => {
    if (looksLikeGenericPraise(value.observedBehaviorNote)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['observedBehaviorNote'],
        message: 'Use a concrete observed behavior or scoped note, not generic praise.',
      });
    }
  });

function normalizeToken(value: string | null | undefined) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasUniversalPrefix(code: string) {
  return code.startsWith('u-');
}

function includesLanguageProficiency(code: string, label: string) {
  return code.includes('language-proficiency') || label.includes('language proficiency');
}

export function classifyHumanObservedSkill(
  input: Pick<AttestationSkillInput, 'label' | 'skillCode' | 'skillId'>
): HumanObservedSkillFamily | null {
  const normalizedLabel = normalizeToken(input.label);
  const normalizedCode = normalizeToken(input.skillCode);
  const normalizedSkillId = normalizeToken(input.skillId);
  const rawCodeOrId = (input.skillCode || input.skillId || '').toLowerCase();
  const normalizedCodeOrId = normalizedCode || normalizedSkillId;
  const universalScoped = !rawCodeOrId || hasUniversalPrefix(rawCodeOrId);

  if (includesLanguageProficiency(normalizedCodeOrId, normalizedLabel)) {
    return 'language_ability';
  }

  if (!universalScoped) {
    return null;
  }

  if (normalizedLabel.includes('conflict resolution') || normalizedLabel.includes('mediation')) {
    return 'conflict_resolution';
  }

  if (normalizedLabel.includes('professional judgment') || normalizedLabel === 'judgment') {
    return 'professional_judgment';
  }

  if (normalizedLabel.includes('communication')) {
    return 'communication';
  }

  if (normalizedLabel.includes('collaboration')) {
    return 'collaboration';
  }

  if (normalizedLabel.includes('leadership')) {
    return 'leadership';
  }

  if (normalizedLabel.includes('adaptability')) {
    return 'adaptability';
  }

  if (normalizedLabel.includes('reliability') || normalizedLabel.includes('punctuality')) {
    return 'reliability';
  }

  if (normalizedLabel.includes('judgment')) {
    return 'professional_judgment';
  }

  return null;
}

export function isEligibleHumanObservedAttestationSkill(input: AttestationSkillInput) {
  return classifyHumanObservedSkill(input) !== null;
}

export function deriveAttestationRequestMode(args: {
  skills: AttestationSkillInput[];
  totalArtifacts: number;
}):
  | {
      requestKind: 'generic_verification';
      requestPayload: null;
    }
  | {
      requestKind: 'human_observed_attestation';
      requestPayload: HumanObservedAttestationRequestPayload;
    }
  | {
      requestKind: 'generic_verification';
      requestPayload: null;
      error: string;
    } {
  const eligibleSkills = args.skills
    .map((skill) => ({
      skill,
      family: classifyHumanObservedSkill(skill),
    }))
    .filter((entry): entry is { skill: AttestationSkillInput; family: HumanObservedSkillFamily } =>
      Boolean(entry.family)
    );

  if (eligibleSkills.length === 0) {
    return { requestKind: 'generic_verification', requestPayload: null };
  }

  if (args.totalArtifacts !== args.skills.length) {
    return {
      requestKind: 'generic_verification',
      requestPayload: null,
      error:
        'Human-observed attestation requests can only cover eligible interpersonal skills, not mixed artifacts.',
    };
  }

  if (eligibleSkills.length !== args.skills.length) {
    return {
      requestKind: 'generic_verification',
      requestPayload: null,
      error:
        'Human-observed attestation requests can only cover the supported interpersonal skill set.',
    };
  }

  if (eligibleSkills.length > MAX_SKILLS_PER_ATTESTATION) {
    return {
      requestKind: 'generic_verification',
      requestPayload: null,
      error: `Human-observed attestation requests are limited to ${MAX_SKILLS_PER_ATTESTATION} skills.`,
    };
  }

  return {
    requestKind: 'human_observed_attestation',
    requestPayload: {
      requestKind: 'human_observed_attestation',
      skillIds: eligibleSkills.map((entry) => entry.skill.id),
      skillLabels: eligibleSkills.map((entry) => entry.skill.label),
      skillFamilies: eligibleSkills.map((entry) => entry.family),
    },
  };
}

export function parseHumanObservedAttestationResponse(
  input: unknown,
  requestPayload: HumanObservedAttestationRequestPayload
) {
  const parsed = HumanObservedAttestationResponseSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }

  const expectedIds = [...requestPayload.skillIds].sort();
  const receivedIds = [...parsed.data.skillIds].sort();

  if (expectedIds.length !== receivedIds.length) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: 'custom',
          message: `Attestations must cover exactly ${expectedIds.length} requested skill(s).`,
          path: ['skillIds'],
        },
      ]),
    };
  }

  for (let index = 0; index < expectedIds.length; index += 1) {
    if (expectedIds[index] !== receivedIds[index]) {
      return {
        success: false as const,
        error: new z.ZodError([
          {
            code: 'custom',
            message: 'Attested skills must match the requested interpersonal skills.',
            path: ['skillIds'],
          },
        ]),
      };
    }
  }

  return {
    success: true as const,
    data: {
      ...parsed.data,
      skillLabels: requestPayload.skillLabels,
    } satisfies HumanObservedAttestationResponsePayload,
  };
}

export function isStructuredHumanObservedAttestationEligible(args: {
  requestKind: string | null | undefined;
  integrityStatus: string | null | undefined;
  status: string | null | undefined;
  attestationResponse: unknown;
}) {
  if (
    args.requestKind !== 'human_observed_attestation' ||
    args.integrityStatus !== 'clear' ||
    !['accepted', 'verified'].includes(args.status || '')
  ) {
    return false;
  }

  const parsed = HumanObservedAttestationResponseSchema.safeParse(args.attestationResponse);
  return parsed.success && parsed.data.verdict === 'yes';
}

export function applySkillVerificationTrustLift(args: {
  currentStrength: number;
  requestKind: string | null | undefined;
  integrityStatus: string | null | undefined;
  status: string | null | undefined;
  attestationResponse: unknown;
}) {
  if (args.integrityStatus !== 'clear' || !['accepted', 'verified'].includes(args.status || '')) {
    return args.currentStrength;
  }

  const increment =
    args.requestKind === 'human_observed_attestation'
      ? isStructuredHumanObservedAttestationEligible(args)
        ? 0.1
        : 0
      : 0.2;
  return Math.min(args.currentStrength + increment, 1);
}
