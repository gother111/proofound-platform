'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { Button } from '@/components/ui/button';

type MatchingViewLoader = () => Promise<{ OrgMatchingClient: ComponentType }>;

const loadOrgMatchingClient: MatchingViewLoader = () => import('./OrgMatchingClient');

export function DeferredOrgMatchingClient({
  loadMatchingView = loadOrgMatchingClient,
}: {
  loadMatchingView?: MatchingViewLoader;
}) {
  const [MatchingView, setMatchingView] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoadError(false);

    void loadMatchingView()
      .then((module) => {
        if (!cancelled) {
          setMatchingView(() => module.OrgMatchingClient);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadMatchingView, retryKey]);

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-proofound-stone bg-white/80 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Assignments
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
          Assignments could not load
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Your assignments are still safe. Refresh this section to try loading the matching review
          workspace again.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
          Retry loading assignments
        </Button>
      </div>
    );
  }

  if (!MatchingView) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <p className="text-sm text-muted-foreground" role="status">
          Loading assignments and matches...
        </p>
        <PageIntroSkeleton />
        <CardGridSkeleton
          count={4}
          columnsClassName="grid gap-3 sm:grid-cols-2"
          tileClassName="min-h-[160px]"
        />
        <CardGridSkeleton
          count={4}
          columnsClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
          tileClassName="min-h-[220px]"
        />
      </div>
    );
  }

  return <MatchingView />;
}
