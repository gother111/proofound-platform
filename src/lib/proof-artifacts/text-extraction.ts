import { createHash, randomUUID } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { extractTextFromDocument } from '@/lib/expertise/document-extraction-provider';
import { resolveGcpCvOcrConfig } from '@/lib/expertise/gcp-cv-ocr-config';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { getRows } from '@/lib/db/rows';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordUploadEvent } from '@/lib/uploads/lifecycle';

export const PROOF_ARTIFACT_OCR_FEATURE = 'proof_artifact_text_extraction';
export const PROOF_ARTIFACT_OCR_PROMPT_VERSION = 'proof-artifact-ocr-draft-v1';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_PAGES = 4;
const MAX_PREVIEW_CHARS = 30_000;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const SIGNED_URL_PATTERN =
  /https?:\/\/[^\s"'<>]*(?:x-amz-signature|x-goog-signature|signature=|token=)[^\s"'<>]*/gi;
const STORAGE_PATH_PATTERN =
  /\b(?:gs|s3):\/\/[^\s"'<>]+|\b(?:cv-import-temp|user-uploads-private|proofound-uploads)\/[^\s"'<>]+/gi;
const SECRET_PATTERN =
  /\b(?:api[_-]?key|authorization|bearer|secret|token)\s*[:=]\s*['"]?[^'",\s;}]+/gi;
const SENSITIVE_NUMBER_PATTERN =
  /\b(?:personnummer|ssn|social security|passport|bank account|iban|tax id|national id)\b/i;
const PROTECTED_TRAIT_PATTERN =
  /\b(?:age|birth date|date of birth|gender|religion|ethnicity|nationality|marital status|disability|pregnancy)\b/i;
const RAW_FILENAME_PATTERN = /\b[^\s/\\]+\.(?:pdf|png|jpe?g|docx?|xlsx?|txt|csv)\b/gi;

type EnvReader = Record<string, string | undefined>;

type OcrArtifactRow = {
  artifact_id: string;
  artifact_title: string;
  artifact_kind: string;
  artifact_lifecycle_state: string;
  artifact_visibility: string;
  artifact_reveal_gate: string;
  uploaded_file_id: string;
  owner_id: string;
  detected_mime: string | null;
  size_bytes: number;
  upload_lifecycle_state: string;
  safety_status: string;
  attach_status: string;
  quarantine_bucket: string | null;
  quarantine_path: string | null;
  durable_bucket: string | null;
  durable_path: string | null;
  public_bucket: string | null;
  public_path: string | null;
};

type ProofPackForApplyRow = {
  id: string;
  lifecycle_state: string;
  owner_id: string;
  linked_artifact_id: string | null;
};

export type ProofArtifactOcrEligibilityContext = {
  userId: string;
  userEmail?: string | null;
  orgIds?: string[];
  roles?: string[];
  env?: EnvReader;
};

export type ProofArtifactTextExtractionInput = ProofArtifactOcrEligibilityContext & {
  artifactId: string;
  consentToProcess: true;
  requestId?: string;
};

export type ProofArtifactTextExtractionResult = {
  requestId: string;
  artifactId: string;
  uploadedFileId: string;
  status: 'completed';
  source: 'user_owned_proof_artifact';
  draftOnly: true;
  provider: string;
  pageCount: number;
  confidence: number;
  extractedTextPreview: string;
  textHash: string;
  privacyRiskWarnings: string[];
  suggestedProofPackFieldsDraft: {
    title?: string;
    summary?: string;
    evidenceSummary?: string;
    outcomesSummary?: string;
    ownershipStatement?: string;
  };
  limits: {
    maxFileSizeMb: number;
    maxPages: number;
    allowedMimeTypes: string[];
  };
};

export type ApplyProofArtifactOcrDraftInput = ProofArtifactOcrEligibilityContext & {
  artifactId: string;
  proofPackId: string;
  selectedFields: {
    title?: string;
    summary?: string;
    evidenceSummary?: string;
    outcomesSummary?: string;
    ownershipStatement?: string;
  };
  sourceExtractionRequestId?: string | null;
};

export const ProofArtifactOcrConsentSchema = z
  .object({
    consentToProcess: z.literal(true),
  })
  .strict();

export const ApplyProofArtifactOcrDraftSchema = z
  .object({
    proofPackId: z.string().uuid(),
    sourceExtractionRequestId: z.string().trim().max(128).optional().nullable(),
    selectedFields: z
      .object({
        title: z.string().trim().min(1).max(180).optional(),
        summary: z.string().trim().min(1).max(1200).optional(),
        evidenceSummary: z.string().trim().min(1).max(1200).optional(),
        outcomesSummary: z.string().trim().min(1).max(1200).optional(),
        ownershipStatement: z.string().trim().min(1).max(800).optional(),
      })
      .strict()
      .refine((fields) => Object.keys(fields).length > 0, {
        message: 'At least one selected draft field is required.',
      }),
  })
  .strict();

export async function isProofArtifactOcrEligible(
  context: ProofArtifactOcrEligibilityContext
): Promise<boolean> {
  const env = context.env ?? process.env;
  if (env.PROOF_ARTIFACT_OCR_BETA_ENABLED !== 'true') {
    return false;
  }

  if (env.PROOF_ARTIFACT_OCR_BETA_KILL_SWITCH === 'true') {
    return false;
  }

  if (!resolveGcpCvOcrConfig(env).available) {
    return false;
  }

  return isFeatureEnabled(
    FEATURE_FLAG_KEYS.PROOF_ARTIFACT_OCR_BETA,
    {
      userId: context.userId,
      userEmail: context.userEmail,
      orgIds: context.orgIds ?? [],
      roles: context.roles ?? [],
    },
    false
  );
}

export async function extractProofArtifactText(
  input: ProofArtifactTextExtractionInput
): Promise<ProofArtifactTextExtractionResult> {
  if (input.consentToProcess !== true) {
    throw new ProofArtifactOcrError('CONSENT_REQUIRED', 400);
  }

  const eligible = await isProofArtifactOcrEligible(input);
  if (!eligible) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_OCR_NOT_AVAILABLE', 404);
  }

  const artifact = await loadOwnedOcrArtifact(input.artifactId, input.userId);
  if (!artifact) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_NOT_FOUND', 404);
  }

  const limits = resolveProofArtifactOcrLimits(input.env);
  const mimeType = normalizeOcrMimeType(artifact.detected_mime);
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ProofArtifactOcrError('UNSUPPORTED_PROOF_ARTIFACT_MIME', 400);
  }

  if (artifact.size_bytes > limits.maxFileSizeBytes) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_TOO_LARGE', 400);
  }

  assertUploadCanBeProcessed(artifact);
  const fileBytes = await downloadUploadedFileBytes(artifact);
  const pageCount = countDocumentPages(mimeType, fileBytes);
  if (pageCount > limits.maxPages) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_TOO_MANY_PAGES', 400);
  }

  const requestId = input.requestId ?? `proof_ocr_${randomUUID().replaceAll('-', '')}`;
  const extraction = await extractTextFromDocument(
    {
      requestId,
      userId: input.userId,
      documentId: artifact.artifact_id,
      contentType: mimeType,
      fileBytes,
      metadata: {
        feature: PROOF_ARTIFACT_OCR_FEATURE,
        source: 'user_owned_proof_artifact',
      },
    },
    {
      env: input.env,
    }
  );

  if (extraction.status !== 'completed') {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_OCR_PROVIDER_UNAVAILABLE', 503);
  }

  const preview = sanitizeExtractedText(extraction.text).slice(0, MAX_PREVIEW_CHARS);
  const privacyRiskWarnings = buildPrivacyRiskWarnings(extraction.text);
  const textHash = createHash('sha256').update(preview).digest('hex');

  await recordUploadEvent(artifact.uploaded_file_id, 'metadata_extracted', {
    source: PROOF_ARTIFACT_OCR_FEATURE,
    requestId,
    provider: extraction.provider,
    pageCount,
    textHash,
    warningCount: privacyRiskWarnings.length,
    draftOnly: true,
  });

  return {
    requestId,
    artifactId: artifact.artifact_id,
    uploadedFileId: artifact.uploaded_file_id,
    status: 'completed',
    source: 'user_owned_proof_artifact',
    draftOnly: true,
    provider: extraction.provider,
    pageCount,
    confidence: extraction.confidence,
    extractedTextPreview: preview,
    textHash,
    privacyRiskWarnings,
    suggestedProofPackFieldsDraft: buildSuggestedProofPackFieldsDraft(preview),
    limits: {
      maxFileSizeMb: limits.maxFileSizeMb,
      maxPages: limits.maxPages,
      allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
    },
  };
}

