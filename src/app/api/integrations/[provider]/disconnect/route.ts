import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/integrations/[provider]/disconnect
 *
 * Disconnects the specified provider integration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const user = await requireAuth();
    const { provider } = await params;

    if (!['zoom', 'google', 'linkedin'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Delete integration
    await db
      .delete(userIntegrations)
      .where(and(eq(userIntegrations.userId, user.id), eq(userIntegrations.provider, provider as 'zoom' | 'google' | 'linkedin')));

    return NextResponse.json({
      success: true,
      message: `${provider} disconnected successfully`,
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
  }
}
