import { and, eq, or } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { proofPacks } from '@/db/schema';
import { generateJson } from '@/lib/ai/provider';
import { AiProviderError } from '@/lib/ai/provider/types';
import {
  buildAiSuggestionCacheKey,
  findAiSuggestionReplay,
  hashAiContent,
  recordAiSuggestionEvent,
} from '@/lib/ai/usage-ledger';
import { containsForbiddenAiOutput } from '@/lib/ai/request-safety';
import type { CanonicalProofPackAggregate } from '@/lib/proofs/canonical-pack';
import { getCanonicalProofPackAggregate } from '@/lib/proofs/canonical-pack';
import {
  collectAiHiddenIdentityTerms,
  redactProofPackAssistantText,
} from '@/lib/ai/proof-pack-assistant';

export const VERIFICATION_COMPOSER_FEATURE = 'verification_request_composer';
export const VERIFICATION_COMPOSER_PROMPT_VERSION = 'ai-verification-composer-v1';

export const VERIFICATION_SCOPES = [
  'relationship_fact',
  'ownership',
  'observed_behavior',
  'outcome_observation',
  'artifact_familiarity',
] as const;

export const VERIFICATION_COMPOSER_FIELDS = [
  'title',
  'claim_statement',
  'ownership_statement',
  'outcome_summary',
  'timeframe',
  'evidence_titles',
] as const;

export type VerificationScope = (typeof VERIFICATION_SCOPES)[number];
export type VerificationComposerField = (typeof VERIFICATION_COMPOSER_FIELDS)[number];

export const VerificationComposerResponseSchema = z.object({
  subject: z.string().trim().max(140),
  message: z.string().trim().max(1800),
  claimScope: z.string().trim().max(500),
  verificationQuestions: z.array(z.string().trim().max(240)).min(1).max(5),
  privacyNotes: z.array(z.string().trim().max(240)).max(8).default([]),
  tooBroadWarnings: z.array(z.string().trim().max(240)).max(8).default([]),
});

const VERIFICATION_COMPOSER_STRING_ARRAY_JSON_SCHEMA = {
  type: 'array',
  items: { type: 'string', maxLength: 240 },
  maxItems: 8,
} as const;

const VERIFICATION_COMPOSER_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string', maxLength: 140 },
    message: { type: 'string', maxLength: 1800 },
    claimScope: { type: 'string', maxLength: 500 },
    verificationQuestions: {
      type: 'array',
      items: { type: 'string', maxLength: 240 },
      minItems: 1,
      maxItems: 5,
    },
    privacyNotes: VERIFICATION_COMPOSER_STRING_ARRAY_JSON_SCHEMA,
    tooBroadWarnings: VERIFICATION_COMPOSER_STRING_ARRAY_JSON_SCHEMA,
  },
  required: [
    'subject',
    'message',
    'claimScope',
    'verificationQuestions',
    'privacyNotes',
    'tooBroadWarnings',
  ],
} as const;

export type VerificationComposerResponse = z.infer<typeof VerificationComposerResponseSchema>;

type ComposeVerificationRequestParams = {
  proofPackId?: string | null;
  claimId?: string | null;
  userId: string;
  requestId: string;
  verifierRelationshipType: string;
  verificationScope: VerificationScope;
  selectedPublicSafeProofFields: VerificationComposerField[];
  idempotencyKey?: string | null;
};

type SanitizedComposerContext = {
  promptVersion: typeof VERIFICATION_COMPOSER_PROMPT_VERSION;
  proofPackId: string;
  claimId: string | null;
  verifierRelationshipType: string;
  verificationScope: VerificationScope;
  selectedFields: Partial<Record<VerificationComposerField, string | string[] | null>>;
  claimScope: string;
  privacyRules: string[];
  redactionSummary: Record<string, number>;
};

function mergeCounts(target: Record<string, number>, source: Record<string, number>) {
  for (const [key, count] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + count;
  }
}

function redactedNullableWithHiddenTerms(
  value: string | null | undefined,
  counts: Record<string, number>,
  hiddenIdentityTerms: string[]
) {
  const redacted = redactProofPackAssistantText(value, hiddenIdentityTerms);
  mergeCounts(counts, redacted.counts);
  return redacted.value.length > 0 ? redacted.value : null;
}

function compactTimeframe(
  timeframe: CanonicalProofPackAggregate['ownerFull']['contract']['timeframe'] | null | undefined
) {
  return (
    timeframe?.label || [timeframe?.start, timeframe?.end].filter(Boolean).join(' to ') || null
  );
}

