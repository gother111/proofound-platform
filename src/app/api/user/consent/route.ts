import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userConsents } from '@/db/schema';
import { anonymizeIP, anonymizeUserAgent } from '@/lib/utils/privacy';
import { log } from '@/lib/log';
import {
  CONSENT_TYPES,
  getPolicyVersionForConsentType,
  type ConsentTypeValue,
} from '@/lib/privacy/consent-contract';

export const dynamic = 'force-dynamic';

const ConsentTypeSchema = z.enum([
  CONSENT_TYPES.TOS,
  CONSENT_TYPES.PRIVACY,
  CONSENT_TYPES.MARKETING,
  CONSENT_TYPES.ANALYTICS,
  CONSENT_TYPES.ML_MATCHING,
]);

const ConsentRecordSchema = z.object({
  type: ConsentTypeSchema,
  consented: z.boolean(),
});

const CanonicalConsentRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  consents: z.array(ConsentRecordSchema).min(1),
});

const LegacyConsentRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  consentType: ConsentTypeSchema,
  consented: z.boolean(),
  version: z.string().optional(),
});

const AnyConsentRequestSchema = z.union([
  CanonicalConsentRequestSchema,
  LegacyConsentRequestSchema,
]);

type NormalizedConsentRequest = {
  userId?: string;
  consents: Array<{ type: ConsentTypeValue; consented: boolean }>;
};

function normalizeConsentRequest(
  body: z.infer<typeof AnyConsentRequestSchema>
): NormalizedConsentRequest {
  if ('consents' in body) {
    return {
      userId: body.userId,
      consents: body.consents,
    };
  }

  return {
    userId: body.userId,
    consents: [{ type: body.consentType, consented: body.consented }],
  };
}

/**
 * POST /api/user/consent
 *
 * Store user consent records with audit trail.
 * Backward-compatible with legacy payload shape.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to store consent records' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = AnyConsentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid consent request',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const normalized = normalizeConsentRequest(parsed.data);

    if (normalized.userId && normalized.userId !== user.id) {
      log.warn('privacy.consent.unauthorized_attempt', {
        requestedUserId: normalized.userId,
        actualUserId: user.id,
      });

      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only store consent for your own account' },
        { status: 403 }
      );
    }

    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const ipHash = anonymizeIP(ip);
    const userAgentHash = anonymizeUserAgent(userAgent);

    const consentRecords = normalized.consents.map((consent) => ({
      profileId: user.id,
      consentType: consent.type,
      consented: consent.consented,
      consentedAt: new Date(),
      ipHash,
      userAgentHash,
      version: getPolicyVersionForConsentType(consent.type),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(userConsents).values(consentRecords);

    log.info('privacy.consent.stored', {
      userId: user.id,
      consentTypes: consentRecords.map((record) => record.consentType),
      versions: consentRecords.map((record) => record.version),
    });

    return NextResponse.json({
      success: true,
      message: 'Consent records stored successfully',
      stored: consentRecords.length,
      consents: consentRecords.map((record) => ({
        type: record.consentType,
        consented: record.consented,
        version: record.version,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid consent data',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    log.error('privacy.consent.storage_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to store consent records',
        message: 'An error occurred while processing your consent. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/consent
 *
 * Retrieve user's consent history.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consents = await db
      .select({
        id: userConsents.id,
        consentType: userConsents.consentType,
        consented: userConsents.consented,
        consentedAt: userConsents.consentedAt,
        version: userConsents.version,
      })
      .from(userConsents)
      .where(eq(userConsents.profileId, user.id))
      .orderBy(desc(userConsents.consentedAt));

    return NextResponse.json({
      consents: consents.map((consent) => ({
        ...consent,
        consentedAt: consent.consentedAt.toISOString(),
      })),
      total: consents.length,
    });
  } catch (error) {
    log.error('privacy.consent.retrieval_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to retrieve consent records' }, { status: 500 });
  }
}
