'use client';

import { useEffect, useState, type ComponentType } from 'react';
import type { VerificationsClientProps } from './VerificationsClient';

export function DeferredVerificationsClient(props: VerificationsClientProps) {
  const [VerificationsView, setVerificationsView] =
    useState<ComponentType<VerificationsClientProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import('./VerificationsClient').then((module) => {
      if (!cancelled) {
        setVerificationsView(() => module.VerificationsClient);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!VerificationsView) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-proofound-parchment p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-96 animate-pulse rounded-2xl bg-white/70" />
        </div>
      </div>
    );
  }

  return <VerificationsView {...props} />;
}
