'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Button } from '@/components/ui/button';

type PrivacySettingsLoader = () => Promise<{ PrivacySettingsClient: ComponentType }>;

const loadPrivacySettingsClient: PrivacySettingsLoader = () => import('./PrivacySettingsClient');

export function DeferredPrivacySettingsClient({
  loadPrivacySettingsView = loadPrivacySettingsClient,
}: {
  loadPrivacySettingsView?: PrivacySettingsLoader;
}) {
  const [PrivacySettingsView, setPrivacySettingsView] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoadError(false);

    void loadPrivacySettingsView()
      .then((module) => {
        if (!cancelled) {
          setPrivacySettingsView(() => module.PrivacySettingsClient);
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
  }, [loadPrivacySettingsView, retryKey]);

  if (loadError) {
    return (
      <AppSurface>
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-proofound-stone bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Privacy settings
          </p>
          <h1 className="mt-2 font-display text-xl font-semibold text-foreground">
            Privacy controls could not load
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your existing privacy choices are still saved. Retry this section to reload visibility,
            data, and account controls.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
            Retry privacy controls
          </Button>
        </div>
      </AppSurface>
    );
  }

  if (!PrivacySettingsView) {
    return (
      <AppSurface>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground" role="status">
              Loading privacy controls...
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-9 w-64 rounded bg-muted/60" />
            <div className="h-5 w-96 max-w-full rounded bg-muted/60" />
          </div>
          <div className="h-36 rounded-2xl bg-muted/60" />
          <div className="h-48 rounded-2xl bg-muted/60" />
          <div className="h-48 rounded-2xl bg-muted/60" />
        </div>
      </AppSurface>
    );
  }

  return <PrivacySettingsView />;
}
