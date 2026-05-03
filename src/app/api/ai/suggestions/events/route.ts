import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recordSuggestionEvent } from '@/lib/ai/usage-ledger';
import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';

export const dynamic = 'force-dynamic';

const FieldMetadataSchema = z
  .object({
    field: z.string().trim().min(1).max(120),
    edited: z.boolean().optional(),
    applied: z.boolean().optional(),
  })
  .strict();

const SuggestionEventRequestSchema = z
  .object({
    suggestionId: z.string().uuid(),
    eventType: z.enum(['viewed', 'accepted', 'edited', 'dismissed', 'published']),
    field: z.string().trim().min(1).max(120).optional(),
    fields: z.array(FieldMetadataSchema).max(30).optional(),
    metadata: z
      .object({
        source: z.string().trim().max(80).optional(),
        uiSurface: z.string().trim().max(120).optional(),
      })
      .optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const payload = SuggestionEventRequestSchema.parse(body);
    const fields =
      payload.fields ??
      (payload.field
        ? [
            {
              field: payload.field,
              edited: payload.eventType === 'edited' ? true : undefined,
              applied: payload.eventType === 'accepted' ? true : undefined,
            },
          ]
        : []);

    await recordSuggestionEvent({
      cacheId: payload.suggestionId,
      eventType: payload.eventType,
      userId: authContext.user.id,
      safeMetadata: {
        source: payload.metadata?.source,
        ui_surface: payload.metadata?.uiSurface,
        field_count: fields.length,
        fields,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: error.issues[0]?.message || 'Invalid suggestion event request.',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'AI_SUGGESTION_CACHE_FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    log.error('ai_suggestion_event.failed', {
      error: sanitizeErrorForLog(error),
    });
    return NextResponse.json({ error: 'Failed to record suggestion event' }, { status: 500 });
  }
}
