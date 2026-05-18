'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

interface DeferredSettingsContentProps {
  userId: string;
}

type SettingsLoader = () => Promise<{
  SettingsContent: ComponentType<DeferredSettingsContentProps>;
}>;

const loadSettingsContent: SettingsLoader = () => import('./SettingsContent');

export function DeferredSettingsContent({
  userId,
  loadSettingsView = loadSettingsContent,
}: DeferredSettingsContentProps & {
  loadSettingsView?: SettingsLoader;
}) {
  const [SettingsView, setSettingsView] =
    useState<ComponentType<DeferredSettingsContentProps> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoadError(false);

    void loadSettingsView()
      .then((module) => {
        if (!cancelled) {
          setSettingsView(() => module.SettingsContent);
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
  }, [loadSettingsView, retryKey]);

  if (loadError) {
    return (
      <AppSurface>
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-proofound-stone bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-2 font-display text-xl font-semibold text-foreground">
            Settings could not load
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your account settings are still safe. Retry this section to load account, privacy, and
            notification controls.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
            Retry settings
          </Button>
        </div>
      </AppSurface>
    );
  }

  if (!SettingsView) {
    return (
      <AppSurface>
        <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
          <p className="text-sm text-muted-foreground" role="status">
            Loading settings...
          </p>
          <PageIntroSkeleton />
          <div className="h-11 w-full max-w-lg rounded-lg bg-muted/60" />
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-muted/60" />
            <div className="h-40 rounded-2xl bg-muted/60" />
            <div className="h-40 rounded-2xl bg-muted/60" />
          </div>
        </div>
      </AppSurface>
    );
  }

  return <SettingsView userId={userId} />;
}
