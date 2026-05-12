import { createHash, randomUUID } from 'node:crypto';
import { inflateSync } from 'node:zlib';

import { and, count, eq, gte, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import {
  education,
  experiences,
  organizationMembers,
  startFromCvImportSessions,
  volunteering,
} from '@/db/schema';
import { generateJson, resolveAiAssistantsEnabled } from '@/lib/ai/provider';
import { AiProviderError } from '@/lib/ai/provider/types';
import {
  createAiUsageLog,
  hashAiContent,
  resolveAiRawPromptLoggingEnabled,
  resolveConfiguredAiMonthlyHardCapSek,
  updateAiUsageLog,
} from '@/lib/ai/usage-ledger';
import { extractTextFromDocument } from '@/lib/expertise/document-extraction-provider';
import { resolveGcpCvOcrConfig } from '@/lib/expertise/gcp-cv-ocr-config';
import { extractPdfTextFromBytes } from '@/lib/expertise/pdf-client-extractor';
import { evaluatePrivacyPreflightRules } from '@/lib/privacy/preflight-rules';

export const START_FROM_CV_FEATURE = 'start_from_cv';
export const START_FROM_CV_PROMPT_VERSION = 'start-from-cv-structuring-v1';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const DEFAULT_MAX_FILE_SIZE_MB = 5;
const DEFAULT_MAX_PAGES = 4;
const DEFAULT_USER_DAILY_LIMIT = 3;
const DEFAULT_GLOBAL_DAILY_LIMIT = 20;
const DEFAULT_RETENTION_HOURS = 24;
const MAX_EXTRACTED_TEXT_CHARS = 30_000;
export const START_FROM_CV_QUOTA_COUNTED_STATUSES = ['ready_for_review', 'accepted'] as const;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const FILENAME_PATTERN = /\b[^\s/\\]+\.(?:pdf|png|jpe?g|docx?|txt|csv)\b/gi;
const REDACTION_PLACEHOLDER_PATTERN =
  /\[redacted (?:email|phone|url|filename|address|sensitive id)\]/gi;
const ADDRESS_HINT_PATTERN =
  /\b\d{1,5}\s+[A-Z][A-Za-z0-9.' -]{2,}\s+(?:street|st|road|rd|ave|avenue|lane|ln|drive|dr|väg|gatan)\b/gi;
const SENSITIVE_ID_PATTERN =
  /\b(?:personnummer|ssn|social security|passport|bank account|iban|tax id|national id)\b[:\s-]*[A-Z0-9 -]{4,}/gi;
const FORBIDDEN_OUTPUT_PATTERN =
  /\b(?:fit score|candidate score|score|rank|ranking|shortlist|recommended role|recommended roles|seniority level|hire|no hire)\b/i;
const CV_ANCHOR_WORD_PATTERN =
  /\b(?:experience|employment|education|volunteer|volunteering|project|role|manager|lead|developer|engineer|designer|consultant|coordinator|specialist|director|analyst|associate|advisor|accountant|accounting|audit|audits|assurance|financial|controls?|analytics|automation|university|school|college|degree|diploma|msc|bsc|mba|skills?)\b/i;
const SKILL_SECTION_PATTERN = /\b(?:skills?|tools?|technologies?|stack|competencies)\b\s*[:;-]/i;
const ROLE_TITLE_PATTERN =
  /\b(?:Assurance Associate|Junior Associate|Internal Audit Advisor|Accountant|Accounting Specialist|Audit Specialist|Data Analytics Specialist|Financial Analyst|Program Manager|Project Manager|Operations Manager|Product Engineer|Product Manager|Software Engineer|Developer|Consultant|Coordinator|Specialist|Advisor|Analyst|Lead|Manager)\b/i;

type EnvReader = Record<string, string | undefined>;

export type StartFromCvEligibilityContext = {
  userId: string;
  persona?: string | null;
  isBetaTesting?: boolean | null;
  orgIds?: string[];
  env?: EnvReader;
};

export type StartFromCvUploadedFile = {
  name?: string | null;
  type: string;
  size: number;
  bytes: Uint8Array;
};

export type StartFromCvDraftOutput = z.infer<typeof StartFromCvDraftOutputSchema>;

const ConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const StartFromCvWorkDraftSchema = z.object({
  id: z.string().min(1),
  organizationLabel: z.string().max(160).nullable().default(null),
  roleTitle: z.string().max(160).nullable().default(null),
  approximateDates: z.string().max(120).nullable().default(null),
  shortContextSummary: z.string().max(700).nullable().default(null),
  possibleProjectOutcomeCandidates: z.array(z.string().max(220)).max(5).default([]),
  confidence: ConfidenceSchema.default('low'),
  sourceSnippetReference: z.string().max(220).nullable().default(null),
  visibility: z.literal('private').default('private'),
});

export const StartFromCvEducationDraftSchema = z.object({
  id: z.string().min(1),
  institutionLabel: z.string().max(160).nullable().default(null),
  programTitle: z.string().max(160).nullable().default(null),
  approximateDates: z.string().max(120).nullable().default(null),
  learningProjectHints: z.array(z.string().max(220)).max(5).default([]),
  visibility: z.literal('private').default('private'),
});

export const StartFromCvVolunteeringDraftSchema = z.object({
  id: z.string().min(1),
  organizationLabel: z.string().max(160).nullable().default(null),
  roleTitle: z.string().max(160).nullable().default(null),
  approximateDates: z.string().max(120).nullable().default(null),
  contributionSummary: z.string().max(700).nullable().default(null),
  visibility: z.literal('private').default('private'),
});

export const StartFromCvProofPackIdeaDraftSchema = z.object({
  id: z.string().min(1),
  titleSuggestion: z.string().max(180),
  possibleClaim: z.string().max(500).nullable().default(null),
  possibleAnchorContext: z.string().max(240).nullable().default(null),
  possibleOutcome: z.string().max(500).nullable().default(null),
  missingEvidenceWarning: z.string().max(240),
  privacyWarning: z.string().max(240),
  status: z.literal('draft_only').default('draft_only'),
});

export const StartFromCvArtifactLinkDraftSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(160),
  sourceContext: z.string().max(220).nullable().default(null),
  status: z.literal('draft_only').default('draft_only'),
  privacyWarning: z.string().max(240),
});

export const StartFromCvUnsupportedSkillDraftSchema = z.object({
  id: z.string().min(1),
  skillLabel: z.string().max(120),
  sourceContext: z.string().max(220),
  status: z.literal('unsupported_draft').default('unsupported_draft'),
  requiresProof: z.literal(true).default(true),
  requiresUserConfirmation: z.literal(true).default(true),
  noTrustLift: z.literal(true).default(true),
  noMatchingLift: z.literal(true).default(true),
  noVerificationState: z.literal(true).default(true),
});

