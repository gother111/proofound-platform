import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { requireApiAuthContext } from '@/lib/auth';
import {
  resolveStartFromCvConfig,
  StartFromCvError,
  type StartFromCvEligibilityContext,
  type StartFromCvUploadedFile,
} from '@/lib/ai/start-from-cv';
import { and, eq } from 'drizzle-orm';

const MULTIPART_UPLOAD_OVERHEAD_BYTES = 64 * 1024;
const JSON_BASE64_UPLOAD_OVERHEAD_BYTES = 64 * 1024;
const BASE64_ENCODED_SIZE_RATIO = 4 / 3;

export async function requireStartFromCvRouteContext(): Promise<
  | {
      auth: NonNullable<Awaited<ReturnType<typeof requireApiAuthContext>>>;
      betaContext: StartFromCvEligibilityContext;
    }
  | NextResponse
> {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memberships = await db
    .select({ orgId: organizationMembers.orgId })
    .from(organizationMembers)
    .where(
      and(eq(organizationMembers.userId, auth.user.id), eq(organizationMembers.state, 'active'))
    );

  return {
    auth,
    betaContext: {
      userId: auth.user.id,
      persona: auth.user.persona,
      isBetaTesting: auth.user.isBetaTesting,
      orgIds: memberships.map((membership) => membership.orgId),
    },
  };
}

const JsonFileSchema = z
  .object({
    name: z.string().max(260).optional(),
    type: z.string().min(1).max(120),
    base64: z.string().min(1),
  })
  .strict();

function parseContentLength(value: string | null | undefined) {
  if (!value || !/^\d+$/.test(value.trim())) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function rejectOversizedStartFromCvRequest(request: NextRequest): NextResponse | null {
  const contentLength = parseContentLength(request.headers.get('content-length'));
  if (contentLength === null) {
    return null;
  }

  const contentType = request.headers.get('content-type') || '';
  const maxFileSizeBytes = resolveStartFromCvConfig().maxFileSizeBytes;
  const maxRequestBytes = contentType.includes('application/json')
    ? Math.ceil(maxFileSizeBytes * BASE64_ENCODED_SIZE_RATIO) + JSON_BASE64_UPLOAD_OVERHEAD_BYTES
    : maxFileSizeBytes + MULTIPART_UPLOAD_OVERHEAD_BYTES;

  if (contentLength <= maxRequestBytes) {
    return null;
  }

  return startFromCvErrorResponse(new StartFromCvError('FILE_TOO_LARGE', 413));
}

export async function parseStartFromCvFile(request: NextRequest): Promise<StartFromCvUploadedFile> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new StartFromCvError('FILE_REQUIRED', 400);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      bytes,
    };
  }

  const parsed = JsonFileSchema.parse((await request.json()).file);
  const bytes = new Uint8Array(Buffer.from(parsed.base64, 'base64'));
  return {
    name: parsed.name ?? null,
    type: parsed.type,
    size: bytes.byteLength,
    bytes,
  };
}

export function startFromCvErrorResponse(error: StartFromCvError) {
  return NextResponse.json({ error: safeStartFromCvMessage(error.code) }, { status: error.status });
}

export function safeStartFromCvMessage(code: string) {
  switch (code) {
    case 'START_FROM_CV_DISABLED':
      return 'Start from CV is not available.';
    case 'START_FROM_CV_APPROVED_SCAFFOLDING_REQUIRED':
      return 'Start from CV is archived unless enabled for approved private first-proof scaffolding.';
    case 'BROWSER_CV_OCR_MUST_STAY_DISABLED':
      return 'Start from CV is not available while browser OCR is enabled.';
    case 'START_FROM_CV_NOT_INVITED':
      return 'Start from CV beta is not available for this account.';
    case 'INDIVIDUAL_ONLY':
      return 'Start from CV is available for individual profiles only.';
    case 'CONSENT_REQUIRED':
      return 'Explicit consent is required before CV processing.';
    case 'UNSUPPORTED_MIME_TYPE':
      return 'Start from CV supports PDF, PNG, and JPG/JPEG files only.';
    case 'FILE_TOO_LARGE':
      return 'Start from CV supports files up to the configured size limit.';
    case 'TOO_MANY_PAGES':
      return 'Start from CV supports CV PDFs up to the configured page limit.';
    case 'USER_DAILY_LIMIT_EXCEEDED':
    case 'GLOBAL_DAILY_LIMIT_EXCEEDED':
      return 'Start from CV is temporarily rate limited.';
    case 'FILE_REQUIRED':
      return 'Upload a CV file before extraction.';
    default:
      return 'Start from CV is not available.';
  }
}

export function handleStartFromCvRouteError(error: unknown, event: string) {
  if (error instanceof z.ZodError) {
    return safeValidationErrorResponse({
      error,
      message: 'Invalid Start from CV request',
    });
  }
  if (error instanceof StartFromCvError) {
    return startFromCvErrorResponse(error);
  }
  return safeApiErrorResponse({
    event,
    error,
    publicMessage: 'Start from CV failed',
  });
}
