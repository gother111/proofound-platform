'use client';

import { useEffect, useState, useTransition } from 'react';
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

function normalizeCommitments(value: unknown): string[] {
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

export function OrgCommitments({
  orgId,
  commitments,
  canEdit,
}: {
  orgId: string;
  commitments: unknown;
  canEdit: boolean;
}) {
  const router = useRouter();
  const initial = normalizeCommitments(commitments);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initial.join('|'));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValues(normalizeCommitments(commitments).join('|'));
  }, [commitments]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = values
      .split('|')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    startTransition(async () => {
      await patchOrganization(orgId, { commitments: next });
      router.refresh();
      setOpen(false);
    });
  }

  const items = normalizeCommitments(commitments);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Our Commitments</h3>
          <p className="text-sm text-muted-foreground">
            Public pledges and measurable commitments your organization has made.
          </p>
        </div>
        {canEdit && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary">
                {items.length > 0 ? 'Edit commitments' : 'Add commitments'}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Update commitments</SheetTitle>
              </SheetHeader>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="commitments" className="text-sm font-medium">
                    Commitments (separate with |)
                  </label>
                  <Input
                    id="commitments"
                    value={values}
                    onChange={(event) => setValues(event.target.value)}
                    placeholder="Net-zero by 2030 | 1% for the Planet"
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
        <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Add commitments to communicate how you stay accountable to stakeholders.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-lg border bg-muted/40 px-4 py-3 text-sm font-medium"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