export const StartFromCvDraftOutputSchema = z.object({
  importSessionId: z.string().uuid(),
  sourceType: z.literal('cv').default('cv'),
  extractionStatus: z.string(),
  privacyWarnings: z.array(z.string().max(260)).default([]),
  workContextDrafts: z.array(StartFromCvWorkDraftSchema).default([]),
  educationContextDrafts: z.array(StartFromCvEducationDraftSchema).default([]),
  volunteeringContextDrafts: z.array(StartFromCvVolunteeringDraftSchema).default([]),
  proofPackIdeaDrafts: z.array(StartFromCvProofPackIdeaDraftSchema).default([]),
  artifactLinkDrafts: z.array(StartFromCvArtifactLinkDraftSchema).default([]),
  unsupportedSkillDrafts: z.array(StartFromCvUnsupportedSkillDraftSchema).default([]),
  discardedUnsafeItems: z.array(z.string().max(260)).default([]),
  modelUsed: z.string().nullable().optional(),
  ocrProviderUsed: z.string().nullable().optional(),
  requiresUserReview: z.literal(true).default(true),
});

export const StartFromCvConsentSchema = z
  .object({
    consentToProcessCv: z.literal(true),
  })
  .strict();

export const StartFromCvAcceptSchema = z
  .object({
    accepted: z
      .object({
        workContextDrafts: z.array(StartFromCvWorkDraftSchema).max(20).default([]),
        educationContextDrafts: z.array(StartFromCvEducationDraftSchema).max(20).default([]),
        volunteeringContextDrafts: z.array(StartFromCvVolunteeringDraftSchema).max(20).default([]),
        proofPackIdeaDrafts: z.array(StartFromCvProofPackIdeaDraftSchema).max(20).default([]),
        artifactLinkDrafts: z.array(StartFromCvArtifactLinkDraftSchema).max(20).default([]),
        unsupportedSkillDrafts: z.array(StartFromCvUnsupportedSkillDraftSchema).max(50).default([]),
      })
      .strict(),
  })
  .strict();

const GeminiStartFromCvSchema = StartFromCvDraftOutputSchema.omit({
  importSessionId: true,
  extractionStatus: true,
  modelUsed: true,
  ocrProviderUsed: true,
  requiresUserReview: true,
}).extend({
  sourceType: z.literal('cv').default('cv'),
});

const GEMINI_START_FROM_CV_JSON_SCHEMA = {
  type: 'object',
  properties: {
    sourceType: { type: 'string', enum: ['cv'] },
    privacyWarnings: { type: 'array', items: { type: 'string', maxLength: 260 }, maxItems: 12 },
    workContextDrafts: { type: 'array', maxItems: 10, items: { type: 'object' } },
    educationContextDrafts: { type: 'array', maxItems: 8, items: { type: 'object' } },
    volunteeringContextDrafts: { type: 'array', maxItems: 8, items: { type: 'object' } },
    proofPackIdeaDrafts: { type: 'array', maxItems: 12, items: { type: 'object' } },
    artifactLinkDrafts: { type: 'array', maxItems: 12, items: { type: 'object' } },
    unsupportedSkillDrafts: { type: 'array', maxItems: 20, items: { type: 'object' } },
    discardedUnsafeItems: {
      type: 'array',
      items: { type: 'string', maxLength: 260 },
      maxItems: 12,
    },
  },
  required: [
    'sourceType',
    'privacyWarnings',
    'workContextDrafts',
    'educationContextDrafts',
    'volunteeringContextDrafts',
    'proofPackIdeaDrafts',
    'artifactLinkDrafts',
    'unsupportedSkillDrafts',
    'discardedUnsafeItems',
  ],
} as const;

export class StartFromCvError extends Error {
  constructor(
    readonly code: string,
    readonly status: number
  ) {
    super(code);
    this.name = 'StartFromCvError';
  }
}

export function resolveStartFromCvConfig(env: EnvReader = process.env) {
  const maxFileSizeMb = parsePositiveInt(
    env.START_FROM_CV_MAX_FILE_SIZE_MB,
    DEFAULT_MAX_FILE_SIZE_MB
  );
  return {
    enabled: parseBoolean(env.START_FROM_CV_BETA_ENABLED, false),
    openBetaEnabled: parseBoolean(env.START_FROM_CV_OPEN_BETA_ENABLED, false),
    allowedUserIds: parseCsv(env.START_FROM_CV_ALLOWED_USER_IDS),
    allowedOrgIds: parseCsv(env.START_FROM_CV_ALLOWED_ORG_IDS),
    useGcpOcr: parseBoolean(env.START_FROM_CV_USE_GCP_OCR, false),
    useGeminiStructuring: parseBoolean(env.START_FROM_CV_USE_GEMINI_STRUCTURING, false),
    maxFileSizeMb,
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
    maxPages: parsePositiveInt(env.START_FROM_CV_MAX_PAGES, DEFAULT_MAX_PAGES),
    userDailyLimit: parsePositiveInt(env.START_FROM_CV_USER_DAILY_LIMIT, DEFAULT_USER_DAILY_LIMIT),
    globalDailyLimit: parsePositiveInt(
      env.START_FROM_CV_GLOBAL_DAILY_LIMIT,
      DEFAULT_GLOBAL_DAILY_LIMIT
    ),
    retentionHours: parsePositiveInt(env.START_FROM_CV_RETENTION_HOURS, DEFAULT_RETENTION_HOURS),
    deleteSourceAfterExtraction: parseBoolean(
      env.START_FROM_CV_DELETE_SOURCE_AFTER_EXTRACTION,
      true
    ),
    publicBrowserOcrEnabled: parseBoolean(env.NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED, false),
  };
}

