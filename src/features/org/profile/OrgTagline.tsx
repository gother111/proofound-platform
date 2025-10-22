'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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

export function OrgTagline({
  orgId,
  tagline,
  canEdit,
}: {
  orgId: string;
  tagline: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(tagline ?? '');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(tagline ?? '');
  }, [tagline]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      await patchOrganization(orgId, {
        tagline: value.trim() ? value.trim() : null,
      });
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between rounded-xl border bg-background px-6 py-4">
      <div>
        <p className="text-sm text-muted-foreground">Tagline</p>
        <p className="text-base font-medium text-foreground">
          {tagline
            ? tagline
            : 'Add a tagline that captures what your organization does and stands for'}
        </p>
      </div>
      {canEdit && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary">{tagline ? 'Edit tagline' : 'Add tagline'}</Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Update tagline</SheetTitle>
            </SheetHeader>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="tagline" className="text-sm font-medium">
                  Tagline
                </label>
                <Input
                  id="tagline"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="A brief statement about your organization"
                  maxLength={160}
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
  );
}
