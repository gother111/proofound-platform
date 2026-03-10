import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { portfolioPublicationStates } from '@/db/schema';
import { emitLifecycleEvent } from '@/lib/analytics/lifecycle-events';
import { computePortfolioPublicationState } from '@/lib/proof-trust/snapshots';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';
import { resolveRequestedPublicPortfolioState } from '@/lib/portfolio/public-contract';
import { and, eq } from 'drizzle-orm';

const VisibilitySchema = z.object({
  publicPageEnabled: z.boolean().optional(),
  searchIndexingEnabled: z.boolean().optional(),
  header: z.boolean().optional(),
  proofBar: z.boolean().optional(),
  workEmail: z.boolean().optional(),
  linkedin: z.boolean().optional(),
  identity: z.boolean().optional(),
  skills: z.boolean().optional(),
  bio: z.boolean().optional(),
  contact: z.boolean().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: individual } = await supabase
      .from('individual_profiles')
      .select('field_visibility')
      .eq('user_id', user.id)
      .maybeSingle();
    const { data: profile } = await supabase
      .from('profiles')
      .select('public_portfolio_state, search_indexing_enabled_at')
      .eq('id', user.id)
      .maybeSingle();

    const merged = mergeVisibilityFlags((individual as any)?.field_visibility);
    const portfolioState = resolveRequestedPublicPortfolioState(
      (profile as any)?.public_portfolio_state
    );

    return NextResponse.json({
      publicPageEnabled: portfolioState !== 'unavailable',
      searchIndexingEnabled: Boolean((profile as any)?.search_indexing_enabled_at),
      visibility: {
        header: merged.header,
        proofBar: merged.proofBar,
        workEmail: merged.workEmail,
        linkedin: merged.linkedin,
        identity: merged.identity,
        skills: merged.skills,
        bio: merged.bio,
        contact: merged.contact,
      },
    });
  } catch (error) {
    console.error('visibility get failed', error);
    return NextResponse.json({ error: 'Failed to fetch visibility' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = VisibilitySchema.parse(body);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const previousPublicationState = await db.query.portfolioPublicationStates.findFirst({
      where: and(
        eq(portfolioPublicationStates.subjectType, 'individual_profile'),
        eq(portfolioPublicationStates.subjectId, user.id)
      ),
    });

    const current = await supabase
      .from('individual_profiles')
      .select('field_visibility')
      .eq('user_id', user.id)
      .maybeSingle();

    const merged = mergeVisibilityFlags((current.data as any)?.field_visibility);
    const next = {
      ...merged,
      header: parsed.header ?? merged.header,
      proofBar: parsed.proofBar ?? merged.proofBar,
      workEmail: parsed.workEmail ?? merged.workEmail,
      linkedin: parsed.linkedin ?? merged.linkedin,
      identity: parsed.identity ?? merged.identity,
      skills: parsed.skills ?? merged.skills,
      bio: parsed.bio ?? merged.bio,
      contact: parsed.contact ?? merged.contact,
    };

    const publicPageEnabled = parsed.publicPageEnabled ?? true;
    const searchIndexingEnabled = parsed.searchIndexingEnabled ?? false;
    const nextState = publicPageEnabled
      ? searchIndexingEnabled
        ? 'public_indexable'
        : 'public_link_only'
      : 'unavailable';

    const { error } = await supabase
      .from('individual_profiles')
      .update({ field_visibility: next })
      .eq('user_id', user.id);

    if (error) {
      console.error('visibility update failed', error);
      return NextResponse.json({ error: 'Failed to save visibility' }, { status: 500 });
    }

    const profileUpdate = await supabase
      .from('profiles')
      .update({
        public_portfolio_state: nextState,
        search_indexing_enabled_at: searchIndexingEnabled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileUpdate.error) {
      console.error('portfolio state update failed', profileUpdate.error);
      return NextResponse.json({ error: 'Failed to save visibility' }, { status: 500 });
    }

    const computedPublicationState = await computePortfolioPublicationState(
      'individual_profile',
      user.id
    );
    const primaryReasonCode =
      computedPublicationState.reasonCodes?.[0] || 'portfolio_visibility_saved';

    if (
      !previousPublicationState ||
      previousPublicationState.publicationState !== computedPublicationState.publicationState
    ) {
      await emitLifecycleEvent(
        'portfolio_publication_state_changed',
        {
          subject_type: 'individual_profile',
          subject_id: user.id,
          publication_state: computedPublicationState.publicationState,
          indexing_state: computedPublicationState.indexingState,
          robots_state: computedPublicationState.robotsState,
          sitemap_state: computedPublicationState.sitemapState,
          reason_code: primaryReasonCode,
          trigger: 'portfolio_visibility_saved',
          actor_type: 'candidate',
          source: 'portfolio.visibility.route',
        },
        {
          userId: user.id,
          entityType: 'profile',
          entityId: user.id,
        }
      );
    }

    if (
      !previousPublicationState ||
      previousPublicationState.indexingState !== computedPublicationState.indexingState
    ) {
      await emitLifecycleEvent(
        'portfolio_indexing_state_changed',
        {
          subject_type: 'individual_profile',
          subject_id: user.id,
          publication_state: computedPublicationState.publicationState,
          indexing_state: computedPublicationState.indexingState,
          robots_state: computedPublicationState.robotsState,
          sitemap_state: computedPublicationState.sitemapState,
          reason_code: primaryReasonCode,
          trigger: 'portfolio_visibility_saved',
          actor_type: 'candidate',
          source: 'portfolio.visibility.route',
        },
        {
          userId: user.id,
          entityType: 'profile',
          entityId: user.id,
        }
      );
    }

    await revalidatePublicPortfolioByProfileId(user.id);

    return NextResponse.json({
      publicPageEnabled,
      searchIndexingEnabled,
      visibility: next,
      publication: computedPublicationState,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.issues },
        { status: 400 }
      );
    }
    console.error('visibility post failed', error);
    return NextResponse.json({ error: 'Failed to save visibility' }, { status: 500 });
  }
}
