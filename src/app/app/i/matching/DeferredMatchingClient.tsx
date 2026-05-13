'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

export function DeferredMatchingClient() {
  const [MatchingView, setMatchingView] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import('./MatchingClient').then((module) => {
      if (!cancelled) {
        setMatchingView(() => module.MatchingClient);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!MatchingView) {
    return (
      <div className="p-4 md:p-6">
        <PageIntroSkeleton />
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  return <MatchingView />;
}
