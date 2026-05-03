import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { assignmentOutcomes, assignments, skillsTaxonomy } from '@/db/schema';
import { generateJson } from '@/lib/ai/provider';
import { AiProviderError } from '@/lib/ai/provider/types';
import {
  buildAiSuggestionCacheKey,
  findAiSuggestionReplay,
  hashAiContent,
  recordAiSuggestionEvent,
} from '@/lib/ai/usage-ledger';
import { verifyExplicitAssignmentMutationAccess } from '@/lib/assignments/access';
import { skillDisplayLabel } from '@/lib/copy/labels';

export const ASSIGNMENT_CLARITY_FEATURE = 'assignment_clarity';
export const ASSIGNMENT_CLARITY_PROMPT_VERSION = 'ai-assignment-clarity-v1';

const REDACTION_PATTERNS = [
  {
    key: 'emails',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[redacted email]',
  },
  {
    key: 'urls',
    pattern: /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi,
    replacement: '[redacted link]',
  },
  {
    key: 'filenames',
    pattern: /\b[^\s/\\]+\.(?:pdf|png|jpe?g|heic|heif|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z)\b/gi,
    replacement: '[redacted file]',
  },
  {
    key: 'tokens',
    pattern:
      /\b(?:[A-Za-z]{2,}_[A-Za-z0-9_-]{16,}|[A-Za-z0-9_-]{28,}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/gi,
    replacement: '[redacted token]',
  },
  {
    key: 'phones',
    pattern: /(?:\+?\d[\d\s().-]{7,}\d)/g,
    replacement: '[redacted phone]',
  },
] as const;

const SCORING_OR_JUDGMENT_PATTERN =
  /\b(?:score|scoring|rubric|rank|ranking|top\s+candidate|best\s+candidate|shortlist(?:ed|ing)?|fit\s+score|fit\s+verdict|hire\s+recommendation|hiring\s+recommendation|recommended\s+candidate)\b/i;

const PROTECTED_TRAIT_PATTERN =
  /\b(?:age|young|younger|older|gender|male|female|race|racial|ethnicity|ethnic|religion|religious|disability|disabled|pregnant|pregnancy|marital|parenthood|native\s+speaker|nationality|citizenship|visa|sexual\s+orientation|transgender)\b/i;

const GENERIC_LANGUAGE_PATTERN =
  /\b(?:make an impact|fast[-\s]?paced|wear many hats|self[-\s]?starter|rockstar|ninja|world[-\s]?class|passionate|go[-\s]?getter|excellent communication|team player|dynamic environment)\b/i;

const EngagementTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contract_consulting',
  'fractional_project',
]);

const SkillInputSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    code: z.string().trim().max(120).optional(),
    label: z.string().trim().max(160).optional(),
    name: z.string().trim().max(160).optional(),
    skillName: z.string().trim().max(160).optional(),
    level: z.number().min(0).max(5).optional(),
  })
  .strict();

const ConstraintsInputSchema = z
  .object({
    locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
    city: z.string().trim().max(120).optional(),
    country: z.string().trim().max(120).optional(),
    compMin: z.number().optional(),
    compMax: z.number().optional(),
    currency: z.string().trim().max(12).optional(),
    hoursMin: z.number().optional(),
    hoursMax: z.number().optional(),
    startEarliest: z.string().trim().max(40).optional(),
    startLatest: z.string().trim().max(40).optional(),
  })
  .partial()
  .strict();

export const AssignmentClarityRequestSchema = z
  .object({
    assignmentId: z.string().uuid(),
    orgId: z.string().uuid().optional(),
    orgSlug: z.string().trim().max(160).optional(),
    title: z.string().trim().max(240).optional(),
    outcomeSummary: z.string().trim().max(2400).optional(),
    constraints: z.union([z.string().trim().max(1800), ConstraintsInputSchema]).optional(),
    mustHaveSkills: z.array(SkillInputSchema).max(20).optional(),
    capabilities: z.array(SkillInputSchema).max(20).optional(),
    proofExpectations: z.string().trim().max(2400).optional(),
    engagementType: EngagementTypeSchema.optional(),
    verificationRequirements: z.array(z.string().trim().max(120)).max(12).optional(),
  })
  .strict();

