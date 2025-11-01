/**
 * LinkedIn Disconnect Endpoint
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Delete LinkedIn integration
    await db
      .delete(userIntegrations)
      .where(
        and(
          eq(userIntegrations.userId, user.id),
          eq(userIntegrations.provider, 'linkedin')
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LinkedIn disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect LinkedIn' },
      { status: 500 }
    );
  }
}