export function getStartFromCvLaunchSummary(env: EnvReader = process.env) {
  const config = resolveStartFromCvConfig(env);
  const blockers: string[] = [];
  if (config.enabled && config.publicBrowserOcrEnabled) {
    blockers.push('browser_cv_import_ocr_enabled');
  }
  if (
    config.enabled &&
    !config.openBetaEnabled &&
    config.allowedUserIds.length === 0 &&
    config.allowedOrgIds.length === 0
  ) {
    blockers.push('invite_audience_not_configured');
  }
  if (config.enabled && config.useGcpOcr) {
    const ocr = resolveGcpCvOcrConfig(env);
    if (!ocr.available) {
      blockers.push(`gcp_document_ai_ocr_${ocr.unavailableReason ?? 'unavailable'}`);
    }
    if (ocr.provider === 'gcp_vision') {
      blockers.push('cloud_vision_provider_blocked');
    }
  }
  if (config.enabled && config.useGeminiStructuring) {
    if (!resolveAiAssistantsEnabled(env)) {
      blockers.push('gemini_structuring_ai_disabled');
    }
    if (resolveAiRawPromptLoggingEnabled(env)) {
      blockers.push('gemini_structuring_raw_prompt_logging_enabled');
    }
    if (isProductionLikeEnv(env) && resolveConfiguredAiMonthlyHardCapSek(env) === null) {
      blockers.push('gemini_structuring_ai_hard_cap_missing');
    }
  }

  return {
    enabled: config.enabled,
    openBetaEnabled: config.openBetaEnabled,
    authenticatedUserBeta: config.openBetaEnabled,
    inviteOnly: !config.openBetaEnabled,
    allowedUserCount: config.allowedUserIds.length,
    allowedOrgCount: config.allowedOrgIds.length,
    useGcpOcr: config.useGcpOcr,
    useGeminiStructuring: config.useGeminiStructuring,
    browserOcrEnabled: config.publicBrowserOcrEnabled,
    maxFileSizeMb: config.maxFileSizeMb,
    maxPages: config.maxPages,
    userDailyLimit: config.userDailyLimit,
    globalDailyLimit: config.globalDailyLimit,
    retentionHours: config.retentionHours,
    deleteSourceAfterExtraction: config.deleteSourceAfterExtraction,
    blockers,
    ok: blockers.length === 0,
  };
}

function isProductionLikeEnv(env: EnvReader): boolean {
  return (
    env.NODE_ENV?.trim().toLowerCase() === 'production' ||
    env.VERCEL_ENV?.trim().toLowerCase() === 'production' ||
    env.APP_ENV?.trim().toLowerCase() === 'production' ||
    env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase() === 'production'
  );
}

export async function assertStartFromCvAccess(context: StartFromCvEligibilityContext) {
  const config = resolveStartFromCvConfig(context.env);
  if (!config.enabled) {
    throw new StartFromCvError('START_FROM_CV_DISABLED', 404);
  }
  if (config.publicBrowserOcrEnabled) {
    throw new StartFromCvError('BROWSER_CV_OCR_MUST_STAY_DISABLED', 503);
  }
  if (context.persona && context.persona !== 'individual') {
    throw new StartFromCvError('INDIVIDUAL_ONLY', 403);
  }

  const orgIds = context.orgIds ?? (await loadActiveOrgIds(context.userId));
  const eligible =
    config.openBetaEnabled ||
    Boolean(context.isBetaTesting) ||
    config.allowedUserIds.includes(context.userId) ||
    orgIds.some((orgId) => config.allowedOrgIds.includes(orgId));

  if (!eligible) {
    throw new StartFromCvError('START_FROM_CV_NOT_INVITED', 403);
  }
}

export async function createStartFromCvSession(input: StartFromCvEligibilityContext) {
  await assertStartFromCvAccess(input);
  await enforceStartFromCvDailyLimits(input.userId, input.env);
  const config = resolveStartFromCvConfig(input.env);
  const expiresAt = new Date(Date.now() + config.retentionHours * 60 * 60 * 1000);

  const [row] = await db
    .insert(startFromCvImportSessions)
    .values({
      userId: input.userId,
      consentConfirmedAt: new Date(),
      expiresAt,
      draftPayload: emptyDraftPayload('not_started'),
    })
    .returning({ id: startFromCvImportSessions.id });

  if (!row) {
    throw new Error('Start from CV session was not created.');
  }

  return getStartFromCvSession({ sessionId: row.id, userId: input.userId });
}

export async function getStartFromCvSession(input: { sessionId: string; userId: string }) {
  const row = await loadOwnedSession(input.sessionId, input.userId);
  if (!row || row.deletedAt) {
    throw new StartFromCvError('START_FROM_CV_SESSION_NOT_FOUND', 404);
  }
  return sessionResponseFromRow(row);
}

export async function extractStartFromCvSession(input: {
  sessionId: string;
  userId: string;
  persona?: string | null;
  isBetaTesting?: boolean | null;
  orgIds?: string[];
  file: StartFromCvUploadedFile;
  env?: EnvReader;
}) {
  await assertStartFromCvAccess({
    userId: input.userId,
    persona: input.persona,
    isBetaTesting: input.isBetaTesting,
    orgIds: input.orgIds,
    env: input.env,
  });
  const session = await loadOwnedSession(input.sessionId, input.userId);
  if (!session || session.deletedAt) {
    throw new StartFromCvError('START_FROM_CV_SESSION_NOT_FOUND', 404);
  }
  if (!session.consentConfirmedAt) {
    throw new StartFromCvError('CONSENT_REQUIRED', 400);
  }

  const config = resolveStartFromCvConfig(input.env);
  const mimeType = normalizeMimeType(input.file.type);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new StartFromCvError('UNSUPPORTED_MIME_TYPE', 400);
  }
  if (input.file.size > config.maxFileSizeBytes) {
    throw new StartFromCvError('FILE_TOO_LARGE', 400);
  }
  const pageCount = countStartFromCvPages(mimeType, input.file.bytes);
  if (pageCount > config.maxPages) {
    throw new StartFromCvError('TOO_MANY_PAGES', 400);
  }

  const requestId = `start_cv_${randomUUID().replaceAll('-', '')}`;
  const localText =
    mimeType === 'application/pdf' ? await extractReadablePdfText(input.file.bytes) : '';
  const ocrResult =
    localText.trim().length === 0 && config.useGcpOcr
      ? await runGuardedOcr({
          requestId,
          userId: input.userId,
          sessionId: input.sessionId,
          mimeType,
          bytes: input.file.bytes,
          env: input.env,
        })
      : null;

  const rawExtractedText = (localText || ocrResult?.text || '').slice(0, MAX_EXTRACTED_TEXT_CHARS);
  const sourceDeletedAt = config.deleteSourceAfterExtraction ? new Date() : null;
  const extractionStatus = rawExtractedText.trim().length > 0 ? 'completed' : 'manual_fallback';

  if (!rawExtractedText.trim()) {
    const fallback = emptyDraftPayload('manual_fallback', {
      ocrProviderUsed: ocrResult?.provider ?? null,
      privacyWarnings: [
        'OCR was unavailable or no readable text could be extracted. Continue manually.',
      ],
    });
    await updateSessionAfterExtraction({
      sessionId: input.sessionId,
      userId: input.userId,
      status: 'manual_fallback',
      extractionStatus: fallback.extractionStatus,
      draftPayload: fallback,
      fileMimeType: mimeType,
      fileSizeBytes: input.file.size,
      pageCount,
      textHash: null,
      redactionSummary: {},
      ocrProviderUsed: fallback.ocrProviderUsed ?? null,
      modelUsed: null,
      sourceDeletedAt,
      discardedUnsafeItems: [],
    });
    return getStartFromCvSession({ sessionId: input.sessionId, userId: input.userId });
  }

  const redacted = redactCvText(rawExtractedText);
  const privacy = evaluatePrivacyPreflightRules({
    text: redacted.value,
    hiddenTerms: [],
  });
  const privacyWarnings = [
    ...privacy.flags.map((flag) => flag.message),
    ...buildCvPrivacyWarnings(redacted.redactionSummary),
  ].slice(0, 12);
  const discardedUnsafeItems = privacy.flags
    .filter((flag) => flag.riskLevel === 'high')
    .map((flag) => `Discarded unsafe CV text matching privacy flag: ${flag.code}`)
    .slice(0, 12);

  const structured = await structureStartFromCvDrafts({
    sessionId: input.sessionId,
    userId: input.userId,
    redactedText: redacted.value,
    privacyWarnings,
    discardedUnsafeItems,
    extractionStatus,
    ocrProviderUsed: ocrResult?.provider ?? (localText ? 'embedded_pdf_text' : null),
    env: input.env,
  });
  const textHash = createHash('sha256').update(redacted.value).digest('hex');
  const usageLogId = await recordStartFromCvUsage({
    requestId,
    userId: input.userId,
    sessionId: input.sessionId,
    inputHash: textHash,
    modelUsed: structured.modelUsed ?? null,
    ocrProviderUsed: structured.ocrProviderUsed ?? null,
    pageCount,
    redactionSummary: redacted.redactionSummary,
    status: 'success',
  });

  await updateSessionAfterExtraction({
    sessionId: input.sessionId,
    userId: input.userId,
    status:
      structured.extractionStatus === 'manual_fallback' ? 'manual_fallback' : 'ready_for_review',
    extractionStatus: structured.extractionStatus,
    draftPayload: structured,
    fileMimeType: mimeType,
    fileSizeBytes: input.file.size,
    pageCount,
    textHash,
    redactionSummary: redacted.redactionSummary,
    ocrProviderUsed: structured.ocrProviderUsed ?? null,
    modelUsed: structured.modelUsed ?? null,
    sourceDeletedAt,
    discardedUnsafeItems,
    usageLogId,
  });

  return getStartFromCvSession({ sessionId: input.sessionId, userId: input.userId });
}

