/**
 * LinkedIn Connection Status Check
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ connected: false });
    }

    // Check for LinkedIn integration
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(
        and(
          eq(userIntegrations.userId, user.id),
          eq(userIntegrations.provider, 'linkedin')
        )
      )
      .limit(1);

    const connected = integration.length > 0 && integration[0].accessToken !== null;
    
    // Check if token is expired
    const isExpired = integration[0]?.tokenExpiry && new Date() > integration[0].tokenExpiry;

    return NextResponse.json({
      connected: connected && !isExpired,
      expired: isExpired,
    });
  } catch (error) {
    console.error('LinkedIn status check error:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}

