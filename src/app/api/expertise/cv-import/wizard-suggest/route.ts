import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import {
  createRequestId,
  enforceCvImportUserRateLimit,
  jsonWithRequestId,
  resolveCvImportEngineMode,
} from '@/lib/expertise/cv-import-runtime';
import { resolveCvImportMaxDocuments } from '@/lib/expertise/cv-import-wizard-extract';
import { suggestWizardForDocuments } from '@/lib/expertise/cv-import-wizard-extractor';

export const dynamic = 'force-dynamic';

const DEFAULT_MAX_CHARS_PER_DOCUMENT = 30_000;
const DEFAULT_MAX_TOTAL_CHARS = 90_000;

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request);
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return jsonWithRequestId(requestId, { error: 'Unauthorized' }, 401);
  }

  const rateLimit = enforceCvImportUserRateLimit({
    userId: authContext.user.id,
    route: 'wizard-suggest',
  });
  if (!rateLimit.allowed) {
    return jsonWithRequestId(
      requestId,
      { error: 'Too many CV imports. Please wait before trying again.' },
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) }
    );
  }

  try {
    const engineMode = resolveCvImportEngineMode(request);
    const payload = await request.json();
    const response = await suggestWizardForDocuments(
      payload,
      {
        maxDocuments: resolveCvImportMaxDocuments(),
        maxCharsPerDocument: DEFAULT_MAX_CHARS_PER_DOCUMENT,
        maxTotalChars: DEFAULT_MAX_TOTAL_CHARS,
      },
      {
        semanticEnabled: engineMode === 'gemini' || engineMode === 'auto',
        skillSuggestionMode: engineMode === 'typescript' ? 'deterministic' : 'deterministic',
      }
    );

    return jsonWithRequestId(requestId, {
      ...response,
      metadata: {
        ...response.metadata,
        engine_mode: engineMode,
        engine_used: 'typescript',
      },
    });
  } catch (error) {
    return jsonWithRequestId(
      requestId,
      {
        error: 'Failed to process CV wizard suggestions',
        message: error instanceof Error ? error.message : 'Unknown CV import error.',
      },
      400
    );
  }
}
