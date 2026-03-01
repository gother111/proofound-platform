import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { suggestWizardForDocuments } from '@/lib/expertise/cv-import-wizard-extractor';
import { proxyCvRequestToPython } from '@/lib/expertise/python-cv-proxy';
import {
  CvImportWizardSuggestRequestSchema,
  type CvImportWizardSuggestRequest,
} from '@/lib/expertise/cv-import-wizard-types';
import type { CvImportLimits } from '@/lib/expertise/cv-import-suggest';

const DEFAULT_LIMITS: CvImportLimits = {
  maxDocuments: 5,
  maxCharsPerDocument: 30000,
  maxTotalChars: 90000,
};

const DEFAULT_SERVER_TIMEOUT_MS = 7000;
const GENERIC_WIZARD_ERROR = 'Failed to process CV wizard suggestions';
const WIZARD_DEPENDENCY_UNAVAILABLE_CODE = 'WIZARD_DEPENDENCY_UNAVAILABLE';
const WIZARD_PROCESSING_FAILED_CODE = 'WIZARD_PROCESSING_FAILED';
type CvImportEngineMode = 'auto' | 'typescript' | 'python';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function resolveEngineMode(request: NextRequest): CvImportEngineMode {
  const queryMode = request.nextUrl.searchParams.get('engine')?.trim().toLowerCase();
  if (queryMode === 'python' || queryMode === 'typescript' || queryMode === 'auto') {
    return queryMode;
  }

  const rawMode = process.env.CV_IMPORT_ENGINE_MODE?.trim().toLowerCase();
  if (rawMode === 'python' || rawMode === 'typescript' || rawMode === 'auto') {
    return rawMode;
  }
  return 'auto';
}

function shouldProxyToPython(contentType: string, mode: CvImportEngineMode): boolean {
  if (contentType.startsWith('multipart/form-data')) {
    return true;
  }
  if (mode === 'python') {
    return true;
  }
  if (mode === 'typescript') {
    return false;
  }
  return process.env.CV_IMPORT_FORCE_PYTHON === 'true';
}

async function attachEngineMetadata(
  response: NextResponse,
  mode: CvImportEngineMode,
  engineUsed: 'python' | 'typescript'
): Promise<NextResponse> {
  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object') {
      const withMetadata = payload as Record<string, unknown>;
      const existingMetadata =
        withMetadata.metadata && typeof withMetadata.metadata === 'object'
          ? (withMetadata.metadata as Record<string, unknown>)
          : {};

      withMetadata.metadata = {
        ...existingMetadata,
        engine_mode: mode,
        engine_used: engineUsed,
      };
      return NextResponse.json(withMetadata, { status: response.status });
    }
  } catch {
    // Preserve original response when body is not JSON.
  }
  return response;
}

function isDependencyUnavailableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  const dependencyIndicators = [
    'skills_taxonomy',
    'relation',
    'column',
    'does not exist',
    'connection terminated',
    'connection refused',
    'timeout expired',
    'database',
    'econnrefused',
    'etimedout',
    'enotfound',
    'ehostunreach',
    'server closed the connection unexpectedly',
  ];

  return dependencyIndicators.some((indicator) => message.includes(indicator));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const timeoutMs = parsePositiveInt(
      process.env.CV_IMPORT_SERVER_TIMEOUT_MS,
      DEFAULT_SERVER_TIMEOUT_MS
    );
    const contentType = request.headers.get('content-type') || '';
    const engineMode = resolveEngineMode(request);
    const proxyToPython = shouldProxyToPython(contentType, engineMode);

    if (proxyToPython) {
      try {
        const response = await proxyCvRequestToPython(request, '/wizard-suggest', timeoutMs);
        return await attachEngineMetadata(response, engineMode, 'python');
      } catch (error) {
        if (error instanceof Error && error.message.includes('timed out')) {
          return NextResponse.json(
            {
              error: 'CV wizard processing timed out',
              message: 'Try fewer documents or shorter CV content.',
            },
            { status: 408 }
          );
        }

        return NextResponse.json(
          {
            error: GENERIC_WIZARD_ERROR,
            message: 'Python CV service is temporarily unavailable. Please retry shortly.',
            code: WIZARD_DEPENDENCY_UNAVAILABLE_CODE,
          },
          { status: 503 }
        );
      }
    }

    const payload = CvImportWizardSuggestRequestSchema.parse(
      (await request.json()) as CvImportWizardSuggestRequest
    );

    const limits: CvImportLimits = {
      maxDocuments: parsePositiveInt(
        process.env.CV_IMPORT_MAX_DOCUMENTS,
        DEFAULT_LIMITS.maxDocuments
      ),
      maxCharsPerDocument: parsePositiveInt(
        process.env.CV_IMPORT_MAX_CHARS_PER_DOCUMENT,
        DEFAULT_LIMITS.maxCharsPerDocument
      ),
      maxTotalChars: parsePositiveInt(
        process.env.CV_IMPORT_MAX_TOTAL_CHARS,
        DEFAULT_LIMITS.maxTotalChars
      ),
    };

    const semanticEnabled = process.env.CV_IMPORT_SEMANTIC_ENABLED !== 'false';

    const response = await withTimeout(
      suggestWizardForDocuments(payload, limits, {
        semanticEnabled,
        suggestionsLimit: payload.suggestions_limit,
      }),
      timeoutMs
    );

    const responseWithEngine = {
      ...response,
      metadata: {
        ...response.metadata,
        engine_mode: engineMode,
        engine_used: 'typescript' as const,
      },
    };

    return NextResponse.json(responseWithEngine);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Too many documents')) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }

    if (error instanceof Error && error.message.includes('exceeds max size')) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }

    if (error instanceof Error && error.message.includes('Total payload too large')) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }

    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        {
          error: 'CV wizard processing timed out',
          message: 'Try fewer documents or shorter CV content.',
        },
        { status: 408 }
      );
    }

    if (error instanceof Error && error.message.includes('CV context')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && isDependencyUnavailableError(error)) {
      return NextResponse.json(
        {
          error: GENERIC_WIZARD_ERROR,
          message:
            'CV wizard dependencies are temporarily unavailable. Please retry in a few minutes.',
          code: WIZARD_DEPENDENCY_UNAVAILABLE_CODE,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: GENERIC_WIZARD_ERROR,
        message:
          error instanceof Error && error.message.trim().length > 0
            ? `CV wizard processing failed: ${error.message}`
            : 'CV wizard processing failed due to an unknown error. Please retry.',
        code: WIZARD_PROCESSING_FAILED_CODE,
      },
      { status: 500 }
    );
  }
}