export async function applyProofArtifactOcrDraft(input: ApplyProofArtifactOcrDraftInput) {
  const eligible = await isProofArtifactOcrEligible(input);
  if (!eligible) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_OCR_NOT_AVAILABLE', 404);
  }

  const artifact = await loadOwnedOcrArtifact(input.artifactId, input.userId);
  if (!artifact) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_NOT_FOUND', 404);
  }

  const proofPack = await loadOwnedDraftProofPackForArtifact(
    input.proofPackId,
    input.artifactId,
    input.userId
  );
  if (!proofPack) {
    throw new ProofArtifactOcrError('PROOF_PACK_NOT_FOUND', 404);
  }

  if (proofPack.lifecycle_state !== 'draft') {
    throw new ProofArtifactOcrError('PROOF_PACK_NOT_DRAFT', 409);
  }

  const fields = normalizeSelectedDraftFields(input.selectedFields);
  if (Object.keys(fields).length === 0) {
    throw new ProofArtifactOcrError('NO_DRAFT_FIELDS_SELECTED', 400);
  }

  await db.execute(sql`
    UPDATE proof_packs
    SET
      title = COALESCE(${fields.title ?? null}, title),
      summary = COALESCE(${fields.summary ?? null}, summary),
      evidence_summary = COALESCE(${fields.evidenceSummary ?? null}, evidence_summary),
      outcomes_summary = COALESCE(${fields.outcomesSummary ?? null}, outcomes_summary),
      ownership_statement = COALESCE(${fields.ownershipStatement ?? null}, ownership_statement),
      updated_at = NOW()
    WHERE id = ${proofPack.id}::uuid
      AND owner_type = 'individual_profile'
      AND owner_id = ${input.userId}::uuid
      AND lifecycle_state = 'draft'
  `);

  await db.execute(sql`
    INSERT INTO audit_logs (actor_id, action, target_type, target_id, meta)
    VALUES (
      ${input.userId}::uuid,
      'proof_artifact_ocr.draft_applied',
      'proof_pack',
      ${proofPack.id},
      ${JSON.stringify({
        artifactId: artifact.artifact_id,
        uploadedFileId: artifact.uploaded_file_id,
        sourceExtractionRequestId: input.sourceExtractionRequestId ?? null,
        appliedFields: Object.keys(fields),
        draftOnly: true,
        forbiddenEffects: [
          'auto_publish',
          'auto_verify',
          'auto_score',
          'auto_rank',
          'auto_review_submission',
        ],
      })}::jsonb
    )
  `);

  return {
    ok: true,
    proofPackId: proofPack.id,
    artifactId: artifact.artifact_id,
    appliedFields: Object.keys(fields),
    draftOnly: true,
  };
}

