import { z } from 'zod';

import { generateJson } from '@/lib/ai/provider';
import { AiProviderError } from '@/lib/ai/provider/types';
import { hashAiContent } from '@/lib/ai/usage-ledger';
import {
  PRIVACY_PREFLIGHT_PROMPT_VERSION,
  evaluatePrivacyPreflightRules,
  type PrivacyPreflightField,
  type PrivacyPreflightFlag,
  type PrivacyPreflightRiskLevel,
} from '@/lib/privacy/preflight-rules';

export const PRIVACY_PREFLIGHT_FEATURE = 'privacy_preflight';

export const PrivacyPreflightRequestSchema = z
  .object({
    surface: z
      .enum([
        'proof_publication',
        'public_portfolio',
        'assignment_publication',
        'generic_publication',
      ])
      .default('generic_publication'),
    text: z.string().trim().max(6000).optional(),
    fields: z
      .array(
        z
          .object({
            id: z.string().trim().max(80).optional(),
            label: z.string().trim().max(120).optional(),
            value: z.string().max(3000).optional().nullable(),
            visibility: z
              .enum(['visible', 'hidden', 'public', 'private', 'owner_only', 'internal_only'])
              .optional()
              .nullable(),
          })
          .strict()
      )
      .max(24)
      .optional(),
    hiddenTerms: z.array(z.string().trim().min(3).max(160)).max(40).optional(),
    includeModelReview: z.boolean().optional(),
  })
  .strict();

const GeminiPrivacyPreflightSchema = z.object({
  notes: z.array(z.string().trim().max(220)).max(6).default([]),
});

const PRIVACY_PREFLIGHT_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    notes: {
      type: 'array',
      items: { type: 'string', maxLength: 220 },
      maxItems: 6,
    },
  },
  required: ['notes'],
} as const;

export type PrivacyPreflightRequest = z.infer<typeof PrivacyPreflightRequestSchema>;
export type PrivacyPreflightResponse = {
  riskLevel: PrivacyPreflightRiskLevel;
  flags: PrivacyPreflightFlag[];
  safeToPublishSuggestion: string;
  notes: string[];
  promptVersion: typeof PRIVACY_PREFLIGHT_PROMPT_VERSION;
  modelReview: {
    attempted: boolean;
    used: boolean;
  };
};

function buildSafeToPublishSuggestion(input: { riskLevel: PrivacyPreflightRiskLevel }) {
  if (input.riskLevel === 'high') {
    return 'Review required before publishing. Remove or rewrite the flagged private details first.';
  }

  return 'No high-risk deterministic flags were found. Review the content yourself before publishing.';
}

function baseNotes(modelAttempted: boolean) {
  return [
    'This is not a privacy guarantee.',
    'Rules run before any optional model review.',
    'Proofound does not send full files, original filenames, or signed URLs for this check.',
    modelAttempted
      ? 'The optional model review receives only short deterministic-redacted text.'
      : 'The check used deterministic rules only.',
  ];
}

function buildPrompt(params: {
  surface: string;
  redactedText: string;
  flags: PrivacyPreflightFlag[];
}) {
  return [
    'You are Proofound Privacy Preflight.',
    `Prompt version: ${PRIVACY_PREFLIGHT_PROMPT_VERSION}.`,
    'Review only this short deterministic-redacted text for cautious privacy notes.',
    'Do not certify safety. Do not say safe, certified, cleared, or guaranteed.',
    'Do not ask for full files, original filenames, signed URLs, private storage links, or secrets.',
    'Rules are the authority for high-risk flags; return notes only.',
    'Return JSON only with key: notes.',
    '',
    `Surface: ${params.surface}`,
    `Deterministic flag count: ${params.flags.length}`,
    'Redacted text:',
    params.redactedText,
  ].join('\n');
}

export async function runPrivacyPreflightCheck(params: {
  input: PrivacyPreflightRequest;
  userId?: string | null;
  requestId: string;
}): Promise<PrivacyPreflightResponse> {
  const parsed = PrivacyPreflightRequestSchema.parse(params.input);
  const fields: PrivacyPreflightField[] = parsed.fields ?? [];
  const deterministic = evaluatePrivacyPreflightRules({
    text: parsed.text,
    fields,
    hiddenTerms: parsed.hiddenTerms ?? [],
  });

  const notes = baseNotes(Boolean(parsed.includeModelReview));
  let modelUsed = false;

  if (parsed.includeModelReview && deterministic.redactedText.trim().length > 0) {
    try {
      const inputHash = hashAiContent({
        surface: parsed.surface,
        redactedText: deterministic.redactedText,
        flags: deterministic.flags.map((flag) => flag.code),
      });
      const result = await generateJson({
        requestId: params.requestId,
        promptVersion: PRIVACY_PREFLIGHT_PROMPT_VERSION,
        feature: PRIVACY_PREFLIGHT_FEATURE,
        prompt: buildPrompt({
          surface: parsed.surface,
          redactedText: deterministic.redactedText,
          flags: deterministic.flags,
        }),
        schema: GeminiPrivacyPreflightSchema,
        responseJsonSchema: PRIVACY_PREFLIGHT_RESPONSE_JSON_SCHEMA,
        maxOutputTokens: 280,
        temperature: 0,
        usage: params.userId
          ? {
              userId: params.userId,
              entityType: parsed.surface,
              entityId: params.userId,
              inputHash,
              sanitizedInputChars: deterministic.redactedText.length,
              redactionSummary: deterministic.redactionSummary,
              safeMetadata: {
                prompt_version: PRIVACY_PREFLIGHT_PROMPT_VERSION,
                deterministic_flag_count: deterministic.flags.length,
              },
              bypassCache: true,
            }
          : undefined,
      });

      modelUsed = true;
      notes.push(
        ...result.data.notes.map((note) =>
          note.replace(/\bsafe\b|\bcertified\b|\bcleared\b|\bguaranteed\b/gi, 'reviewed')
        )
      );
    } catch (error) {
      if (!(error instanceof AiProviderError)) {
        throw error;
      }
      notes.push(
        'Optional model review was unavailable, so this result uses deterministic rules only.'
      );
    }
  }

  return {
    riskLevel: deterministic.riskLevel,
    flags: deterministic.flags,
    safeToPublishSuggestion: buildSafeToPublishSuggestion({
      riskLevel: deterministic.riskLevel,
    }),
    notes: [...new Set(notes)].slice(0, 10),
    promptVersion: PRIVACY_PREFLIGHT_PROMPT_VERSION,
    modelReview: {
      attempted: Boolean(parsed.includeModelReview),
      used: modelUsed,
    },
  };
}
