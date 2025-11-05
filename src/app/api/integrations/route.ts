import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations
 *
 * Get all integrations for the current user
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const integrations = await db
      .select({
        provider: userIntegrations.provider,
        createdAt: userIntegrations.createdAt,
        tokenExpiry: userIntegrations.tokenExpiry,
      })
      .from(userIntegrations)
      .where(eq(userIntegrations.userId, user.id));

    // Format response
    const formatted = integrations.map((integration) => ({
      provider: integration.provider,
      connected: true, // If record exists, it's connected
      connectedAt: integration.createdAt,
    }));

    return NextResponse.json({
      integrations: formatted,
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

