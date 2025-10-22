'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { patchOrganization } from '@/features/org/actions';

function isNonEmpty(value: unknown) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return Boolean(value);
}

export function OrgImpactPipeline({
  orgId,
  impactPipeline,
  canEdit,
}: {
  orgId: string;
  impactPipeline: unknown;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() =>
    impactPipeline ? JSON.stringify(impactPipeline, null, 2) : ''
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasPipeline = useMemo(() => isNonEmpty(impactPipeline), [impactPipeline]);

  useEffect(() => {
    setValue(impactPipeline ? JSON.stringify(impactPipeline, null, 2) : '');
  }, [impactPipeline]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let payload: unknown = [];
    if (value.trim()) {
      try {
        payload = JSON.parse(value);
      } catch (parseError) {
        setError('Impact pipeline must be valid JSON.');
        return;
      }
    }

    startTransition(async () => {
      await patchOrganization(orgId, { impact_pipeline: payload });
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Impact</h3>
          <p className="text-sm text-muted-foreground">
            Map how your organization creates value at every stage—from sourcing to end-of-life.
          </p>
        </div>
        {canEdit && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary">
                {hasPipeline ? 'Edit pipeline' : 'Add Impact Pipeline'}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Define your impact pipeline</SheetTitle>
              </SheetHeader>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="impact-pipeline" className="text-sm font-medium">
                    Impact pipeline JSON
                  </label>
                  <textarea
                    id="impact-pipeline"
                    className="min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder='{"stages":[{"name":"Design","outcomes":["Carbon neutral"]}]}'
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a structure that captures each stage of your pipeline and the value created.
                  </p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <SheetFooter>
                  <Button type="submit" disabled={isPending}>
                    Save
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <Tabs defaultValue="impact">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="impact" className="mt-4">
          {hasPipeline ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <pre className="whitespace-pre-wrap break-words text-xs text-foreground">
                {JSON.stringify(impactPipeline, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
              <p className="text-base font-medium">Define Your Impact Pipeline</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Show the complete journey of impact creation and include social, environmental, and
                economic value created at each stage.
              </p>
              {canEdit && (
                <Button className="mt-4" onClick={() => setOpen(true)}>
                  Add Impact Pipeline
                </Button>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: Include social, environmental, and economic value created at each stage.
          </p>
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
            Highlight projects that demonstrate your organization’s mission in action.
          </div>
        </TabsContent>
        <TabsContent value="assignments" className="mt-4">
          <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
            Share assignments to invite aligned people into your initiatives.
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
