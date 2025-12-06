import { GapMap } from '@/components/expertise/GapMap';
import { requirePersona } from '@/lib/auth';

/**
 * Dedicated Gap Map page for individuals.
 * Shows missing L4 skills for assignments the user is interested in,
 * plus curated learning resources to close each gap.
 */
export default async function GapMapPage() {
  await requirePersona('individual');

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-proofound-charcoal/70 dark:text-muted-foreground">
          Development Planning
        </p>
        <h1 className="text-2xl font-semibold text-proofound-charcoal dark:text-foreground">
          Skill Gap Map
        </h1>
        <p className="text-sm text-proofound-charcoal/80 dark:text-muted-foreground max-w-3xl">
          We compare the skills you already have with the skills repeatedly required in assignments
          you&apos;re interested in. Each gap includes quick learning links so you can close it
          faster.
        </p>
      </div>

      <GapMap />
    </div>
  );
}
