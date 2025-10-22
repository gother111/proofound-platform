'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { patchOrganization } from '@/features/org/actions';

function normalizeValues(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    );
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0
          )
        : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

export function OrgCoreValues({
  orgId,
  coreValues,
  canEdit,
}: {
  orgId: string;
  coreValues: unknown;
  canEdit: boolean;
}) {
  const router = useRouter();
  const initialValues = useMemo(() => {
    const normalized = normalizeValues(coreValues);
    return [...normalized, '', '', '', ''].slice(0, 4);
  }, [coreValues]);

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = values.map((value) => value.trim()).filter((value) => value.length > 0);

    startTransition(async () => {
      await patchOrganization(orgId, { core_values: payload });
      router.refresh();
      setOpen(false);
    });
  }

  function handleChange(index: number, next: string) {
    setValues((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  }

  const displayValues = useMemo(() => normalizeValues(coreValues), [coreValues]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Core Values</h3>
          <p className="text-sm text-muted-foreground">
            The principles that guide your organization’s decisions and culture.
          </p>
        </div>
        {canEdit && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary">
                {displayValues.length > 0 ? 'Edit core values' : 'Define core values'}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Define core values</SheetTitle>
              </SheetHeader>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                {values.map((value, index) => (
                  <div key={index} className="space-y-2">
                    <label htmlFor={`core-value-${index}`} className="text-sm font-medium">
                      Value {index + 1}
                    </label>
                    <Input
                      id={`core-value-${index}`}
                      value={value}
                      onChange={(event) => handleChange(index, event.target.value)}
                      placeholder={`Value ${index + 1}`}
                    />
                  </div>
                ))}
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="flex h-24 items-center justify-center rounded-xl border border-dashed text-center text-sm font-medium text-muted-foreground"
          >
            {displayValues[index] ?? `Value ${index + 1}`}
          </div>
        ))}
      </div>
    </Card>
  );
}