export async function acceptStartFromCvDrafts(input: {
  sessionId: string;
  userId: string;
  accepted: z.infer<typeof StartFromCvAcceptSchema>['accepted'];
}) {
  const session = await loadOwnedSession(input.sessionId, input.userId);
  if (!session || session.deletedAt) {
    throw new StartFromCvError('START_FROM_CV_SESSION_NOT_FOUND', 404);
  }

  await db.transaction(async (tx) => {
    for (const draft of input.accepted.workContextDrafts) {
      await tx.insert(experiences).values({
        userId: input.userId,
        title: draft.roleTitle || 'Private work context draft',
        organizationName: draft.organizationLabel || null,
        orgDescription: 'Private draft imported from CV. Confirm details before using in proof.',
        duration: draft.approximateDates || 'Dates not confirmed',
        outcomes:
          draft.shortContextSummary || 'Draft context imported from CV. Add outcomes manually.',
        projects:
          draft.possibleProjectOutcomeCandidates.join('\n') ||
          'Draft imported from CV. Add project details manually.',
        colleagues: 'Not specified. Add collaboration context manually if relevant.',
        achievements: 'Draft only. Attach proof before treating this as trusted signal.',
        verified: false,
      });
    }

    for (const draft of input.accepted.educationContextDrafts) {
      await tx.insert(education).values({
        userId: input.userId,
        institution: draft.institutionLabel || 'Private education context draft',
        degree: draft.programTitle || 'Program not confirmed',
        duration: draft.approximateDates || 'Dates not confirmed',
        skills: 'Unsupported draft suggestions only. Confirm and attach proof before use.',
        projects:
          draft.learningProjectHints.join('\n') || 'Add learning or project hints manually.',
        verified: false,
      });
    }

    for (const draft of input.accepted.volunteeringContextDrafts) {
      await tx.insert(volunteering).values({
        userId: input.userId,
        title: draft.roleTitle || 'Private volunteering context draft',
        orgDescription: draft.organizationLabel || 'Organization not confirmed',
        duration: draft.approximateDates || 'Dates not confirmed',
        cause: 'Cause not confirmed',
        impact: draft.contributionSummary || 'Draft contribution imported from CV.',
        skillsDeployed: 'Unsupported draft suggestions only. Confirm and attach proof before use.',
        personalWhy: 'Not specified. Add your own context manually.',
        verified: false,
      });
    }

    await tx
      .update(startFromCvImportSessions)
      .set({
        status: 'accepted',
        acceptedPayload: input.accepted,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(startFromCvImportSessions.id, input.sessionId),
          eq(startFromCvImportSessions.userId, input.userId),
          isNull(startFromCvImportSessions.deletedAt)
        )
      );
  });

  return getStartFromCvSession({ sessionId: input.sessionId, userId: input.userId });
}

export async function discardStartFromCvSession(input: {
  sessionId: string;
  userId: string;
  deleteSession?: boolean;
}) {
  const session = await loadOwnedSession(input.sessionId, input.userId);
  if (!session || session.deletedAt) {
    throw new StartFromCvError('START_FROM_CV_SESSION_NOT_FOUND', 404);
  }

  await db
    .update(startFromCvImportSessions)
    .set({
      status: input.deleteSession ? 'deleted' : 'discarded',
      deletedAt: input.deleteSession ? new Date() : null,
      draftPayload: input.deleteSession ? emptyDraftPayload('discarded') : session.draftPayload,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(startFromCvImportSessions.id, input.sessionId),
        eq(startFromCvImportSessions.userId, input.userId)
      )
    );

  return { ok: true, deleted: Boolean(input.deleteSession) };
}

export function countStartFromCvPages(mimeType: string, bytes: Uint8Array): number {
  if (mimeType !== 'application/pdf') {
    return 1;
  }
  const pdfText = Buffer.from(bytes).toString('latin1');
  return Math.max(1, pdfText.match(/\/Type\s*\/Page\b/g)?.length ?? 0);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseCsv(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadActiveOrgIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ orgId: organizationMembers.orgId })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.state, 'active')));
  return rows.map((row) => row.orgId);
}

export async function enforceStartFromCvDailyLimits(userId: string, env?: EnvReader) {
  const config = resolveStartFromCvConfig(env);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const quotaCountedStatus = sql`${startFromCvImportSessions.status} IN ('ready_for_review', 'accepted')`;
  const [userCountRow, globalCountRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(startFromCvImportSessions)
      .where(
        and(
          eq(startFromCvImportSessions.userId, userId),
          gte(startFromCvImportSessions.createdAt, since),
          quotaCountedStatus,
          isNull(startFromCvImportSessions.deletedAt)
        )
      ),
    db
      .select({ value: count() })
      .from(startFromCvImportSessions)
      .where(
        and(
          gte(startFromCvImportSessions.createdAt, since),
          quotaCountedStatus,
          isNull(startFromCvImportSessions.deletedAt)
        )
      ),
  ]);

  if ((userCountRow[0]?.value ?? 0) >= config.userDailyLimit) {
    throw new StartFromCvError('USER_DAILY_LIMIT_EXCEEDED', 429);
  }
  if ((globalCountRow[0]?.value ?? 0) >= config.globalDailyLimit) {
    throw new StartFromCvError('GLOBAL_DAILY_LIMIT_EXCEEDED', 429);
  }
}

