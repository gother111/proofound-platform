import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { skills, skillsTaxonomy } from '@/db/schema';
import { generateJson } from '@/lib/ai/provider';
import { AiProviderError } from '@/lib/ai/provider/types';
import {
  buildAiSuggestionCacheKey,
  findAiSuggestionReplay,
  hashAiContent,
  recordAiSuggestionEvent,
} from '@/lib/ai/usage-ledger';
import { skillDisplayLabel } from '@/lib/copy/labels';
import type { CanonicalProofPackAggregate } from '@/lib/proofs/canonical-pack';
import { getCanonicalProofPackAggregate } from '@/lib/proofs/canonical-pack';

export const PROOF_PACK_ASSISTANT_FEATURE = 'proof_pack_assistant';
export const PROOF_PACK_ASSISTANT_PROMPT_VERSION = 'ai-proof-pack-v1';

const REDACTION_PATTERNS = [
  {
    key: 'emails',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[redacted email]',
  },
  {
    key: 'urls',
    pattern: /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi,
    replacement: '[redacted url]',
  },
  {
    key: 'filenames',
    pattern: /\b[^\s/\\]+\.(?:pdf|png|jpe?g|heic|heif|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z)\b/gi,
    replacement: '[redacted filename]',
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

const FORBIDDEN_JUDGMENT_PATTERN =
  /\b(?:candidate\s+score|score\s+the|rank(?:ing)?|shortlist|fit\s+judg(?:e|ment)|fit\s+for\s+the\s+role|hire\s+recommendation|recommended\s+candidate)\b/i;

export const ProofPackAssistantRewriteSchema = z.object({
  title: z.string().trim().max(180).nullable().optional(),
  claimStatement: z.string().trim().max(600).nullable().optional(),
  ownershipStatement: z.string().trim().max(600).nullable().optional(),
  outcomeSummary: z.string().trim().max(700).nullable().optional(),
  timeframe: z.string().trim().max(160).nullable().optional(),
});

export const ProofPackAssistantResponseSchema = z.object({
  missingContext: z.array(z.string().trim().max(240)).max(12).default([]),
  suggestedRewrite: ProofPackAssistantRewriteSchema.default({}),
  privacyFlags: z.array(z.string().trim().max(240)).max(12).default([]),
  verificationSuggestions: z.array(z.string().trim().max(260)).max(12).default([]),
  warnings: z.array(z.string().trim().max(260)).max(12).default([]),
});

export type ProofPackAssistantResponse = z.infer<typeof ProofPackAssistantResponseSchema>;

export type ProofPackAssistantSanitizedContext = {
  promptVersion: typeof PROOF_PACK_ASSISTANT_PROMPT_VERSION;
  proofPackId: string;
  selectedFields: {
    title: string | null;
    claimStatement: string | null;
    ownershipStatement: string | null;
    outcomeSummary: string | null;
    timeframe: string | null;
    linkedSkills: string[];
    evidence: Array<{
      type: string;
      title: string | null;
    }>;
    visibilityState: string;
  };
  redactionSummary: Record<string, number>;
};

type RedactionResult = {
  value: string;
  counts: Record<string, number>;
};

function mergeCounts(target: Record<string, number>, source: Record<string, number>) {
  for (const [key, count] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + count;
  }
}

export function redactProofPackAssistantText(value: string | null | undefined): RedactionResult {
  let next = typeof value === 'string' ? value : '';
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
    value: next.trim().slice(0, 1200),
    counts,
  };
}

function redactedNullable(value: string | null | undefined, counts: Record<string, number>) {
  const redacted = redactProofPackAssistantText(value);
  mergeCounts(counts, redacted.counts);
  return redacted.value.length > 0 ? redacted.value : null;
}

function compactTimeframe(
  timeframe: CanonicalProofPackAggregate['ownerFull']['contract']['timeframe']
) {
  return timeframe.label || [timeframe.start, timeframe.end].filter(Boolean).join(' to ') || null;
}

function isModelVisibleEvidenceItem(
  item: CanonicalProofPackAggregate['ownerFull']['items'][number]
) {
  return item.effectiveVisibility !== 'owner_only' && item.effectiveVisibility !== 'internal_only';
}

export function buildSanitizedProofPackAssistantContext(
  aggregate: CanonicalProofPackAggregate,
  linkedSkillLabelsById: Map<string, string> = new Map()
): ProofPackAssistantSanitizedContext {
  const contract = aggregate.ownerFull.contract;
  const redactionSummary: Record<string, number> = {};
  const evidence = aggregate.ownerFull.items.filter(isModelVisibleEvidenceItem).map((item) => {
    const title =
      item.artifact.artifactDisplayName ||
      item.artifact.title ||
      item.artifact.artifactKind ||
      item.itemClass;

    return {
      type: item.artifact.artifactKind || item.itemClass,
      title: redactedNullable(title, redactionSummary),
    };
  });

  return {
    promptVersion: PROOF_PACK_ASSISTANT_PROMPT_VERSION,
    proofPackId: aggregate.pack.id,
    selectedFields: {
      title: redactedNullable(contract.title, redactionSummary),
      claimStatement: redactedNullable(contract.primaryClaim.statement, redactionSummary),
      ownershipStatement: redactedNullable(contract.ownershipStatement, redactionSummary),
      outcomeSummary: redactedNullable(contract.outcomeSummary, redactionSummary),
      timeframe: redactedNullable(compactTimeframe(contract.timeframe), redactionSummary),
      linkedSkills: contract.linkedSkills
        .map(
          (skill) =>
            linkedSkillLabelsById.get(skill.skillId) || skillDisplayLabel({ id: skill.skillId })
        )
        .map((label) => redactedNullable(label, redactionSummary))
        .filter((label): label is string => Boolean(label)),
      evidence,
      visibilityState: aggregate.pack.visibility,
    },
    redactionSummary,
  };
}

function buildPrompt(context: ProofPackAssistantSanitizedContext) {
  return [
    'You are Proofound Proof Pack Assistant.',
    `Prompt version: ${PROOF_PACK_ASSISTANT_PROMPT_VERSION}.`,
    'Help an individual improve structured Proof Pack text without inventing facts.',
    'Use only the selected sanitized fields in the JSON context.',
    'Never send, request, or rely on file contents, original filenames, URLs, emails, phone numbers, tokens, hidden private context, or protected-trait inference.',
    'Never produce a candidate score, rank, fit judgment, hiring recommendation, shortlist decision, or verifier decision.',
    'If a rewrite would require a new fact, put that gap in missingContext or warnings instead.',
    'Return JSON only with keys: missingContext, suggestedRewrite, privacyFlags, verificationSuggestions, warnings.',
    'The suggestedRewrite object may include only title, claimStatement, ownershipStatement, outcomeSummary, and timeframe.',
    '',
    'Sanitized context:',
    JSON.stringify(context, null, 2),
  ].join('\n');
}

function deterministicFallback(
  context: ProofPackAssistantSanitizedContext,
  warning: string | null = null
): ProofPackAssistantResponse {
  const fields = context.selectedFields;
  const missingContext: string[] = [];
  if (!fields.claimStatement)
    missingContext.push('Add one clear claim about what this proof shows.');
  if (!fields.ownershipStatement) missingContext.push('State your role or ownership in the work.');
  if (!fields.outcomeSummary)
    missingContext.push('Add the outcome or contribution this proof supports.');
  if (!fields.timeframe) missingContext.push('Add a timeframe if it is safe to share.');
  if (fields.evidence.length === 0) {
    missingContext.push('Attach at least one public-safe evidence title or type.');
  }

  const privacyFlags = Object.entries(context.redactionSummary)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${key.replace(/_/g, ' ')} redacted before suggestion.`);

  if (fields.visibilityState !== 'public') {
    privacyFlags.push(`Visibility is ${fields.visibilityState}; review before publishing.`);
  }

  return {
    missingContext,
    suggestedRewrite: {
      title: fields.title,
      claimStatement: fields.claimStatement,
      ownershipStatement: fields.ownershipStatement,
      outcomeSummary: fields.outcomeSummary,
      timeframe: fields.timeframe,
    },
    privacyFlags,
    verificationSuggestions: [
      'Ask a non-self verifier to confirm the specific claim, ownership, and outcome.',
    ],
    warnings: [
      'Suggestions use only selected structured text and may not add facts.',
      ...(warning ? [warning] : []),
    ],
  };
}

function sanitizeSuggestionOutput(
  response: ProofPackAssistantResponse,
  context: ProofPackAssistantSanitizedContext
): ProofPackAssistantResponse {
  const warnings = new Set(response.warnings);
  const suggestedRewrite = { ...response.suggestedRewrite };

  for (const key of Object.keys(suggestedRewrite) as Array<keyof typeof suggestedRewrite>) {
    const value = suggestedRewrite[key];
    if (!value) continue;

    const redacted = redactProofPackAssistantText(value);
    mergeCounts(context.redactionSummary, redacted.counts);
    if (FORBIDDEN_JUDGMENT_PATTERN.test(redacted.value)) {
      suggestedRewrite[key] = null;
      warnings.add(
        'Removed a suggested field because it resembled scoring, ranking, or fit judgment.'
      );
      continue;
    }
    suggestedRewrite[key] = redacted.value;
  }

  return {
    missingContext: response.missingContext.map((item) => redactProofPackAssistantText(item).value),
    suggestedRewrite,
    privacyFlags: response.privacyFlags.map((item) => redactProofPackAssistantText(item).value),
    verificationSuggestions: response.verificationSuggestions.map(
      (item) => redactProofPackAssistantText(item).value
    ),
    warnings: [...warnings].map((item) => redactProofPackAssistantText(item).value),
  };
}

async function loadLinkedSkillLabels(aggregate: CanonicalProofPackAggregate) {
  const skillIds = aggregate.ownerFull.contract.linkedSkills
    .map((skill) => skill.skillId)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  if (skillIds.length === 0) {
    return new Map<string, string>();
  }

  const rows = await db
    .select({
      id: skills.id,
      skillId: skills.skillId,
      skillCode: skills.skillCode,
      taxonomyName: skillsTaxonomy.nameI18n,
    })
    .from(skills)
    .leftJoin(skillsTaxonomy, eq(skills.skillCode, skillsTaxonomy.code))
    .where(inArray(skills.id, skillIds));

  return new Map(
    rows.map((row) => {
      const taxonomyName =
        row.taxonomyName &&
        typeof row.taxonomyName === 'object' &&
        !Array.isArray(row.taxonomyName) &&
        typeof (row.taxonomyName as Record<string, unknown>).en === 'string'
          ? ((row.taxonomyName as Record<string, string>).en ?? null)
          : null;

      return [
        row.id,
        skillDisplayLabel({
          id: row.id,
          code: row.skillCode,
          skillName: row.skillId,
          taxonomyName,
        }),
      ] as const;
    })
  );
}

export async function suggestProofPackForUser(params: {
  proofPackId: string;
  userId: string;
  requestId: string;
  idempotencyKey?: string | null;
}): Promise<
  ProofPackAssistantResponse & {
    cacheHit?: boolean;
    fallback?: boolean;
    suggestionId?: string | null;
  }
> {
  const aggregate = await getCanonicalProofPackAggregate(params.proofPackId);
  if (
    !aggregate ||
    aggregate.pack.ownerType !== 'individual_profile' ||
    aggregate.pack.ownerId !== params.userId
  ) {
    throw new Error('PROOF_PACK_NOT_FOUND');
  }

  const skillLabels = await loadLinkedSkillLabels(aggregate);
  const context = buildSanitizedProofPackAssistantContext(aggregate, skillLabels);
  const inputHash = hashAiContent(context);
  const cacheKey = buildAiSuggestionCacheKey({
    userId: params.userId,
    feature: PROOF_PACK_ASSISTANT_FEATURE,
    entityType: 'proof_pack',
    entityId: params.proofPackId,
    inputHash,
    promptVersion: PROOF_PACK_ASSISTANT_PROMPT_VERSION,
  });

  const replay = await findAiSuggestionReplay({
    cacheKey,
    userId: params.userId,
  });
  if (replay) {
    const parsed = ProofPackAssistantResponseSchema.safeParse(replay.payload);
    if (parsed.success) {
      await recordAiSuggestionEvent({
        cacheId: replay.cacheId,
        eventType: 'cache_hit',
        userId: params.userId,
        feature: PROOF_PACK_ASSISTANT_FEATURE,
        entityType: 'proof_pack',
        entityId: params.proofPackId,
        inputHash,
        safeMetadata: {
          prompt_version: PROOF_PACK_ASSISTANT_PROMPT_VERSION,
          model: replay.model,
        },
      });
      await recordAiSuggestionEvent({
        cacheId: replay.cacheId,
        eventType: 'viewed',
        userId: params.userId,
        feature: PROOF_PACK_ASSISTANT_FEATURE,
        entityType: 'proof_pack',
        entityId: params.proofPackId,
        inputHash,
        safeMetadata: {
          prompt_version: PROOF_PACK_ASSISTANT_PROMPT_VERSION,
          source: 'cache',
        },
      });
      return {
        ...sanitizeSuggestionOutput(parsed.data, context),
        cacheHit: true,
        suggestionId: replay.cacheId,
      };
    }
  }

  try {
    const result = await generateJson({
      requestId: params.requestId,
      promptVersion: PROOF_PACK_ASSISTANT_PROMPT_VERSION,
      feature: PROOF_PACK_ASSISTANT_FEATURE,
      prompt: buildPrompt(context),
      schema: ProofPackAssistantResponseSchema,
      maxOutputTokens: 700,
      temperature: 0,
      usage: {
        userId: params.userId,
        entityType: 'proof_pack',
        entityId: params.proofPackId,
        inputHash,
        sanitizedInputChars: JSON.stringify(context).length,
        redactionSummary: context.redactionSummary,
        safeMetadata: {
          prompt_version: PROOF_PACK_ASSISTANT_PROMPT_VERSION,
          selected_field_count: Object.values(context.selectedFields).filter(Boolean).length,
          idempotency_key_present: Boolean(params.idempotencyKey),
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
        feature: PROOF_PACK_ASSISTANT_FEATURE,
        entityType: 'proof_pack',
        entityId: params.proofPackId,
        inputHash,
        safeMetadata: {
          prompt_version: PROOF_PACK_ASSISTANT_PROMPT_VERSION,
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
      return {
        ...deterministicFallback(
          context,
          'AI provider was unavailable, so Proofound returned a deterministic checklist.'
        ),
        fallback: true,
      };
    }
    throw error;
  }
}
