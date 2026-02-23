import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { resolveFeatureFlags } from '@/lib/feature-flags/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await db
      .select({
        orgId: organizationMembers.orgId,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .where(
        and(eq(organizationMembers.userId, user.id), eq(organizationMembers.status, 'active'))
      );

    const orgIds = memberships.map((item) => item.orgId);
    const roles = memberships.map((item) => item.role);

    const keys = [
      FEATURE_FLAG_KEYS.ACTIVATION_TIERING,
      FEATURE_FLAG_KEYS.ASSIGNMENT_BASIC_MODE,
      FEATURE_FLAG_KEYS.UI_VOCAB_PLAIN,
      FEATURE_FLAG_KEYS.PRIVACY_SUMMARY,
    ];

    const resolved = await resolveFeatureFlags(
      keys,
      {
        userId: user.id,
        userEmail: user.email ?? undefined,
        orgIds,
        roles,
      },
      true
    );

    return NextResponse.json({
      flags: {
        activationTiering: resolved[FEATURE_FLAG_KEYS.ACTIVATION_TIERING],
        assignmentBasicMode: resolved[FEATURE_FLAG_KEYS.ASSIGNMENT_BASIC_MODE],
        uiVocabPlain: resolved[FEATURE_FLAG_KEYS.UI_VOCAB_PLAIN],
        privacySummary: resolved[FEATURE_FLAG_KEYS.PRIVACY_SUMMARY],
      },
    });
  } catch (error) {
    console.error('feature_flags.fetch_failed', error);
    return NextResponse.json({ error: 'Failed to load feature flags' }, { status: 500 });
  }
}