function normalizeMimeType(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
}

async function extractReadablePdfText(bytes: Uint8Array): Promise<string> {
  try {
    const extracted = await extractPdfTextFromBytes(bytes);
    if (extracted.trim().length > 0) {
      return extracted;
    }
  } catch {
    // Continue with server-side stream decoding and then a conservative raw scrape.
  }

  const decodedStreamText = extractTextFromPdfStreams(bytes);
  if (decodedStreamText.trim().length > 0) {
    return decodedStreamText;
  }

  const raw = Buffer.from(bytes).toString('utf8');
  const printable = raw
    .replace(/\(([^()\r\n]{3,240})\)/g, '\n$1\n')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return printable.includes('%PDF') ? printable.replace(/%PDF-\S+/g, '').trim() : printable;
}

export function extractTextFromPdfStreams(bytes: Uint8Array): string {
  const pdf = Buffer.from(bytes).toString('latin1');
  const chunks: string[] = [];
  const streamPattern = /stream\r?\n([\s\S]*?)endstream/g;

  for (const match of pdf.matchAll(streamPattern)) {
    const objectSource = pdf.slice(Math.max(0, match.index - 800), match.index);
    const streamSource = (match[1] ?? '').trim();
    if (!/\/FlateDecode/i.test(objectSource)) {
      continue;
    }

    try {
      const encoded = /\/ASCII85Decode/i.test(objectSource)
        ? decodeAscii85(streamSource)
        : Buffer.from(streamSource, 'latin1');
      const inflated = inflateSync(encoded).toString('utf8');
      chunks.push(...extractPdfTextLiterals(inflated));
    } catch {
      // Ignore malformed streams and continue scanning other PDF objects.
    }
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

function decodeAscii85(value: string): Buffer {
  const clean = value.replace(/^<~/, '').replace(/~>$/, '').replace(/\s+/g, '');
  const output: number[] = [];
  let group = '';

  for (const char of clean) {
    if (char === 'z' && group.length === 0) {
      output.push(0, 0, 0, 0);
      continue;
    }
    if (char < '!' || char > 'u') {
      continue;
    }
    group += char;
    if (group.length === 5) {
      output.push(...decodeAscii85Group(group, 4));
      group = '';
    }
  }

  if (group.length > 0) {
    const take = group.length - 1;
    output.push(...decodeAscii85Group(group.padEnd(5, 'u'), take));
  }

  return Buffer.from(output);
}

function decodeAscii85Group(group: string, take: number): number[] {
  let value = 0;
  for (const char of group) {
    value = value * 85 + (char.charCodeAt(0) - 33);
  }
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff].slice(
    0,
    take
  );
}

function extractPdfTextLiterals(content: string): string[] {
  const values: string[] = [];
  const literalPattern = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  for (const match of content.matchAll(literalPattern)) {
    const text = decodePdfLiteral(match[1] ?? '');
    if (text.trim().length > 0) {
      values.push(text.trim());
    }
  }
  return values;
}

function decodePdfLiteral(value: string): string {
  return value
    .replace(/\\([nrtbf()\\])/g, (_match, escaped: string) => {
      switch (escaped) {
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        default:
          return escaped;
      }
    })
    .replace(/\\([0-7]{1,3})/g, (_match, octal: string) =>
      String.fromCharCode(Number.parseInt(octal, 8))
    )
    .replace(/\x7f/g, ' • ')
    .replace(/\x91|\x92/g, "'")
    .replace(/\x93|\x94/g, '"')
    .replace(/\x96/g, '–')
    .replace(/\x97/g, '—');
}

async function runGuardedOcr(input: {
  requestId: string;
  userId: string;
  sessionId: string;
  mimeType: string;
  bytes: Uint8Array;
  env?: EnvReader;
}): Promise<{ text: string; provider: string } | null> {
  const config = resolveGcpCvOcrConfig(input.env);
  if (!config.available || config.provider === 'gcp_vision') {
    return null;
  }

  const result = await extractTextFromDocument(
    {
      requestId: input.requestId,
      userId: input.userId,
      documentId: input.sessionId,
      contentType: input.mimeType,
      fileBytes: input.bytes,
      metadata: {
        feature: START_FROM_CV_FEATURE,
        source: 'private_cv_draft_import',
      },
    },
    { env: input.env, config }
  );

  if (result.status !== 'completed') {
    return null;
  }
  return {
    text: result.text,
    provider: result.provider,
  };
}

function redactCvText(value: string): { value: string; redactionSummary: Record<string, number> } {
  const redactionSummary: Record<string, number> = {};
  let next = value;
  for (const [key, pattern, replacement] of [
    ['emails', EMAIL_PATTERN, '[redacted email]'],
    ['phones', PHONE_PATTERN, '[redacted phone]'],
    ['urls', URL_PATTERN, '[redacted url]'],
    ['filenames', FILENAME_PATTERN, '[redacted filename]'],
    ['addresses', ADDRESS_HINT_PATTERN, '[redacted address]'],
    ['sensitive_ids', SENSITIVE_ID_PATTERN, '[redacted sensitive id]'],
  ] as const) {
    let count = 0;
    next = next.replace(pattern, () => {
      count += 1;
      return replacement;
    });
    pattern.lastIndex = 0;
    if (count > 0) {
      redactionSummary[key] = count;
    }
  }

  return {
    value: next
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, MAX_EXTRACTED_TEXT_CHARS),
    redactionSummary,
  };
}

function buildCvPrivacyWarnings(redactionSummary: Record<string, number>): string[] {
  return Object.entries(redactionSummary).map(
    ([key, count]) => `${count} ${key.replaceAll('_', ' ')} redacted from CV text before drafting.`
  );
}

