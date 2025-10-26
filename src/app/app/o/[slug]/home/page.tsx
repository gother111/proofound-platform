import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { MatchingResultsCard } from '@/components/dashboard/MatchingResultsCard';
import { TeamRolesCard } from '@/components/dashboard/TeamRolesCard';

export const dynamic = 'force-dynamic';

export default async function OrganizationHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;
  const persona = 'organization';

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* While Away - hidden by default */}
        <div className="lg:col-span-3">
          <WhileAwayCard />
        </div>

        {/* Row 1 */}
        <GoalsCard />
        <TasksCard />

        {/* Row 2 - Matching spans 2 cols */}
        <MatchingResultsCard className="lg:col-span-2" basePath={`/app/o/${slug}`} />

        {/* Organization-specific card */}
        <TeamRolesCard />
      </div>
    </div>
  );
}
