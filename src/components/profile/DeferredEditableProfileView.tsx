'use client';

import { useEffect, useState, type ComponentType } from 'react';
import type { EditableProfileViewProps } from './EditableProfileView';

export function DeferredEditableProfileView(props: EditableProfileViewProps) {
  const [ProfileView, setProfileView] = useState<ComponentType<EditableProfileViewProps> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    void import('./EditableProfileView').then((module) => {
      if (!cancelled) {
        setProfileView(() => module.EditableProfileView);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ProfileView) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-proofound-parchment p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-white/70" />
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="h-72 animate-pulse rounded-2xl bg-white/70" />
            <div className="h-96 animate-pulse rounded-2xl bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  return <ProfileView {...props} />;
}