async function structureStartFromCvDrafts(input: {
  sessionId: string;
  userId: string;
  redactedText: string;
  privacyWarnings: string[];
  discardedUnsafeItems: string[];
  extractionStatus: string;
  ocrProviderUsed: string | null;
  env?: EnvReader;
}): Promise<StartFromCvDraftOutput> {
  const config = resolveStartFromCvConfig(input.env);
  if (config.useGeminiStructuring) {
    try {
      const result = await generateJson({
        requestId: `start_cv_struct_${randomUUID().replaceAll('-', '')}`,
        promptVersion: START_FROM_CV_PROMPT_VERSION,
        feature: START_FROM_CV_FEATURE,
        prompt: buildGeminiPrompt(input.redactedText, input.privacyWarnings),
        schema: GeminiStartFromCvSchema,
        responseJsonSchema: GEMINI_START_FROM_CV_JSON_SCHEMA,
        maxOutputTokens: 1800,
        temperature: 0,
        usage: {
          userId: input.userId,
          entityType: 'start_from_cv_import_session',
          entityId: input.sessionId,
          inputHash: hashAiContent(input.redactedText),
          sanitizedInputChars: input.redactedText.length,
          redactionSummary: {
            privacyWarningCount: input.privacyWarnings.length,
          },
          safeMetadata: {
            prompt_version: START_FROM_CV_PROMPT_VERSION,
            source_type: 'cv',
          },
          bypassCache: true,
        },
      });
      const merged = StartFromCvDraftOutputSchema.parse({
        ...result.data,
        importSessionId: input.sessionId,
        extractionStatus: input.extractionStatus,
        privacyWarnings: [...input.privacyWarnings, ...result.data.privacyWarnings].slice(0, 12),
        discardedUnsafeItems: [
          ...input.discardedUnsafeItems,
          ...result.data.discardedUnsafeItems,
        ].slice(0, 12),
        modelUsed: result.model,
        ocrProviderUsed: input.ocrProviderUsed,
        requiresUserReview: true,
      });
      assertNoForbiddenDraftLanguage(merged);
      return merged;
    } catch (error) {
      if (!(error instanceof AiProviderError)) {
        throw error;
      }
    }
  }

  return buildDeterministicDrafts({
    importSessionId: input.sessionId,
    text: input.redactedText,
    extractionStatus: input.extractionStatus,
    privacyWarnings: input.privacyWarnings,
    discardedUnsafeItems: input.discardedUnsafeItems,
    ocrProviderUsed: input.ocrProviderUsed,
  });
}

function buildGeminiPrompt(text: string, privacyWarnings: string[]) {
  return [
    'You are Proofound Start from CV.',
    'Convert a user-owned CV into private editable drafts only.',
    'Do not score, rank, shortlist, match, recommend roles, infer candidate quality, infer seniority as fact, verify, or publish.',
    'Unsupported skills must be unsupported_draft, require proof, require user confirmation, and give no trust, matching, or verification lift.',
    'Use source snippet references, not full raw text. Keep organization and institution labels private by default.',
    'Return JSON only matching the schema.',
    '',
    `Privacy warning count: ${privacyWarnings.length}`,
    'Redacted CV text:',
    text.slice(0, 6000),
  ].join('\n');
}

export function buildDeterministicDrafts(input: {
  importSessionId: string;
  text: string;
  extractionStatus: string;
  privacyWarnings: string[];
  discardedUnsafeItems: string[];
  ocrProviderUsed: string | null;
}): StartFromCvDraftOutput {
  const lines = input.text
    .split(/[\n.;•]+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(isHumanReadableCvLine)
    .slice(0, 80);
  const contextLines = attachFollowingDateLines(lines);

  const workLines = contextLines.filter(
    (line) =>
      !isDateOnlyLine(line) &&
      /(?: at | - | – ).*(?:20\d{2}|19\d{2}|present|current|engineer|manager|lead|designer|developer|consultant|specialist|associate|advisor|accountant|analyst|assurance|audit)/i.test(
        line
      )
  );
  const educationLines = lines.filter((line) =>
    /\b(?:university|school|college|bootcamp|academy|msc|bsc|ba|ma|degree|diploma)\b/i.test(line)
  );
  const volunteeringLines = lines.filter((line) =>
    /\b(?:volunteer|volunteering|mentor|community|nonprofit|ngo|club)\b/i.test(line)
  );
  const skillLabels = extractSkillLabels(lines);

  const hasUsefulDraftSignal =
    workLines.length > 0 ||
    educationLines.length > 0 ||
    volunteeringLines.length > 0 ||
    skillLabels.length > 0;

  if (!hasUsefulDraftSignal) {
    return emptyDraftPayload('manual_fallback', {
      importSessionId: input.importSessionId,
      privacyWarnings: [
        ...input.privacyWarnings,
        'Readable CV text was too noisy to create useful drafts. Continue manually or upload a clearer PDF/image.',
      ].slice(0, 12),
      discardedUnsafeItems: input.discardedUnsafeItems,
      ocrProviderUsed: input.ocrProviderUsed,
    });
  }

  const workContextDrafts = workLines.slice(0, 6).map((line) => {
    const parsed = parseContextLine(line);
    return StartFromCvWorkDraftSchema.parse({
      id: `work_${randomUUID()}`,
      organizationLabel: parsed.organization,
      roleTitle: parsed.title,
      approximateDates: parsed.dates,
      shortContextSummary: line.slice(0, 500),
      possibleProjectOutcomeCandidates: extractOutcomeHints(line),
      confidence: parsed.title || parsed.organization ? 'medium' : 'low',
      sourceSnippetReference: snippetReference(line),
      visibility: 'private',
    });
  });

  const educationContextDrafts = educationLines.slice(0, 4).map((line) =>
    StartFromCvEducationDraftSchema.parse({
      id: `edu_${randomUUID()}`,
      institutionLabel: parseContextLine(line).organization,
      programTitle: parseContextLine(line).title || line.slice(0, 120),
      approximateDates: extractDates(line),
      learningProjectHints: extractOutcomeHints(line),
      visibility: 'private',
    })
  );

  const volunteeringContextDrafts = volunteeringLines.slice(0, 4).map((line) =>
    StartFromCvVolunteeringDraftSchema.parse({
      id: `vol_${randomUUID()}`,
      organizationLabel: parseContextLine(line).organization,
      roleTitle: parseContextLine(line).title || line.slice(0, 120),
      approximateDates: extractDates(line),
      contributionSummary: line.slice(0, 500),
      visibility: 'private',
    })
  );

  const anchorLines = [...workLines, ...educationLines, ...volunteeringLines].slice(0, 6);
  const proofPackIdeaDrafts = anchorLines.map((line) =>
    StartFromCvProofPackIdeaDraftSchema.parse({
      id: `proof_${randomUUID()}`,
      titleSuggestion: `Draft proof idea: ${line.slice(0, 80)}`,
      possibleClaim: 'Possible claim from CV context. Rewrite in first person before keeping.',
      possibleAnchorContext: snippetReference(line),
      possibleOutcome: extractOutcomeHints(line)[0] ?? null,
      missingEvidenceWarning: 'Missing proof: attach real evidence before this gains trust value.',
      privacyWarning: 'Review private details before turning this into a Proof Pack.',
      status: 'draft_only',
    })
  );

  const artifactLinkDrafts =
    input.text.includes('[redacted url]') && anchorLines.length > 0
      ? [
          StartFromCvArtifactLinkDraftSchema.parse({
            id: `artifact_${randomUUID()}`,
            label: 'Possible CV-mentioned link',
            sourceContext: 'A URL was redacted from the CV before drafting.',
            status: 'draft_only',
            privacyWarning: 'Re-add only public-safe links you choose to keep.',
          }),
        ]
      : [];

  const unsupportedSkillDrafts = skillLabels.slice(0, 16).map((skill) =>
    StartFromCvUnsupportedSkillDraftSchema.parse({
      id: `skill_${randomUUID()}`,
      skillLabel: skill,
      sourceContext: 'Mentioned in redacted CV text.',
      status: 'unsupported_draft',
      requiresProof: true,
      requiresUserConfirmation: true,
      noTrustLift: true,
      noMatchingLift: true,
      noVerificationState: true,
    })
  );

  return StartFromCvDraftOutputSchema.parse({
    importSessionId: input.importSessionId,
    sourceType: 'cv',
    extractionStatus: input.extractionStatus,
    privacyWarnings: input.privacyWarnings,
    workContextDrafts,
    educationContextDrafts,
    volunteeringContextDrafts,
    proofPackIdeaDrafts,
    artifactLinkDrafts,
    unsupportedSkillDrafts,
    discardedUnsafeItems: input.discardedUnsafeItems,
    modelUsed: null,
    ocrProviderUsed: input.ocrProviderUsed,
    requiresUserReview: true,
  });
}

function parseContextLine(line: string): {
  title: string | null;
  organization: string | null;
  dates: string | null;
} {
  const dates = extractDates(line);
  const withoutDates = stripCvSectionLabels(dates ? line.replace(dates, '').trim() : line);
  const atParts = withoutDates.split(/\s+at\s+/i);
  if (atParts.length >= 2) {
    return {
      title: cleanLabel(atParts[0]),
      organization: cleanLabel(atParts.slice(1).join(' at ')),
      dates,
    };
  }
  const dashParts = withoutDates.split(/\s[-–—]\s/);
  if (dashParts.length >= 2) {
    const left = cleanLabel(dashParts[0]);
    const right = dashParts.slice(1).join(' - ');
    const roleTitle = extractRoleTitle(right);
    if (left && roleTitle) {
      return {
        title: roleTitle,
        organization: left,
        dates,
      };
    }
    return {
      title: cleanLabel(dashParts[0]),
      organization: cleanLabel(dashParts[1]),
      dates,
    };
  }
  return {
    title: extractRoleTitle(withoutDates) ?? cleanLabel(withoutDates),
    organization: null,
    dates,
  };
}

function extractDates(line: string): string | null {
  return (
    line.match(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?:19|20)\d{2}\s*(?:[-–—]|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:(?:19|20)\d{2}|present|current|now)\b/i
    )?.[0] ??
    line.match(
      /\b(?:19|20)\d{2}\s*(?:[-–—]|to)\s*(?:(?:19|20)\d{2}|present|current|now)\b/i
    )?.[0] ??
    line.match(/\b(?:19|20)\d{2}\b/)?.[0] ??
    null
  );
}

