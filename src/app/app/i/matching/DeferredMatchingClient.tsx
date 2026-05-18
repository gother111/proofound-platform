'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { Button } from '@/components/ui/button';

type MatchingLoader = () => Promise<{ MatchingClient: ComponentType }>;

const loadMatchingClient: MatchingLoader = () => import('./MatchingClient');

export function DeferredMatchingClient({
  loadMatchingView = loadMatchingClient,
}: {
  loadMatchingView?: MatchingLoader;
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
          setMatchingView(() => module.MatchingClient);
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
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-proofound-stone/80 bg-white/75 p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-muted-foreground">Matching</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-proofound-charcoal">
            Matching could not load
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your profile and proof records are still safe. Retry this section to load matching
            preferences and opportunities.
          </p>
          <Button className="mt-5" variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
            Retry matching
          </Button>
        </div>
      </div>
    );
  }

  if (!MatchingView) {
    return (
      <div className="p-4 md:p-6">
        <p className="mb-3 text-sm text-muted-foreground" role="status">
          Loading matching workspace...
        </p>
        <PageIntroSkeleton />
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  return <MatchingView />;
}
