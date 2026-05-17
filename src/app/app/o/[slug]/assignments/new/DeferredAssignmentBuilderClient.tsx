'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Card } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';

type AssignmentBuilderClientProps = {
  slug: string;
};

function AssignmentBuilderLoading() {
  return (
    <AppSurface>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
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
