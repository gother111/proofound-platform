import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userConsents } from '@/db/schema';
import { anonymizeIP, anonymizeUserAgent } from '@/lib/utils/privacy';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// Validation schema for consent request
const ConsentRecordSchema = z.object({
  type: z.enum([
    'gdpr_terms_of_service',
    'gdpr_privacy_policy',
    'marketing_emails',
    'analytics_tracking',
    'ml_matching',
  ]),
  consented: z.boolean(),
});

const ConsentRequestSchema = z.object({
  userId: z.string().uuid(),
  consents: z.array(ConsentRecordSchema).min(1),
});

/**
 * POST /api/user/consent
 * 
 * Store user consent records with audit trail
 * 
 * GDPR Article 7 - Conditions for consent
 * GDPR Article 4(5) - Pseudonymisation (hashed IPs)
 * 
 * This endpoint:
 * 1. Validates user authentication
 * 2. Accepts array of consent records
 * 3. Hashes IP and User Agent for privacy
 * 4. Stores consent with timestamp and version
 * 
 * Required headers:
 * - Authorization: Bearer <access_token> (from Supabase auth)
 * - x-forwarded-for: <ip_address> (for audit trail)
 * - user-agent: <user_agent> (for audit trail)
 * 
 * Request body:
 * {
 *   userId: string (UUID),
 *   consents: [
 *     { type: 'gdpr_privacy_policy', consented: true },
 *     { type: 'gdpr_terms_of_service', consented: true },
 *     { type: 'marketing_emails', consented: false }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to store consent records' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = ConsentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid consent request',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Verify user can only store consent for themselves
    if (parsed.data.userId !== user.id) {
      log.warn('privacy.consent.unauthorized_attempt', {
        requestedUserId: parsed.data.userId,
        actualUserId: user.id,
      });

      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only store consent for your own account' },
        { status: 403 }
      );
    }

    // Extract IP and User Agent for audit trail
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Hash PII before storage (GDPR compliance)
    const ipHash = anonymizeIP(ip);
    const userAgentHash = anonymizeUserAgent(userAgent);

    // Current policy version (update when policies change)
    const policyVersion = 'v1.0.2025-10-30';

    // Prepare consent records for insertion
    const consentRecords = parsed.data.consents.map((consent) => ({
      profileId: user.id,
      consentType: consent.type,
      consented: consent.consented,
      consentedAt: new Date(),
      ipHash,
      userAgentHash,
      version: policyVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Store consent records in database
    await db.insert(userConsents).values(consentRecords);

    // Log successful consent storage
    log.info('privacy.consent.stored', {
      userId: user.id,
      consentTypes: parsed.data.consents.map(c => c.type),
      version: policyVersion,
    });

    return NextResponse.json({
      success: true,
      message: 'Consent records stored successfully',
      stored: consentRecords.length,
      version: policyVersion,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid consent data',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    // Log unexpected errors
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
 * Retrieve user's consent history
 * 
 * GDPR Article 15 - Right of access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query user's consent records from database
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
      consents: consents.map(c => ({
        ...c,
        consentedAt: c.consentedAt.toISOString(),
      })),
      total: consents.length,
    });
  } catch (error) {
    log.error('privacy.consent.retrieval_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to retrieve consent records' },
      { status: 500 }
    );
  }
}