export class ProofArtifactOcrError extends Error {
  constructor(
    readonly code: string,
    readonly status: number
  ) {
    super(code);
    this.name = 'ProofArtifactOcrError';
  }
}

function resolveProofArtifactOcrLimits(env: EnvReader = process.env) {
  const config = resolveGcpCvOcrConfig(env);
  const maxFileSizeMb = Math.min(config.maxFileSizeMb || 5, 5);
  const maxPages = Math.min(config.maxPages || DEFAULT_MAX_PAGES, DEFAULT_MAX_PAGES);

  return {
    maxFileSizeMb,
    maxFileSizeBytes: Math.min(
      config.maxFileSizeBytes || DEFAULT_MAX_FILE_SIZE_BYTES,
      DEFAULT_MAX_FILE_SIZE_BYTES
    ),
    maxPages,
  };
}

async function loadOwnedOcrArtifact(
  artifactId: string,
  userId: string
): Promise<OcrArtifactRow | null> {
  const result = await db.execute(sql`
    SELECT
      pa.id AS artifact_id,
      pa.title AS artifact_title,
      pa.artifact_kind AS artifact_kind,
      pa.lifecycle_state AS artifact_lifecycle_state,
      pa.visibility AS artifact_visibility,
      pa.reveal_gate AS artifact_reveal_gate,
      uf.id AS uploaded_file_id,
      uf.owner_id AS owner_id,
      COALESCE(uf.detected_mime, pa.mime_type) AS detected_mime,
      uf.size_bytes AS size_bytes,
      uf.lifecycle_state AS upload_lifecycle_state,
      uf.safety_status AS safety_status,
      uf.attach_status AS attach_status,
      uf.quarantine_bucket AS quarantine_bucket,
      uf.quarantine_path AS quarantine_path,
      uf.durable_bucket AS durable_bucket,
      uf.durable_path AS durable_path,
      uf.public_bucket AS public_bucket,
      uf.public_path AS public_path
    FROM proof_artifacts pa
    INNER JOIN uploaded_files uf ON uf.id = pa.uploaded_file_id
    WHERE pa.id = ${artifactId}::uuid
      AND pa.owner_type = 'individual_profile'
      AND pa.owner_id = ${userId}::uuid
      AND pa.deleted_at IS NULL
      AND uf.owner_type = 'individual_profile'
      AND uf.owner_id = ${userId}::uuid
      AND uf.deleted_at IS NULL
    LIMIT 1
  `);
  const [row] = getRows<OcrArtifactRow>(result as any);
  return row ?? null;
}