export const AssignmentClarityConstraintsRewriteSchema = z.object({
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  country: z.string().trim().max(120).nullable().optional(),
  hoursMin: z.number().nullable().optional(),
  hoursMax: z.number().nullable().optional(),
  compensationSummary: z.string().trim().max(220).nullable().optional(),
  startWindow: z.string().trim().max(180).nullable().optional(),
});

export const AssignmentClarityRewriteSchema = z.object({
  title: z.string().trim().max(220).nullable().optional(),
  rolePurpose: z.string().trim().max(700).nullable().optional(),
  outcomeSummary: z.string().trim().max(1200).nullable().optional(),
  constraints: AssignmentClarityConstraintsRewriteSchema.nullable().optional(),
  capabilityExpectations: z.array(z.string().trim().max(180)).max(10).nullable().optional(),
  proofExpectations: z.string().trim().max(1200).nullable().optional(),
  verificationRequirements: z.array(z.string().trim().max(160)).max(10).nullable().optional(),
});

export const AssignmentClarityResponseSchema = z.object({
  ambiguityFlags: z.array(z.string().trim().max(260)).max(12).default([]),
  suggestedRewrite: AssignmentClarityRewriteSchema.default({}),
  reviewQuestions: z.array(z.string().trim().max(260)).max(12).default([]),
  excludedOrRiskyCriteria: z.array(z.string().trim().max(260)).max(12).default([]),
});

const ASSIGNMENT_CLARITY_STRING_ARRAY_JSON_SCHEMA = {
  type: 'array',
  items: { type: 'string', maxLength: 260 },
  maxItems: 12,
} as const;

const ASSIGNMENT_CLARITY_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    ambiguityFlags: ASSIGNMENT_CLARITY_STRING_ARRAY_JSON_SCHEMA,
    suggestedRewrite: {
      type: 'object',
      properties: {
        title: { type: 'string', maxLength: 220 },
        rolePurpose: { type: 'string', maxLength: 700 },
        outcomeSummary: { type: 'string', maxLength: 1200 },
        constraints: {
          type: 'object',
          properties: {
            locationMode: { type: 'string', enum: ['remote', 'onsite', 'hybrid'] },
            city: { type: 'string', maxLength: 120 },
            country: { type: 'string', maxLength: 120 },
            hoursMin: { type: 'number' },
            hoursMax: { type: 'number' },
            compensationSummary: { type: 'string', maxLength: 220 },
            startWindow: { type: 'string', maxLength: 180 },
          },
        },
        capabilityExpectations: {
          type: 'array',
          items: { type: 'string', maxLength: 180 },
          maxItems: 10,
        },
        proofExpectations: { type: 'string', maxLength: 1200 },
        verificationRequirements: {
          type: 'array',
          items: { type: 'string', maxLength: 160 },
          maxItems: 10,
        },
      },
    },
    reviewQuestions: ASSIGNMENT_CLARITY_STRING_ARRAY_JSON_SCHEMA,
    excludedOrRiskyCriteria: ASSIGNMENT_CLARITY_STRING_ARRAY_JSON_SCHEMA,
  },
  required: ['ambiguityFlags', 'suggestedRewrite', 'reviewQuestions', 'excludedOrRiskyCriteria'],
} as const;

export type AssignmentClarityRequest = z.infer<typeof AssignmentClarityRequestSchema>;
export type AssignmentClarityResponse = z.infer<typeof AssignmentClarityResponseSchema>;
type SkillInput = z.infer<typeof SkillInputSchema>;
type ConstraintsInput = z.infer<typeof ConstraintsInputSchema>;

type RedactionResult = {
  value: string;
  counts: Record<string, number>;
};

