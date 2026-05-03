import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  PrivacyPreflightRequestSchema,
  type PrivacyPreflightRequest,
  runPrivacyPreflightCheck,
} from '@/lib/ai/privacy-preflight';
import { requireApiAuthContext } from '@/lib/auth';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';

export const dynamic = 'force-dynamic';

async function enrichEmptyPublicPortfolioCheck(
  input: PrivacyPreflightRequest,
  authContext: NonNullable<Awaited<ReturnType<typeof requireApiAuthContext>>>
): Promise<PrivacyPreflightRequest> {
  if (
    input.surface !== 'public_portfolio' ||
    input.text?.trim() ||
    (input.fields && input.fields.length > 0)
  ) {
    return input;
  }

  const [{ data: individual }, { data: profile }] = await Promise.all([
    authContext.supabase
      .from('individual_profiles')
      .select('field_visibility, headline, bio, tagline, work_email')
      .eq('user_id', authContext.user.id)
      .maybeSingle(),
    authContext.supabase
      .from('profiles')
      .select('display_name, handle')
      .eq('id', authContext.user.id)
      .maybeSingle(),
  ]);
  const visibility = mergeVisibilityFlags((individual as any)?.field_visibility);

  return {
    ...input,
    hiddenTerms: [
      ...(input.hiddenTerms ?? []),
      !visibility.identity ? (profile as any)?.display_name : null,
      !(visibility.contact && visibility.workEmail) ? (individual as any)?.work_email : null,
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
    fields: [
      visibility.header
        ? {
            label: 'public headline',
            value: ((individual as any)?.headline || (individual as any)?.tagline || '') as string,
            visibility: 'visible',
          }
        : null,
      visibility.bio
        ? {
            label: 'public bio',
            value: ((individual as any)?.bio || '') as string,
            visibility: 'visible',
          }
        : null,
    ].filter(
      (
        field
      ): field is {
        label: string;
        value: string;
        visibility: 'visible';
      } => Boolean(field)
    ),
  };
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const payload = PrivacyPreflightRequestSchema.parse(body);
    const input = await enrichEmptyPublicPortfolioCheck(payload, authContext);
    const result = await runPrivacyPreflightCheck({
      input,
      userId: authContext.user.id,
      requestId: crypto.randomUUID(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return safeValidationErrorResponse({
        error,
        message: 'Invalid privacy preflight request',
      });
    }

    return safeApiErrorResponse({
      event: 'ai.privacy_preflight.failed',
      error,
      publicMessage: 'Privacy preflight failed',
    });
  }
}
