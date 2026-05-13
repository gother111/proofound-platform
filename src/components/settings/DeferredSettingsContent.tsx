'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

interface DeferredSettingsContentProps {
  userId: string;
}

export function DeferredSettingsContent({ userId }: DeferredSettingsContentProps) {
  const [SettingsView, setSettingsView] =
    useState<ComponentType<DeferredSettingsContentProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import('./SettingsContent').then((module) => {
      if (!cancelled) {
        setSettingsView(() => module.SettingsContent);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!SettingsView) {
    return (
      <AppSurface>
        <div className="mx-auto max-w-4xl space-y-6">
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