type SanitizedAssignmentContext = {
  promptVersion: typeof ASSIGNMENT_CLARITY_PROMPT_VERSION;
  assignmentId: string;
  orgId: string;
  status: string | null;
  selectedFields: {
    title: string | null;
    rolePurpose: string | null;
    outcomeSummary: string | null;
    constraints: z.infer<typeof ConstraintsInputSchema> | { summary: string } | null;
    capabilityExpectations: string[];
    proofExpectations: string | null;
    engagementType: z.infer<typeof EngagementTypeSchema> | null;
    verificationRequirements: string[];
  };
  redactionSummary: Record<string, number>;
};

function mergeCounts(target: Record<string, number>, source: Record<string, number>) {
  for (const [key, count] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + count;
  }
}

export function redactAssignmentClarityText(value: string | null | undefined): RedactionResult {
  let next = typeof value === 'string' ? value : '';
  next = next.replace(/<[^>]*>/g, ' ');
  const counts: Record<string, number> = {};

  for (const entry of REDACTION_PATTERNS) {
    let count = 0;
    next = next.replace(entry.pattern, () => {
      count += 1;
      return entry.replacement;
    });
    if (count > 0) {
      counts[entry.key] = count;
    }
  }

  return {
    value: next.replace(/\s+/g, ' ').trim().slice(0, 1800),
    counts,
  };
}

function redactedNullable(value: string | null | undefined, counts: Record<string, number>) {
  const redacted = redactAssignmentClarityText(value);
  mergeCounts(counts, redacted.counts);
  return redacted.value.length > 0 ? redacted.value : null;
}