async function loadOwnedDraftProofPackForArtifact(
  proofPackId: string,
  artifactId: string,
  userId: string
): Promise<ProofPackForApplyRow | null> {
  const result = await db.execute(sql`
    SELECT
      pp.id,
      pp.lifecycle_state,
      pp.owner_id,
      ppi.artifact_id AS linked_artifact_id
    FROM proof_packs pp
    INNER JOIN proof_pack_items ppi ON ppi.pack_id = pp.id
    WHERE pp.id = ${proofPackId}::uuid
      AND pp.owner_type = 'individual_profile'
      AND pp.owner_id = ${userId}::uuid
      AND pp.deleted_at IS NULL
      AND ppi.artifact_id = ${artifactId}::uuid
    LIMIT 1
  `);
  const [row] = getRows<ProofPackForApplyRow>(result as any);
  return row ?? null;
}

function normalizeOcrMimeType(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized || null;
}

function assertUploadCanBeProcessed(row: OcrArtifactRow) {
  const allowedLifecycle = new Set(['validated', 'ready_private', 'ready_public']);
  const allowedSafety = new Set(['clean', 'approved_after_manual_review']);
  const allowedAttach = new Set(['attachable', 'attached']);

  if (
    !allowedLifecycle.has(row.upload_lifecycle_state) ||
    !allowedSafety.has(row.safety_status) ||
    !allowedAttach.has(row.attach_status)
  ) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_NOT_PROCESSABLE', 409);
  }
}

