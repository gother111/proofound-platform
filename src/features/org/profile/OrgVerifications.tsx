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
import { patchOrganization } from '@/features/org/actions';

export type VerificationItem = {
  type: string;
  status: 'planned' | 'in-progress' | 'verified' | string;
};

function normalizeVerifications(value: unknown): VerificationItem[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'object' && item !== null) as VerificationItem[];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

export function OrgVerifications({
  orgId,
  verifications,
  canEdit,
}: {
  orgId: string;
  verifications: unknown;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => {
    const normalized = normalizeVerifications(verifications);
    return normalized.length > 0 ? JSON.stringify(normalized, null, 2) : '';
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const items = normalizeVerifications(verifications);

  useEffect(() => {
    const normalized = normalizeVerifications(verifications);
    setValue(normalized.length > 0 ? JSON.stringify(normalized, null, 2) : '');
  }, [verifications]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let payload: unknown = [];

    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        payload = parsed;
      } catch (parseError) {
        setError('Verifications must be valid JSON.');
        return;
      }
    }

    startTransition(async () => {
      await patchOrganization(orgId, { verifications: payload });
      router.refresh();
      setOpen(false);
    });
  }

  function statusColor(status: string) {
    switch (status) {
      case 'verified':
        return 'bg-emerald-100 text-emerald-800';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Verifications &amp; Audits</h3>
          <p className="text-sm text-muted-foreground">
            Build trust through verified audits, certifications, and transparent reporting.
          </p>
        </div>
        {canEdit && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary">
                {items.length > 0 ? 'Manage' : 'Add verifications'}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Edit verifications</SheetTitle>
              </SheetHeader>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="verifications" className="text-sm font-medium">
                    Verifications JSON
                  </label>
                  <textarea
                    id="verifications"
                    className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder='[{"type":"IT Security","status":"planned"}]'
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide an array of objects with <code>type</code> and <code>status</code> keys.
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

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Add verifications to showcase your organization’s commitments to security, governance, and
          impact.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={`${item.type}-${index}`}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{item.type}</p>
                <p className="text-xs text-muted-foreground">Verification</p>
              </div>
              <Badge className={`capitalize ${statusColor(item.status)}`}>{item.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
