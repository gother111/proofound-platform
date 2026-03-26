import { requireAuth } from '@/lib/auth';
import { SnoozedMatchesList } from '@/components/matching/SnoozedMatchesList';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export const dynamic = 'force-dynamic';

export default async function SnoozedMatchesPage() {
  await requireAuth();

  return (
    <AppSurface>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2 font-display">
          Snoozed Matches
        </h1>
        <p className="text-muted-foreground">
          Matches you&apos;ve temporarily hidden. They&apos;ll automatically reappear when the
          snooze period ends.
        </p>
      </div>

      <SnoozedMatchesList />
    </AppSurface>
  );
}