function publicSafeEvidenceTitles(aggregate: CanonicalProofPackAggregate) {
  return (
    aggregate.publicSafe?.items
      .map((item) => item.artifactDisplayName || item.title)
      .filter((title): title is string => typeof title === 'string' && title.trim().length > 0) ??
    []
  );
}

async function resolveProofPackId(params: {
  proofPackId?: string | null;
  claimId?: string | null;
  userId: string;
}) {
  if (params.proofPackId) {
    return params.proofPackId;
  }

  if (!params.claimId) {
    throw new Error('PROOF_PACK_OR_CLAIM_REQUIRED');
  }

  const [pack] = await db
    .select({ id: proofPacks.id })
    .from(proofPacks)
    .where(
      and(
        eq(proofPacks.ownerType, 'individual_profile'),
        eq(proofPacks.ownerId, params.userId),
        or(eq(proofPacks.id, params.claimId), eq(proofPacks.primarySubjectId, params.claimId))
      )
    )
    .limit(1);

  return pack?.id ?? null;
}

export function buildSanitizedVerificationComposerContext(params: {
  aggregate: CanonicalProofPackAggregate;
  verifierRelationshipType: string;
  verificationScope: VerificationScope;
  selectedPublicSafeProofFields: VerificationComposerField[];
  claimId?: string | null;
}): SanitizedComposerContext {
  const contract = params.aggregate.publicSafe?.contract ?? null;
  const redactionSummary: Record<string, number> = {};
  const hiddenIdentityTerms = collectAiHiddenIdentityTerms(params.aggregate);
  const selected = new Set(params.selectedPublicSafeProofFields);
  const selectedFields: SanitizedComposerContext['selectedFields'] = {};

  if (selected.has('title')) {
    selectedFields.title = redactedNullableWithHiddenTerms(
      contract?.title,
      redactionSummary,
      hiddenIdentityTerms
    );
  }
  if (selected.has('claim_statement')) {
    selectedFields.claim_statement = redactedNullableWithHiddenTerms(
      contract?.primaryClaim.statement,
      redactionSummary,
      hiddenIdentityTerms
    );
  }
  if (selected.has('ownership_statement')) {
    selectedFields.ownership_statement = redactedNullableWithHiddenTerms(
      contract?.ownershipStatement,
      redactionSummary,
      hiddenIdentityTerms
    );
  }
  if (selected.has('outcome_summary')) {
    selectedFields.outcome_summary = redactedNullableWithHiddenTerms(
      contract?.outcomeSummary,
      redactionSummary,
      hiddenIdentityTerms
    );
  }
  if (selected.has('timeframe')) {
    selectedFields.timeframe = redactedNullableWithHiddenTerms(
      compactTimeframe(contract?.timeframe),
      redactionSummary,
      hiddenIdentityTerms
    );
  }
  if (selected.has('evidence_titles')) {
    selectedFields.evidence_titles = publicSafeEvidenceTitles(params.aggregate)
      .slice(0, 5)
      .map((title) => redactedNullableWithHiddenTerms(title, redactionSummary, hiddenIdentityTerms))
      .filter((title): title is string => Boolean(title));
  }

  const claimScope =
    redactedNullableWithHiddenTerms(
      contract?.primaryClaim.statement,
      redactionSummary,
      hiddenIdentityTerms
    ) ||
    redactedNullableWithHiddenTerms(contract?.title, redactionSummary, hiddenIdentityTerms) ||
    'One scoped proof record claim';

  return {
    promptVersion: VERIFICATION_COMPOSER_PROMPT_VERSION,
    proofPackId: params.aggregate.pack.id,
    claimId: params.claimId || params.aggregate.pack.primarySubjectId || null,
    verifierRelationshipType: params.verifierRelationshipType.trim().slice(0, 80),
    verificationScope: params.verificationScope,
    selectedFields,
    claimScope,
    privacyRules: [
      'Use only the selected fields in this JSON context.',
      'Do not include hidden private context, private files, verifier email, or account metadata.',
      'Ask about one primary claim scope only.',
      'Do not ask for general praise, candidate evaluation, suitability, trust level, verification approval, interview, or hiring decisions.',
    ],
    redactionSummary,
  };
}

