'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export function DeferredOrgMatchingClient() {
  const [MatchingView, setMatchingView] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import('./OrgMatchingClient').then((module) => {
      if (!cancelled) {
        setMatchingView(() => module.OrgMatchingClient);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!MatchingView) {
    return (
      <AppSurface>
        <div className="max-w-6xl mx-auto space-y-6">
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
      </AppSurface>
    );
  }

  return <MatchingView />;
}
