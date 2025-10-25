import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { TasksVerificationsCard } from '@/components/dashboard/TasksVerificationsCard';
import { ProjectsCard } from '@/components/dashboard/ProjectsCard';
import { MatchingResultsCard } from '@/components/dashboard/MatchingResultsCard';
import { ExploreOpportunitiesCard } from '@/components/dashboard/ExploreOpportunitiesCard';
import { ImpactSnapshotCard } from '@/components/dashboard/ImpactSnapshotCard';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function IndividualHomePage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from('organization_members')
    .select('status, organization:organizations(slug)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle<{
      status: string | null;
      organization: { slug: string | null } | null;
    }>();

  if (membership?.status === 'active' && membership.organization?.slug) {
    redirect(`/app/o/${membership.organization.slug}/home`);
  }
  const persona = 'individual';

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