function extractSkillCode(skill: unknown): string | null {
  if (!skill || typeof skill !== 'object') return null;
  const record = skill as Record<string, unknown>;
  const value = record.id ?? record.code;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function safeSkillLabel(skill: z.infer<typeof SkillInputSchema>, counts: Record<string, number>) {
  return redactedNullable(
    skill.label || skill.name || skill.skillName || skill.id || skill.code,
    counts
  );
}

async function resolveCapabilityLabels(
  skillsInput: SkillInput[],
  assignmentSkills: unknown,
  counts: Record<string, number>
) {
  const requestSkills = skillsInput;
  const storedSkills: SkillInput[] = Array.isArray(assignmentSkills)
    ? assignmentSkills
        .map((skill): SkillInput | null => {
          if (!skill || typeof skill !== 'object') return null;
          const record = skill as Record<string, unknown>;
          return {
            id: extractSkillCode(skill) ?? undefined,
            label: typeof record.label === 'string' ? record.label : undefined,
            level: typeof record.level === 'number' ? record.level : undefined,
          };
        })
        .filter((skill): skill is SkillInput => Boolean(skill))
    : [];

  const allSkills = requestSkills.length > 0 ? requestSkills : storedSkills;
  const codes = Array.from(
    new Set(
      allSkills
        .map((skill) => skill.id || skill.code)
        .filter((code): code is string => Boolean(code))
    )
  );
  const labelsByCode = new Map<string, string>();

  if (codes.length > 0) {
    const taxonomyRows = await db
      .select({
        code: skillsTaxonomy.code,
        nameI18n: skillsTaxonomy.nameI18n,
      })
      .from(skillsTaxonomy)
      .where(inArray(skillsTaxonomy.code, codes));

    for (const row of taxonomyRows) {
      const taxonomyName =
        row.nameI18n &&
        typeof row.nameI18n === 'object' &&
        !Array.isArray(row.nameI18n) &&
        typeof (row.nameI18n as Record<string, unknown>).en === 'string'
          ? ((row.nameI18n as Record<string, string>).en ?? null)
          : null;
      labelsByCode.set(row.code, skillDisplayLabel({ code: row.code, taxonomyName }));
    }
  }

  return allSkills
    .map((skill) => {
      const code = skill.id || skill.code;
      const label = code ? labelsByCode.get(code) : null;
      const fallback = safeSkillLabel(skill, counts);
      const value = label || fallback;
      return value
        ? `${value}${typeof skill.level === 'number' ? `, level ${skill.level}` : ''}`
        : null;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 20);
}

function sanitizeConstraints(
  constraints: AssignmentClarityRequest['constraints'],
  assignment: typeof assignments.$inferSelect,
  counts: Record<string, number>
): SanitizedAssignmentContext['selectedFields']['constraints'] {
  if (typeof constraints === 'string') {
    const summary = redactedNullable(constraints, counts);
    return summary ? { summary } : null;
  }

  const assignmentLocationMode =
    assignment.locationMode === 'remote' ||
    assignment.locationMode === 'onsite' ||
    assignment.locationMode === 'hybrid'
      ? assignment.locationMode
      : undefined;
  const source: ConstraintsInput = constraints ?? {
    locationMode: assignmentLocationMode,
    city: assignment.city ?? undefined,
    country: assignment.country ?? undefined,
    compMin: assignment.compMin ?? undefined,
    compMax: assignment.compMax ?? undefined,
    currency: assignment.currency ?? undefined,
    hoursMin: assignment.hoursMin ?? undefined,
    hoursMax: assignment.hoursMax ?? undefined,
    startEarliest:
      typeof assignment.startEarliest === 'string' ? assignment.startEarliest : undefined,
    startLatest: typeof assignment.startLatest === 'string' ? assignment.startLatest : undefined,
  };

  return {
    ...source,
    city: redactedNullable(source.city, counts) ?? undefined,
    country: redactedNullable(source.country, counts) ?? undefined,
    currency: redactedNullable(source.currency, counts) ?? undefined,
    startEarliest: redactedNullable(source.startEarliest, counts) ?? undefined,
    startLatest: redactedNullable(source.startLatest, counts) ?? undefined,
  };
}

async function buildSanitizedAssignmentContext(
  input: AssignmentClarityRequest,
  orgId: string
): Promise<SanitizedAssignmentContext> {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, input.assignmentId),
  });
  if (!assignment || assignment.orgId !== orgId) {
    throw new Error('ASSIGNMENT_NOT_FOUND');
  }

  const outcomeRows = await db.query.assignmentOutcomes.findMany({
    where: eq(assignmentOutcomes.assignmentId, input.assignmentId),
    columns: { title: true, description: true, metrics: true },
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  const redactionSummary: Record<string, number> = {};
  const outcomeSummary =
    redactedNullable(input.outcomeSummary, redactionSummary) ??
    (outcomeRows.length > 0
      ? outcomeRows
          .map((outcome) => {
            const firstMetric = Array.isArray(outcome.metrics) ? outcome.metrics[0] : null;
            return [outcome.title, outcome.description, firstMetric?.target]
              .filter(Boolean)
              .join(' - ');
          })
          .map((value) => redactedNullable(value, redactionSummary))
          .filter(Boolean)
          .join(' | ')
      : redactedNullable(assignment.description, redactionSummary));

  return {
    promptVersion: ASSIGNMENT_CLARITY_PROMPT_VERSION,
    assignmentId: input.assignmentId,
    orgId,
    status: assignment.status ?? null,
    selectedFields: {
      title:
        redactedNullable(input.title, redactionSummary) ??
        redactedNullable(assignment.role, redactionSummary),
      rolePurpose: redactedNullable(assignment.businessValue, redactionSummary),
      outcomeSummary: outcomeSummary || null,
      constraints: sanitizeConstraints(input.constraints, assignment, redactionSummary),
      capabilityExpectations: await resolveCapabilityLabels(
        [...(input.mustHaveSkills ?? []), ...(input.capabilities ?? [])],
        assignment.mustHaveSkills,
        redactionSummary
      ),
      proofExpectations:
        redactedNullable(input.proofExpectations, redactionSummary) ??
        redactedNullable(assignment.expectedImpact, redactionSummary),
      engagementType: input.engagementType ?? (assignment.engagementType as any) ?? null,
      verificationRequirements: (
        input.verificationRequirements ??
        assignment.verificationGates ??
        []
      )
        .map((value) => redactedNullable(value, redactionSummary))
        .filter((value): value is string => Boolean(value))
        .slice(0, 12),
    },
    redactionSummary,
  };
}

function buildPrompt(context: SanitizedAssignmentContext) {
  return [
    'You are Proofound Assignment Clarity Assistant.',
    `Prompt version: ${ASSIGNMENT_CLARITY_PROMPT_VERSION}.`,
    'You help organizations clarify assignments for proof-backed review.',
    'Use only the sanitized assignment JSON context.',
    'Do not write generic job-description copy.',
    'Do not add facts, protected-trait criteria, discriminatory criteria, or credential requirements that are not already present.',
    'Do not create candidate scoring rubrics, candidate ranking, candidate fit verdicts, hiring recommendations, shortlists, or review decisions.',
    'Do not refer to private candidates or candidate data.',
    'Focus on outcomes, constraints, must-have capabilities, proof expectations, verification requirements, and ambiguity.',
    'Return JSON only with keys: ambiguityFlags, suggestedRewrite, reviewQuestions, excludedOrRiskyCriteria.',
    '',
    'Sanitized context:',
    JSON.stringify(context, null, 2),
  ].join('\n');
}

function hasUsefulText(value: string | null | undefined) {
  return Boolean(value && value.trim().length >= 40 && !GENERIC_LANGUAGE_PATTERN.test(value));
}

function contextText(context: SanitizedAssignmentContext) {
  return [
    context.selectedFields.title,
    context.selectedFields.rolePurpose,
    context.selectedFields.outcomeSummary,
    context.selectedFields.proofExpectations,
    JSON.stringify(context.selectedFields.constraints),
    context.selectedFields.capabilityExpectations.join(' '),
    context.selectedFields.verificationRequirements.join(' '),
  ]
    .filter(Boolean)
    .join(' ');
}

function deterministicFallback(
  context: SanitizedAssignmentContext,
  warning: string | null = null
): AssignmentClarityResponse {
  const fields = context.selectedFields;
  const ambiguityFlags: string[] = [];
  const reviewQuestions: string[] = [];
  const excludedOrRiskyCriteria: string[] = [];
  const allText = contextText(context);

  if (!hasUsefulText(fields.outcomeSummary)) {
    ambiguityFlags.push('Outcome summary is vague or missing concrete deliverables.');
    reviewQuestions.push(
      'What concrete deliverable or operating result should exist in the first review window?'
    );
  }

  if (!hasUsefulText(fields.proofExpectations)) {
    ambiguityFlags.push('Proof expectations are missing or too generic.');
    reviewQuestions.push(
      'What work sample, shipped artifact, ownership evidence, or tradeoff explanation would count as credible proof?'
    );
  }

  if (fields.capabilityExpectations.length < 3) {
    ambiguityFlags.push('Must-have capabilities are underspecified.');
    reviewQuestions.push(
      'Which three must-have capabilities are genuinely necessary for this assignment?'
    );
  }

  if (!fields.constraints || Object.keys(fields.constraints).length === 0) {
    ambiguityFlags.push('Practical constraints are missing.');
    reviewQuestions.push(
      'Which location, compensation, hours, or timing constraints are real enough to publish?'
    );
  }

  if (SCORING_OR_JUDGMENT_PATTERN.test(allText)) {
    excludedOrRiskyCriteria.push('Removed prohibited review criteria from the assistant scope.');
  }

  if (PROTECTED_TRAIT_PATTERN.test(allText)) {
    excludedOrRiskyCriteria.push(
      'Removed protected or discriminatory criteria from the assistant scope.'
    );
  }

  if (warning) {
    ambiguityFlags.push(warning);
  }

  return {
    ambiguityFlags,
    suggestedRewrite: {
      title: fields.title,
      rolePurpose: fields.rolePurpose,
      outcomeSummary: fields.outcomeSummary,
      constraints:
        fields.constraints && !('summary' in fields.constraints)
          ? {
              locationMode: fields.constraints.locationMode ?? null,
              city: fields.constraints.city ?? null,
              country: fields.constraints.country ?? null,
              hoursMin: fields.constraints.hoursMin ?? null,
              hoursMax: fields.constraints.hoursMax ?? null,
              compensationSummary:
                fields.constraints.compMin && fields.constraints.compMax
                  ? `${fields.constraints.currency ?? 'USD'} ${fields.constraints.compMin} to ${fields.constraints.compMax}`
                  : null,
              startWindow:
                fields.constraints.startEarliest || fields.constraints.startLatest
                  ? [fields.constraints.startEarliest, fields.constraints.startLatest]
                      .filter(Boolean)
                      .join(' to ')
                  : null,
            }
          : null,
      capabilityExpectations: fields.capabilityExpectations,
      proofExpectations: fields.proofExpectations,
      verificationRequirements: fields.verificationRequirements,
    },
    reviewQuestions,
    excludedOrRiskyCriteria,
  };
}

function sanitizeStringArray(values: string[], redactionSummary: Record<string, number>) {
  return values
    .map((value) => {
      const redacted = redactAssignmentClarityText(value);
      mergeCounts(redactionSummary, redacted.counts);
      if (
        SCORING_OR_JUDGMENT_PATTERN.test(redacted.value) ||
        PROTECTED_TRAIT_PATTERN.test(redacted.value)
      ) {
        return null;
      }
      return redacted.value;
    })
    .filter((value): value is string => Boolean(value));
}

function sanitizeSuggestionOutput(
  response: AssignmentClarityResponse,
  context: SanitizedAssignmentContext
): AssignmentClarityResponse {
  const excluded = new Set(response.excludedOrRiskyCriteria);
  const suggestedRewrite: AssignmentClarityResponse['suggestedRewrite'] = {
    ...response.suggestedRewrite,
  };

  for (const key of ['title', 'rolePurpose', 'outcomeSummary', 'proofExpectations'] as const) {
    const value = suggestedRewrite[key];
    if (!value) continue;
    const redacted = redactAssignmentClarityText(value);
    mergeCounts(context.redactionSummary, redacted.counts);
    if (SCORING_OR_JUDGMENT_PATTERN.test(redacted.value)) {
      suggestedRewrite[key] = null;
      excluded.add('Removed prohibited review criteria from a suggested field.');
      continue;
    }
    if (PROTECTED_TRAIT_PATTERN.test(redacted.value)) {
      suggestedRewrite[key] = null;
      excluded.add('Removed protected or discriminatory criteria from a suggested field.');
      continue;
    }
    suggestedRewrite[key] = redacted.value;
  }

  if (suggestedRewrite.capabilityExpectations) {
    suggestedRewrite.capabilityExpectations = sanitizeStringArray(
      suggestedRewrite.capabilityExpectations,
      context.redactionSummary
    );
  }

  if (suggestedRewrite.verificationRequirements) {
    suggestedRewrite.verificationRequirements = sanitizeStringArray(
      suggestedRewrite.verificationRequirements,
      context.redactionSummary
    );
  }

  return {
    ambiguityFlags: sanitizeStringArray(response.ambiguityFlags, context.redactionSummary),
    suggestedRewrite,
    reviewQuestions: sanitizeStringArray(response.reviewQuestions, context.redactionSummary),
    excludedOrRiskyCriteria: sanitizeStringArray([...excluded], context.redactionSummary),
  };
}

export async function suggestAssignmentClarityForUser(params: {
  userId: string;
  requestId: string;
  input: AssignmentClarityRequest;
  idempotencyKey?: string | null;
}): Promise<
  AssignmentClarityResponse & {
    cacheHit?: boolean;
    fallback?: boolean;
    promptVersion: string;
    suggestionId?: string | null;
  }
> {
  const access = await verifyExplicitAssignmentMutationAccess(
    params.userId,
    params.input.assignmentId,
    {
      orgId: params.input.orgId,
      orgSlug: params.input.orgSlug,
    }
  );

  if (access.status === 'missing_org_context') {
    throw new Error('MISSING_ORG_CONTEXT');
  }
  if (access.status !== 'ok' || !access.orgId) {
    throw new Error('ASSIGNMENT_FORBIDDEN');
  }

  const context = await buildSanitizedAssignmentContext(params.input, access.orgId);
  const inputHash = hashAiContent(context);
  const cacheKey = buildAiSuggestionCacheKey({
    userId: params.userId,
    orgId: access.orgId,
    feature: ASSIGNMENT_CLARITY_FEATURE,
    entityType: 'assignment',
    entityId: params.input.assignmentId,
    inputHash,
    promptVersion: ASSIGNMENT_CLARITY_PROMPT_VERSION,
  });

  const replay = await findAiSuggestionReplay({
    cacheKey,
    userId: params.userId,
    orgId: access.orgId,
  });
  if (replay) {
    const parsed = AssignmentClarityResponseSchema.safeParse(replay.payload);
    if (parsed.success) {
      await recordAiSuggestionEvent({
        cacheId: replay.cacheId,
        eventType: 'cache_hit',
        userId: params.userId,
        orgId: access.orgId,
        feature: ASSIGNMENT_CLARITY_FEATURE,
        entityType: 'assignment',
        entityId: params.input.assignmentId,
        inputHash,
        safeMetadata: {
          prompt_version: ASSIGNMENT_CLARITY_PROMPT_VERSION,
          model: replay.model,
        },
      });
      await recordAiSuggestionEvent({
        cacheId: replay.cacheId,
        eventType: 'viewed',
        userId: params.userId,
        orgId: access.orgId,
        feature: ASSIGNMENT_CLARITY_FEATURE,
        entityType: 'assignment',
        entityId: params.input.assignmentId,
        inputHash,
        safeMetadata: {
          prompt_version: ASSIGNMENT_CLARITY_PROMPT_VERSION,
          source: 'cache',
        },
      });
      return {
        ...sanitizeSuggestionOutput(parsed.data, context),
        cacheHit: true,
        suggestionId: replay.cacheId,
        promptVersion: ASSIGNMENT_CLARITY_PROMPT_VERSION,
      };
    }
  }

  try {
    const result = await generateJson({
      requestId: params.requestId,
      promptVersion: ASSIGNMENT_CLARITY_PROMPT_VERSION,
      feature: ASSIGNMENT_CLARITY_FEATURE,
      prompt: buildPrompt(context),
      schema: AssignmentClarityResponseSchema,
      responseJsonSchema: ASSIGNMENT_CLARITY_RESPONSE_JSON_SCHEMA,
      maxOutputTokens: 900,
      temperature: 0,
      usage: {
        userId: params.userId,
        orgId: access.orgId,
        entityType: 'assignment',
        entityId: params.input.assignmentId,
        inputHash,
        sanitizedInputChars: JSON.stringify(context).length,
        redactionSummary: context.redactionSummary,
        safeMetadata: {
          prompt_version: ASSIGNMENT_CLARITY_PROMPT_VERSION,
          idempotency_key_present: Boolean(params.idempotencyKey),
          assignment_status: context.status,
        },
        bypassCache: true,
      },
    });

    const response = sanitizeSuggestionOutput(result.data, context);
    if (result.suggestionId) {
      await recordAiSuggestionEvent({
        cacheId: result.suggestionId,
        eventType: 'viewed',
        userId: params.userId,
        orgId: access.orgId,
        feature: ASSIGNMENT_CLARITY_FEATURE,
        entityType: 'assignment',
        entityId: params.input.assignmentId,
        inputHash,
        safeMetadata: {
          prompt_version: ASSIGNMENT_CLARITY_PROMPT_VERSION,
          source: 'generated',
        },
      });
    }

    return {
      ...response,
      suggestionId: result.suggestionId,
      promptVersion: ASSIGNMENT_CLARITY_PROMPT_VERSION,
    };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return {
        ...sanitizeSuggestionOutput(
          deterministicFallback(
            context,
            'AI provider was unavailable, so Proofound returned a deterministic assignment checklist.'
          ),
          context
        ),
        fallback: true,
        promptVersion: ASSIGNMENT_CLARITY_PROMPT_VERSION,
      };
    }
    throw error;
  }
}
