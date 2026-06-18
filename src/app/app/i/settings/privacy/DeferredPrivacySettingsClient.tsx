'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { RefreshCcw } from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Button } from '@/components/ui/button';
import { PrivacySettingsLoadingShell } from './PrivacySettingsLoadingShell';

type PrivacySettingsLoader = () => Promise<{ PrivacySettingsClient: ComponentType }>;

const loadPrivacySettingsClient: PrivacySettingsLoader = () => import('./PrivacySettingsClient');

export function DeferredPrivacySettingsClient({
  loadPrivacySettingsView = loadPrivacySettingsClient,
}: {
  loadPrivacySettingsView?: PrivacySettingsLoader;
}) {
  const [PrivacySettingsView, setPrivacySettingsView] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void loadPrivacySettingsView()
      .then((module) => {
        if (!cancelled) {
          setPrivacySettingsView(() => module.PrivacySettingsClient);
          setLoadError(false);
          setRetrying(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setRetrying(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadPrivacySettingsView, retryKey]);

  if (loadError) {
    return (
      <AppSurface>
        <div
          className="mx-auto w-full max-w-4xl rounded-2xl border border-proofound-stone bg-white/80 p-4 shadow-sm sm:p-5"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Privacy settings
          </p>
          <h1 className="mt-2 font-display text-xl font-semibold leading-tight text-foreground">
            Privacy controls could not load
          </h1>
          <p
            className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground"
            id="privacy-loader-error-help"
          >
            Your existing privacy choices are still saved. Retry this section to reload visibility,
            data, and account controls.
          </p>
          <Button
            className="mt-4 w-full sm:w-auto"
            variant="outline"
            size="touch"
            leftIcon={<RefreshCcw className="h-4 w-4" />}
            loading={retrying}
            aria-describedby="privacy-loader-error-help"
            onClick={() => {
              setRetrying(true);
              setRetryKey((key) => key + 1);
            }}
          >
            {retrying ? 'Retrying privacy controls' : 'Retry privacy controls'}
          </Button>
        </div>
      </AppSurface>
    );
  }

  if (!PrivacySettingsView) {
    return <PrivacySettingsLoadingShell status="Loading privacy controls..." />;
  }

  return <PrivacySettingsView />;
}
