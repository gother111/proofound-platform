import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import {
  CvImportSuggestRequestSchema,
  suggestSkillsForDocuments,
  type CvImportLimits,
} from '@/lib/expertise/cv-import-suggest';

const DEFAULT_LIMITS: CvImportLimits = {
  maxDocuments: 5,
  maxCharsPerDocument: 30000,
  maxTotalChars: 90000,
};

const DEFAULT_SERVER_TIMEOUT_MS = 6000;

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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = CvImportSuggestRequestSchema.parse(await request.json());

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
    const timeoutMs = parsePositiveInt(
      process.env.CV_IMPORT_SERVER_TIMEOUT_MS,
      DEFAULT_SERVER_TIMEOUT_MS
    );

    const response = await withTimeout(
      suggestSkillsForDocuments(payload, limits, {
        semanticEnabled,
      }),
      timeoutMs
    );

    return NextResponse.json(response);
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
          error: 'CV import processing timed out',
          message: 'Try fewer documents or shorter CV content.',
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process CV documents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
