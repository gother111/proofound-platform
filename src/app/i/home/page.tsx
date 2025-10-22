import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { TasksVerificationsCard } from '@/components/dashboard/TasksVerificationsCard';
import { ProjectsCard } from '@/components/dashboard/ProjectsCard';
import { MatchingResultsCard } from '@/components/dashboard/MatchingResultsCard';
import { ExploreOpportunitiesCard } from '@/components/dashboard/ExploreOpportunitiesCard';
import { ImpactSnapshotCard } from '@/components/dashboard/ImpactSnapshotCard';
import { createServerClient } from '@/lib/supabase/server';
import { ensureOrgContextForUser, type MembershipWithOrganization } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export default async function IndividualHomePage() {
  const supabase = await createServerClient({ cookies });
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (!authErr && user) {
    const { data: membership, error: membershipErr } = await supabase
      .from('organization_members')
      .select('status, organization:organizations(id, slug, display_name)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle<MembershipWithOrganization>();

    if (membershipErr) {
      console.warn('[i/home] membership lookup failed', {
        userId: user.id,
        error: String(membershipErr),
      });
    }

    if (membership?.status === 'active' && membership.organization?.slug) {
      console.info('[i/home] redirecting org-capable user to org home', {
        userId: user.id,
        slug: membership.organization.slug,
        membershipErr: Boolean(membershipErr),
      });
      redirect(`/o/${membership.organization.slug}/home`);
    }

    if (membership?.status === 'active' && membership.organization) {
      try {
        const ensuredSlug = await ensureOrgContextForUser(user.id, {
          displayNameHint: membership.organization.display_name ?? null,
          email: user.email ?? undefined,
        });

        console.info('[i/home] redirecting org-capable user to org home (ensured slug)', {
          userId: user.id,
          slug: ensuredSlug,
          membershipErr: Boolean(membershipErr),
        });

        redirect(`/o/${ensuredSlug}/home`);
      } catch (ensureError) {
        console.warn('[i/home] failed to ensure org slug before redirect', {
          userId: user.id,
          error: String(ensureError),
        });
      }
    }
  }

  const viewer = await requireAuth();

  if (user && viewer.persona === 'org_member') {
    try {
      const slug = await ensureOrgContextForUser(user.id, {
        displayNameHint: viewer.displayName,
        email: user.email ?? undefined,
      });

      console.info('[i/home] redirecting org persona to org home', {
        userId: user.id,
        slug,
      });

      redirect(`/o/${slug}/home`);
    } catch (ensureError) {
      console.warn('[i/home] failed to ensure org context for persona', {
        userId: user.id,
        error: String(ensureError),
      });
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* While Away - hidden by default */}
        <div className="lg:col-span-3">
          <WhileAwayCard />
        </div>

        {/* Row 1 */}
        <GoalsCard />
        <TasksVerificationsCard />
        <ProjectsCard />

        {/* Row 2 - Matching spans 2 cols */}
        <MatchingResultsCard className="lg:col-span-2" />

        {/* Individual-specific card */}
        <ImpactSnapshotCard />

        {/* Row 3 - Explore spans full width */}
        <ExploreOpportunitiesCard className="lg:col-span-3" />
      </div>
    </div>
  );
}
