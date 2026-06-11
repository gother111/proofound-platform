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
import { runPrivacyPreflightCheck } from '@/lib/ai/privacy-preflight';
import { and, eq } from 'drizzle-orm';
import { log } from '@/lib/log';

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
      searchIndexingEnabled: false,
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
    log.error('portfolio.visibility.get_failed', { error });
    return NextResponse.json({ error: 'Failed to fetch visibility' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
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
      .select('field_visibility, headline, bio, tagline, work_email')
      .eq('user_id', user.id)
      .maybeSingle();
    const profileBeforeUpdate = await supabase
      .from('profiles')
      .select('display_name, handle')
      .eq('id', user.id)
      .maybeSingle();

    const merged = mergeVisibilityFlags((current.data as any)?.field_visibility);
    const next = {
      ...merged,
      header: true,
      proofBar: parsed.proofBar ?? merged.proofBar,
      workEmail: parsed.workEmail ?? merged.workEmail,
      linkedin: false,
      identity: parsed.identity ?? merged.identity,
      skills: parsed.skills ?? merged.skills,
      bio: parsed.bio ?? merged.bio,
      contact: parsed.contact ?? merged.contact,
    };

    const publicPageEnabled = parsed.publicPageEnabled ?? true;
    const searchIndexingEnabled = false;
    const nextState = publicPageEnabled ? 'public_link_only' : 'unavailable';

    if (publicPageEnabled) {
      const currentProfile = (current.data as any) ?? {};
      const publicProfile = (profileBeforeUpdate.data as any) ?? {};
      const hiddenTerms = [
        !next.identity ? publicProfile.display_name : null,
        !(next.contact && next.workEmail) ? currentProfile.work_email : null,
      ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
      const preflight = await runPrivacyPreflightCheck({
        requestId: crypto.randomUUID(),
        userId: user.id,
        input: {
          surface: 'public_portfolio',
          includeModelReview: false,
          hiddenTerms,
          fields: [
            next.header
              ? {
                  label: 'public headline',
                  value: currentProfile.headline || currentProfile.tagline || '',
                  visibility: 'visible',
                }
              : null,
            next.bio
              ? {
                  label: 'public bio',
                  value: currentProfile.bio || '',
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
        },
      });

      if (preflight.flags.some((flag) => flag.deterministic && flag.requiresReview)) {
        return NextResponse.json(
          {
            error: 'Privacy review required',
            privacyPreflight: preflight,
          },
          { status: 409 }
        );
      }
    }

    const { error } = await supabase
      .from('individual_profiles')
      .update({ field_visibility: next })
      .eq('user_id', user.id);

    if (error) {
      log.error('portfolio.visibility.update_failed', { error });
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
      log.error('portfolio.visibility.profile_state_update_failed', {
        error: profileUpdate.error,
      });
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
    log.error('portfolio.visibility.post_failed', { error });
    return NextResponse.json({ error: 'Failed to save visibility' }, { status: 500 });
  }
}
