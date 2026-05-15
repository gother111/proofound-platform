import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import {
  CLIENT_FEATURE_FLAG_RESPONSE_MAP,
  FEATURE_FLAG_KEYS,
  getFeatureFlagDefault,
} from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';

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
      .where(and(eq(organizationMembers.userId, user.id), eq(organizationMembers.state, 'active')));

    const orgIds = memberships.map((item) => item.orgId);
    const roles = memberships.map((item) => item.role);

    const context = {
      userId: user.id,
      userEmail: user.email ?? undefined,
      orgIds,
      roles,
    };
    const keys = Object.values(CLIENT_FEATURE_FLAG_RESPONSE_MAP);
    const resolvedEntries = await Promise.all(
      keys.map(async (key) => [
        key,
        await isFeatureEnabled(
          key,
          context,
          getFeatureFlagDefault(key as (typeof FEATURE_FLAG_KEYS)[keyof typeof FEATURE_FLAG_KEYS])
        ),
      ])
    );
    const resolved = Object.fromEntries(resolvedEntries) as Record<string, boolean>;

    return NextResponse.json({
      flags: {
        activationTiering: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.activationTiering],
        assignmentBasicMode: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.assignmentBasicMode],
        uiVocabPlain: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.uiVocabPlain],
        privacySummary: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.privacySummary],
        qualifiedIntroCorridor: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.qualifiedIntroCorridor],
        structuredFeedbackRequired:
          resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.structuredFeedbackRequired],
        exactRankExposure: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.exactRankExposure],
        killSwitchIntros: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.killSwitchIntros],
        killSwitchExactRank: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.killSwitchExactRank],
        legacyMvpSurfaces: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.legacyMvpSurfaces],
        assistiveAiUi: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.assistiveAiUi],
        proofArtifactOcrBeta: resolved[CLIENT_FEATURE_FLAG_RESPONSE_MAP.proofArtifactOcrBeta],
      },
    });
  } catch (error) {
    console.error('feature_flags.fetch_failed', error);
    return NextResponse.json({ error: 'Failed to load feature flags' }, { status: 500 });
  }
}