async function downloadUploadedFileBytes(row: OcrArtifactRow): Promise<Uint8Array> {
  const source = resolveStorageSource(row);
  if (!source) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_FILE_UNAVAILABLE', 409);
  }

  const admin = createAdminClient();
  const result = await admin.storage.from(source.bucket).download(source.path);
  if (result.error || !result.data) {
    throw new ProofArtifactOcrError('PROOF_ARTIFACT_FILE_UNAVAILABLE', 409);
  }

  return new Uint8Array(await result.data.arrayBuffer());
}

function resolveStorageSource(row: OcrArtifactRow): { bucket: string; path: string } | null {
  if (row.durable_bucket && row.durable_path) {
    return { bucket: row.durable_bucket, path: row.durable_path };
  }
  if (row.quarantine_bucket && row.quarantine_path) {
    return { bucket: row.quarantine_bucket, path: row.quarantine_path };
  }
  if (row.public_bucket && row.public_path) {
    return { bucket: row.public_bucket, path: row.public_path };
  }
  return null;
}

function countDocumentPages(mimeType: string, fileBytes: Uint8Array): number {
  if (mimeType !== 'application/pdf') {
    return 1;
  }
  const pdfText = Buffer.from(fileBytes).toString('latin1');
  return Math.max(1, pdfText.match(/\/Type\s*\/Page\b/g)?.length ?? 0);
}

function sanitizeExtractedText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(SIGNED_URL_PATTERN, '[redacted-url]')
    .replace(STORAGE_PATH_PATTERN, '[redacted-path]')
    .replace(EMAIL_PATTERN, '[redacted-email]')
    .replace(PHONE_PATTERN, '[redacted-phone]')
    .replace(URL_PATTERN, '[redacted-url]')
    .replace(SECRET_PATTERN, '[redacted-secret]')
    .replace(RAW_FILENAME_PATTERN, '[redacted file]')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildPrivacyRiskWarnings(text: string): string[] {
  const warnings = new Set<string>();
  if (EMAIL_PATTERN.test(text)) warnings.add('May contain email addresses.');
  EMAIL_PATTERN.lastIndex = 0;
  if (PHONE_PATTERN.test(text)) warnings.add('May contain phone numbers.');
  PHONE_PATTERN.lastIndex = 0;
  if (URL_PATTERN.test(text)) warnings.add('May contain external links.');
  URL_PATTERN.lastIndex = 0;
  if (SENSITIVE_NUMBER_PATTERN.test(text)) {
    warnings.add('May contain government, tax, bank, or identity document details.');
  }
  if (PROTECTED_TRAIT_PATTERN.test(text)) {
    warnings.add('May contain protected-trait or identity-bearing information.');
  }
  if (text.length > 10_000) {
    warnings.add('Long extracted text should be reviewed carefully before reuse.');
  }

  warnings.add('Review the extracted text manually before copying it into a Proof Pack.');
  return Array.from(warnings).slice(0, 8);
}

function buildSuggestedProofPackFieldsDraft(
  text: string
): ProofArtifactTextExtractionResult['suggestedProofPackFieldsDraft'] {
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 8 && line.length <= 240);
  const firstLine = lines[0];
  const paragraph = lines.slice(0, 5).join(' ').slice(0, 900);

  return {
    ...(firstLine ? { title: firstLine.slice(0, 180) } : {}),
    ...(paragraph ? { summary: paragraph } : {}),
    ...(paragraph ? { evidenceSummary: paragraph } : {}),
    ownershipStatement:
      'Draft from OCR preview. Confirm what you personally did before keeping this field.',
  };
}

function normalizeSelectedDraftFields(input: ApplyProofArtifactOcrDraftInput['selectedFields']) {
  const entries = Object.entries(input)
    .map(([key, value]) => [key, value?.trim()])
    .filter((entry): entry is [string, string] => Boolean(entry[1]));

  return Object.fromEntries(entries) as ApplyProofArtifactOcrDraftInput['selectedFields'];
}