function buildPrompt(context: SanitizedComposerContext) {
  return [
    'You are Proofound Verification Request Composer.',
    `Prompt version: ${VERIFICATION_COMPOSER_PROMPT_VERSION}.`,
    'Draft concise, respectful verification request copy for one claim-scoped proof record request.',
    'Use only the selected public-safe proof fields in the JSON context.',
    'Never include verifier email or hidden/private context.',
    'Do not ask for general praise, endorsement, candidate evaluation, suitability, trust level, verification approval, interview, or hiring decisions.',
    'Generate exactly one primary claim scope. If the selected fields are too broad, keep the draft narrow and add warnings.',
    'Return JSON only with keys: subject, message, claimScope, verificationQuestions, privacyNotes, tooBroadWarnings.',
    '',
    'Sanitized context:',
    JSON.stringify(context, null, 2),
  ].join('\n');
}

function deterministicFallback(
  context: SanitizedComposerContext,
  warning: string | null = null
): VerificationComposerResponse {
  const claim = context.claimScope;
  const relationship = context.verifierRelationshipType || 'someone familiar with the work';

  return {
    subject: 'Proofound verification request',
    message: [
      `Hi, I am asking ${relationship} to confirm one specific Proofound claim: ${claim}.`,
      'Please only respond based on what you directly know or observed. It is completely fine to confirm only part of it or say that you cannot verify it.',
      'Thank you for taking a careful look.',
    ].join('\n\n'),
    claimScope: claim,
    verificationQuestions: [
      `Can you confirm the specific claim: ${claim}?`,
      'Which parts can you confirm from direct knowledge or observation?',
      'Is there anything in this request that you cannot verify?',
    ],
    privacyNotes: [
      'Draft uses selected public-safe proof record fields only.',
      ...Object.entries(context.redactionSummary)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => `${count} ${key.replace(/_/g, ' ')} redacted before drafting.`),
    ],
    tooBroadWarnings: [
      'This draft is limited to one claim scope and avoids general praise or candidate quality judgment.',
      ...(warning ? [warning] : []),
    ],
  };
}

function sanitizeComposerOutput(
  response: VerificationComposerResponse,
  context: SanitizedComposerContext
): VerificationComposerResponse {
  const sanitize = (value: string) => redactProofPackAssistantText(value).value;
  const forbiddenPattern =
    /\b(?:praise|endorse(?:ment)?|overall candidate|candidate quality|hire|hiring fit|rank|ranking|score|fit score|suitability\s+judg(?:e|ment)|verification\s+approval|trust\s+level|best\s+candidate|should\s+hire|recommended\s+to\s+interview|recommend(?:ation)?)\b/i;
  const tooBroadWarnings = new Set(response.tooBroadWarnings.map(sanitize));

  const questions = response.verificationQuestions
    .map(sanitize)
    .filter((question) => question.length > 0)
    .slice(0, 5);

  const filteredQuestions = questions.filter(
    (question) => !forbiddenPattern.test(question) && !containsForbiddenAiOutput(question)
  );
  if (filteredQuestions.length !== questions.length) {
    tooBroadWarnings.add('Removed a question that crossed Proofound verification boundaries.');
  }
  const fallback = deterministicFallback(context);
  const subject = sanitize(response.subject);
  const message = sanitize(response.message);
  const claimScope = sanitize(response.claimScope);

  if (
    forbiddenPattern.test(subject) ||
    forbiddenPattern.test(message) ||
    forbiddenPattern.test(claimScope) ||
    containsForbiddenAiOutput({ subject, message, claimScope })
  ) {
    tooBroadWarnings.add('Removed draft text that crossed Proofound verification boundaries.');
  }

  return {
    subject:
      subject && !forbiddenPattern.test(subject) && !containsForbiddenAiOutput(subject)
        ? subject
        : 'Proofound verification request',
    message:
      message && !forbiddenPattern.test(message) && !containsForbiddenAiOutput(message)
        ? message
        : fallback.message,
    claimScope:
      claimScope && !forbiddenPattern.test(claimScope) && !containsForbiddenAiOutput(claimScope)
        ? claimScope
        : context.claimScope,
    verificationQuestions:
      filteredQuestions.length > 0 ? filteredQuestions : fallback.verificationQuestions,
    privacyNotes: response.privacyNotes.map(sanitize).filter(Boolean).slice(0, 8),
    tooBroadWarnings: [...tooBroadWarnings].filter(Boolean).slice(0, 8),
  };
}

export async function composeVerificationRequestForUser(
  params: ComposeVerificationRequestParams
): Promise<
  VerificationComposerResponse & {
    cacheHit?: boolean;
    fallback?: boolean;
    suggestionId?: string | null;
  }
