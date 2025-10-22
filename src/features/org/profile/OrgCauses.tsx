'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

function normalizeCauses(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    );
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

export function OrgCauses({
  orgId,
  causes,
  canEdit,
}: {
  orgId: string;
  causes: unknown;
  canEdit: boolean;
}) {
  const router = useRouter();
  const initial = normalizeCauses(causes);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial.join(', '));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const next = normalizeCauses(causes);
    setValue(next.join(', '));
  }, [causes]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    startTransition(async () => {
      await patchOrganization(orgId, { causes: next });
      router.refresh();
      setOpen(false);
    });
  }

  const items = normalizeCauses(causes);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Causes We Support</h3>
          <p className="text-sm text-muted-foreground">
            The issues and movements your organization is passionate about.
          </p>
        </div>
        {canEdit && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary">{items.length > 0 ? 'Edit causes' : 'Add causes'}</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Update causes</SheetTitle>
              </SheetHeader>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="causes" className="text-sm font-medium">
                    Causes (comma separated)
                  </label>
                  <Input
                    id="causes"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Climate, Education, Health"
                  />
                </div>
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

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Add causes to highlight the movements your organization champions.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="text-sm">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
