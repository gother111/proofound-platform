'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { Button } from '@/components/ui/button';

type MatchingViewLoader = () => Promise<{ OrgMatchingClient: ComponentType }>;

const loadOrgMatchingClient: MatchingViewLoader = () => import('./OrgMatchingClient');

export function DeferredOrgMatchingClient({
  loadMatchingView = loadOrgMatchingClient,
  orgSlug,
}: {
  loadMatchingView?: MatchingViewLoader;
  orgSlug?: string | null;
}) {
  const [MatchingView, setMatchingView] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const createAssignmentHref = orgSlug ? `/app/o/${orgSlug}/assignments/new` : null;

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
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
            Retry loading assignments
          </Button>
          {createAssignmentHref ? (
            <Button asChild>
              <Link href={createAssignmentHref}>Create assignment</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!MatchingView) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-2xl border border-proofound-stone bg-white/85 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Assignments
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
                Assignment workspace is loading
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                We are preparing the assignment cards, proof matches, and review context for this
                workspace.
              </p>
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                Loading assignments and matches...
              </p>
            </div>
            {createAssignmentHref ? (
              <Button asChild className="w-full shrink-0 sm:w-auto">
                <Link href={createAssignmentHref}>Create assignment</Link>
              </Button>
            ) : null}
          </div>
        </section>
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
