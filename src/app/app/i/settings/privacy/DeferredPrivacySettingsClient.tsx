'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export function DeferredPrivacySettingsClient() {
  const [PrivacySettingsView, setPrivacySettingsView] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import('./PrivacySettingsClient').then((module) => {
      if (!cancelled) {
        setPrivacySettingsView(() => module.PrivacySettingsClient);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!PrivacySettingsView) {
    return (
      <AppSurface>
        <div className="mx-auto max-w-4xl space-y-6">
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