> {
  const proofPackId = await resolveProofPackId(params);
  if (!proofPackId) {
    throw new Error('PROOF_PACK_NOT_FOUND');
  }

  const aggregate = await getCanonicalProofPackAggregate(proofPackId);
  if (
    !aggregate ||
    aggregate.pack.ownerType !== 'individual_profile' ||
    aggregate.pack.ownerId !== params.userId
  ) {
    throw new Error('PROOF_PACK_NOT_FOUND');
  }

  const context = buildSanitizedVerificationComposerContext({
    aggregate,
    verifierRelationshipType: params.verifierRelationshipType,
    verificationScope: params.verificationScope,
    selectedPublicSafeProofFields: params.selectedPublicSafeProofFields,
    claimId: params.claimId,
  });
  if (!aggregate.publicSafe?.contract) {
    return {
      ...deterministicFallback(
        context,
        'Public-safe proof record context was unavailable, so manual editing is required before AI drafting.'
      ),
      fallback: true,
    };
  }
  const inputHash = hashAiContent(context);
  const cacheKey = buildAiSuggestionCacheKey({
    userId: params.userId,
    feature: VERIFICATION_COMPOSER_FEATURE,
    entityType: 'proof_pack',
    entityId: proofPackId,
    inputHash,
    promptVersion: VERIFICATION_COMPOSER_PROMPT_VERSION,
  });

  const replay = await findAiSuggestionReplay({
    cacheKey,
    userId: params.userId,
  });
  if (replay) {
    const parsed = VerificationComposerResponseSchema.safeParse(replay.payload);
    if (parsed.success) {
      await recordAiSuggestionEvent({
        cacheId: replay.cacheId,
        eventType: 'cache_hit',
        userId: params.userId,
        feature: VERIFICATION_COMPOSER_FEATURE,
        entityType: 'proof_pack',
        entityId: proofPackId,
        inputHash,
        safeMetadata: {
          prompt_version: VERIFICATION_COMPOSER_PROMPT_VERSION,
          model: replay.model,
        },
      });
      await recordAiSuggestionEvent({
        cacheId: replay.cacheId,
        eventType: 'viewed',
        userId: params.userId,
        feature: VERIFICATION_COMPOSER_FEATURE,
        entityType: 'proof_pack',
        entityId: proofPackId,
        inputHash,
        safeMetadata: {
          prompt_version: VERIFICATION_COMPOSER_PROMPT_VERSION,
          source: 'cache',
        },
      });
      return {
        ...sanitizeComposerOutput(parsed.data, context),
        cacheHit: true,
        suggestionId: replay.cacheId,
      };
    }
  }

  try {
    const result = await generateJson({
      requestId: params.requestId,
      promptVersion: VERIFICATION_COMPOSER_PROMPT_VERSION,
      feature: VERIFICATION_COMPOSER_FEATURE,
      prompt: buildPrompt(context),
      schema: VerificationComposerResponseSchema,
      responseJsonSchema: VERIFICATION_COMPOSER_RESPONSE_JSON_SCHEMA,
      maxOutputTokens: 900,
      temperature: 0,
      usage: {
        userId: params.userId,
        entityType: 'proof_pack',
        entityId: proofPackId,
        inputHash,
        sanitizedInputChars: JSON.stringify(context).length,
        redactionSummary: context.redactionSummary,
        safeMetadata: {
          prompt_version: VERIFICATION_COMPOSER_PROMPT_VERSION,
          verification_scope: params.verificationScope,
          selected_field_count: params.selectedPublicSafeProofFields.length,
          idempotency_key_present: Boolean(params.idempotencyKey),
        },
        bypassCache: true,
      },
    });

    const response = sanitizeComposerOutput(result.data, context);
    if (result.suggestionId) {
      await recordAiSuggestionEvent({
        cacheId: result.suggestionId,
        eventType: 'viewed',
        userId: params.userId,
        feature: VERIFICATION_COMPOSER_FEATURE,
        entityType: 'proof_pack',
        entityId: proofPackId,
        inputHash,
        safeMetadata: {
          prompt_version: VERIFICATION_COMPOSER_PROMPT_VERSION,
          source: 'generated',
        },
      });
    }
    return {
      ...response,
      suggestionId: result.suggestionId,
    };
  } catch (error) {
    if (error instanceof AiProviderError) {
      const fallbackWarning =
        error.code === 'budget_exceeded'
          ? 'AI suggestions are temporarily unavailable; manual editing still works.'
          : 'AI provider was unavailable, so Proofound returned a deterministic draft.';
      return {
        ...deterministicFallback(context, fallbackWarning),
        fallback: true,
      };
    }
    throw error;
  }
}
