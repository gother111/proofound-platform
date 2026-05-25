'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import type { VerificationsClientProps } from './VerificationsClient';

type VerificationsLoader = () => Promise<{
  VerificationsClient: ComponentType<VerificationsClientProps>;
}>;

const loadVerificationsClient: VerificationsLoader = () => import('./VerificationsClient');

export function DeferredVerificationsClient({
  loadVerificationsView = loadVerificationsClient,
  ...props
}: VerificationsClientProps & {
  loadVerificationsView?: VerificationsLoader;
}) {
  const [VerificationsView, setVerificationsView] =
    useState<ComponentType<VerificationsClientProps> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoadError(false);

    void loadVerificationsView()
      .then((module) => {
        if (!cancelled) {
          setVerificationsView(() => module.VerificationsClient);
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
  }, [loadVerificationsView, retryKey]);

  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-proofound-parchment p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-proofound-stone bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Verifications
          </p>
          <h1 className="mt-2 font-display text-xl font-semibold text-proofound-charcoal">
            Verification center could not load
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your requests are not changed. Retry this section to load proof requests, responses, and
            trust activity.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
            Retry verifications
          </Button>
        </div>
      </div>
    );
  }

  if (!VerificationsView) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-proofound-parchment p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <p className="text-sm text-muted-foreground" role="status">
            Loading verification center...
          </p>
          <div className="h-24 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-96 animate-pulse rounded-2xl bg-white/70" />
        </div>
      </div>
    );
  }

  return <VerificationsView {...props} />;
}
