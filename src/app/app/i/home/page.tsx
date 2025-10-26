import { requireAuth } from '@/lib/auth';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { MatchingResultsCard } from '@/components/dashboard/MatchingResultsCard';
import { ImpactSnapshotCard } from '@/components/dashboard/ImpactSnapshotCard';

export const dynamic = 'force-dynamic';

export default async function IndividualHomePage() {
  const user = await requireAuth();
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
        <TasksCard />

        {/* Row 2 - Matching spans 2 cols */}
        <MatchingResultsCard className="lg:col-span-2" />

        {/* Individual-specific card */}
        <ImpactSnapshotCard />
      </div>
    </div>
  );
}
