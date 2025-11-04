import { requireAuth } from '@/lib/auth';
import { SnoozedMatchesList } from '@/components/matching/SnoozedMatchesList';

export const dynamic = 'force-dynamic';

export default async function SnoozedMatchesPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#2D3330] mb-2">
            Snoozed Matches
          </h1>
          <p className="text-[#6B6760]">
            Opportunities you've temporarily hidden. They'll automatically reappear when the snooze period ends.
          </p>
        </div>

        <SnoozedMatchesList />
      </div>
    </div>
  );
}

