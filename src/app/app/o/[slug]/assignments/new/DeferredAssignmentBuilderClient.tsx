'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Card } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';

type AssignmentBuilderClientProps = {
  slug: string;
};

export function AssignmentBuilderLoading() {
  return (
    <AppSurface>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section
          aria-busy="true"
          aria-live="polite"
          className="rounded-2xl border border-proofound-stone/80 bg-white/85 p-5 shadow-sm"
          role="status"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Assignment draft
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-proofound-charcoal">
            Preparing assignment builder
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            We are loading the private assignment workspace for this organization. Your draft,
            review readiness, and publish state stay unchanged while the builder loads.
          </p>
        </section>
        <div aria-hidden="true" className="space-y-6">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-10 animate-pulse rounded-md bg-muted" />
                <div className="h-10 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-36 animate-pulse rounded-md bg-muted" />
            </div>
          </Card>
        </div>
      </div>
    </AppSurface>
  );
}

export function DeferredAssignmentBuilderClient({ slug }: AssignmentBuilderClientProps) {
  const [AssignmentBuilder, setAssignmentBuilder] =
    useState<ComponentType<AssignmentBuilderClientProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import('./AssignmentBuilderClient').then((module) => {
      if (!cancelled) {
        setAssignmentBuilder(() => module.default);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!AssignmentBuilder) {
    return <AssignmentBuilderLoading />;
  }

  return <AssignmentBuilder slug={slug} />;
}