function isDateOnlyLine(line: string): boolean {
  const dates = extractDates(line);
  return Boolean(dates && line.replace(dates, '').replace(/[-–—]/g, '').trim().length === 0);
}

function stripCvSectionLabels(value: string): string {
  return value
    .replace(/^.*\bEXPERIENCE\b\s*/i, '')
    .replace(
      /\b(?:CORE SKILLS|EXPERIENCE|EDUCATION|CERTIFICATIONS? & TRAINING|TOOLS|SELECTED ANALYTICS & AUTOMATION IMPACT)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRoleTitle(value: string): string | null {
  return cleanLabel(value.match(ROLE_TITLE_PATTERN)?.[0]);
}

function attachFollowingDateLines(lines: string[]): string[] {
  return lines.map((line, index) => {
    if (extractDates(line)) {
      return line;
    }
    const next = lines[index + 1];
    return next && extractDates(next) ? `${line} ${next}` : line;
  });
}

function cleanLabel(value: string | undefined): string | null {
  const cleaned = value
    ?.replace(/^[,;:-]+|[,;:-]+$/g, '')
    .trim()
    .slice(0, 160);
  return cleaned && cleaned.length >= 2 ? cleaned : null;
}

function isHumanReadableCvLine(line: string): boolean {
  if (line.length < 6 || line.length > 240) {
    return false;
  }

  const withoutRedactions = line.replace(REDACTION_PLACEHOLDER_PATTERN, ' ');
  const letters = withoutRedactions.match(/[A-Za-zÅÄÖåäö]/g)?.length ?? 0;
  const digits = withoutRedactions.match(/\d/g)?.length ?? 0;
  const symbols = withoutRedactions.match(/[^A-Za-zÅÄÖåäö0-9\s,.'()+/#:&-]/g)?.length ?? 0;
  const words = withoutRedactions.match(/[A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö'+-]{1,}/g) ?? [];

  if (letters < 8 || words.length < 2) {
    return false;
  }
  if (symbols > Math.max(2, Math.floor(line.length * 0.08))) {
    return false;
  }
  if (digits > letters && !extractDates(line)) {
    return false;
  }
  if (extractDates(line)) {
    return true;
  }

  return CV_ANCHOR_WORD_PATTERN.test(withoutRedactions) || SKILL_SECTION_PATTERN.test(line);
}

function extractOutcomeHints(line: string): string[] {
  const hints = line
    .split(/\b(?:built|led|improved|reduced|increased|launched|created|delivered|managed)\b/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 12)
    .map((item) => item.slice(0, 220));
  return [...new Set(hints)].slice(0, 3);
}

function snippetReference(line: string): string {
  return `Snippet: ${line.slice(0, 180)}`;
}

function extractSkillLabels(lines: string[]): string[] {
  const coreSkillsIndex = lines.findIndex((line) => /\bCORE SKILLS\b/i.test(line));
  const experienceIndex = lines.findIndex(
    (line, index) => index > coreSkillsIndex && /\bEXPERIENCE\b/i.test(line)
  );
  const coreSkillLines =
    coreSkillsIndex >= 0
      ? lines
          .slice(
            coreSkillsIndex,
            experienceIndex > coreSkillsIndex ? experienceIndex + 1 : coreSkillsIndex + 12
          )
          .flatMap((line) => line.split(/\bEXPERIENCE\b/i).slice(0, 1))
      : lines.filter((line) => SKILL_SECTION_PATTERN.test(line));

  const candidates = coreSkillLines
    .flatMap((line) =>
      stripCvSectionLabels(line)
        .replace(/\b(?:skills?|tools?|technologies?|stack|competencies)\b\s*[:;-]?/gi, '')
        .split(/[,|/]/)
    )
    .map((item) => item.trim())
    .filter(isPlausibleSkillLabel);
  return [...new Set(candidates)].slice(0, 20);
}

function isPlausibleSkillLabel(value: string): boolean {
  if (!/^[A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö0-9 +#.-]{1,40}$/.test(value)) {
    return false;
  }
  if (!/[aeiouyåäö]/i.test(value)) {
    return false;
  }
  if (/[#.-].*[#.-]/.test(value) && !/\b(?:c#|f#|node\.js|next\.js|vue\.js)\b/i.test(value)) {
    return false;
  }
  if (
    /\b(?:email|phone|street|university|school|present|redacted|mentioned|snippet)\b/i.test(value)
  ) {
    return false;
  }
  if (/[A-Z]{2,}[a-z][A-Z]|[a-z][A-Z]{2,}/.test(value)) {
    return false;
  }
  return true;
}

function emptyDraftPayload(
  extractionStatus: string,
  overrides: Partial<StartFromCvDraftOutput> = {}
): StartFromCvDraftOutput {
  return StartFromCvDraftOutputSchema.parse({
    importSessionId: overrides.importSessionId ?? '00000000-0000-4000-8000-000000000000',
    sourceType: 'cv',
    extractionStatus,
    privacyWarnings: [],
    workContextDrafts: [],
    educationContextDrafts: [],
    volunteeringContextDrafts: [],
    proofPackIdeaDrafts: [],
    artifactLinkDrafts: [],
    unsupportedSkillDrafts: [],
    discardedUnsafeItems: [],
    modelUsed: null,
    ocrProviderUsed: null,
    requiresUserReview: true,
    ...overrides,
  });
}

function assertNoForbiddenDraftLanguage(output: StartFromCvDraftOutput) {
  const serialized = JSON.stringify(output);
  if (FORBIDDEN_OUTPUT_PATTERN.test(serialized)) {
    throw new AiProviderError(
      'Start from CV output contained forbidden evaluation language.',
      'validation_failed',
      502,
      false
    );
  }
}

async function recordStartFromCvUsage(input: {
  requestId: string;
  userId: string;
  sessionId: string;
  inputHash: string;
  modelUsed: string | null;
  ocrProviderUsed: string | null;
  pageCount: number;
  redactionSummary: Record<string, number>;
  status: 'success' | 'failed';
}): Promise<string | null> {
  try {
    const id = await createAiUsageLog({
      requestId: input.requestId,
      idempotencyKey: input.sessionId,
      userId: input.userId,
      feature: START_FROM_CV_FEATURE,
      entityType: 'start_from_cv_import_session',
      entityId: input.sessionId,
      model: input.modelUsed,
      promptVersion: START_FROM_CV_PROMPT_VERSION,
      inputHash: input.inputHash,
      status: input.status,
      providerStatus: input.modelUsed ? 'provider_success' : 'deterministic_fallback',
      redactionSummary: input.redactionSummary,
      safeMetadata: {
        import_session_id: input.sessionId,
        source_type: 'cv',
        ocr_provider: input.ocrProviderUsed,
        page_count: input.pageCount,
        estimated_cost_ore: 0,
      },
    });
    await updateAiUsageLog(id, {
      status: input.status,
      providerStatus: input.modelUsed ? 'provider_success' : 'deterministic_fallback',
      model: input.modelUsed,
      safeMetadata: {
        import_session_id: input.sessionId,
        source_type: 'cv',
        ocr_provider: input.ocrProviderUsed,
        page_count: input.pageCount,
      },
    });
    return id;
  } catch {
    return null;
  }
}

async function loadOwnedSession(sessionId: string, userId: string) {
  const rows = await db
    .select()
    .from(startFromCvImportSessions)
    .where(
      and(eq(startFromCvImportSessions.id, sessionId), eq(startFromCvImportSessions.userId, userId))
    )
    .limit(1);
  return rows[0] ?? null;
}

async function updateSessionAfterExtraction(input: {
  sessionId: string;
  userId: string;
  status: 'manual_fallback' | 'ready_for_review';
  extractionStatus: string;
  draftPayload: StartFromCvDraftOutput;
  fileMimeType: string;
  fileSizeBytes: number;
  pageCount: number;
  textHash: string | null;
  redactionSummary: Record<string, number>;
  ocrProviderUsed: string | null;
  modelUsed: string | null;
  sourceDeletedAt: Date | null;
  discardedUnsafeItems: string[];
  usageLogId?: string | null;
}) {
  await db
    .update(startFromCvImportSessions)
    .set({
      status: input.status,
      extractionStatus: input.extractionStatus,
      draftPayload: input.draftPayload,
      privacyWarnings: input.draftPayload.privacyWarnings,
      discardedUnsafeItems: input.discardedUnsafeItems,
      fileMimeType: input.fileMimeType,
      fileSizeBytes: input.fileSizeBytes,
      pageCount: input.pageCount,
      extractedTextHash: input.textHash,
      redactionSummary: input.redactionSummary,
      ocrProviderUsed: input.ocrProviderUsed,
      modelUsed: input.modelUsed,
      sourceDeletedAt: input.sourceDeletedAt,
      usageLogId: input.usageLogId ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(startFromCvImportSessions.id, input.sessionId),
        eq(startFromCvImportSessions.userId, input.userId),
        isNull(startFromCvImportSessions.deletedAt)
      )
    );
}

function sessionResponseFromRow(
  row: NonNullable<Awaited<ReturnType<typeof loadOwnedSession>>>
): StartFromCvDraftOutput & {
  status: string;
  limits: {
    maxFileSizeMb: number;
    maxPages: number;
    allowedMimeTypes: string[];
  };
  sourceDeletedAt: Date | null;
} {
  const payload = StartFromCvDraftOutputSchema.parse({
    ...emptyDraftPayload(row.extractionStatus, {
      importSessionId: row.id,
    }),
    ...(row.draftPayload && typeof row.draftPayload === 'object' ? row.draftPayload : {}),
    importSessionId: row.id,
    extractionStatus: row.extractionStatus,
    privacyWarnings: Array.isArray(row.privacyWarnings) ? row.privacyWarnings : [],
    discardedUnsafeItems: Array.isArray(row.discardedUnsafeItems) ? row.discardedUnsafeItems : [],
    modelUsed: row.modelUsed,
    ocrProviderUsed: row.ocrProviderUsed,
    requiresUserReview: true,
  });
  const config = resolveStartFromCvConfig();
  return {
    ...payload,
    status: row.status,
    limits: {
      maxFileSizeMb: config.maxFileSizeMb,
      maxPages: config.maxPages,
      allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
    },
    sourceDeletedAt: row.sourceDeletedAt,
  };
}
