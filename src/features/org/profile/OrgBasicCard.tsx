'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { patchOrganization } from '@/features/org/actions';
import type { OrgProfileRecord } from '@/features/org/data';
import { cn } from '@/lib/utils';
import { useOrgContext } from '@/features/org/context';

function normalizeLocations(value: unknown): Array<{ city?: string; country?: string }> {
  if (!value) return [];

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'object' && item !== null) as Array<{
      city?: string;
      country?: string;
    }>;
  }

  return [];
}

function formatDate(value: string | null) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long' }).format(date);
  } catch (error) {
    return '';
  }
}

export function OrgBasicCard({
  org,
  orgId,
  canEdit,
}: {
  org: OrgProfileRecord;
  orgId: string;
  canEdit: boolean;
}) {
  const { slug } = useOrgContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState(() => ({
    size: org.size ?? '',
    industry: org.industry ?? '',
    foundedDate: org.founded_date ?? '',
    legalForm: org.legal_form ?? '',
    locations: JSON.stringify(normalizeLocations(org.locations), null, 2) || '',
    websiteUrl: org.website_url ?? '',
  }));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormState({
      size: org.size ?? '',
      industry: org.industry ?? '',
      foundedDate: org.founded_date ?? '',
      legalForm: org.legal_form ?? '',
      locations: JSON.stringify(normalizeLocations(org.locations), null, 2) || '',
      websiteUrl: org.website_url ?? '',
    });
  }, [org.size, org.industry, org.founded_date, org.legal_form, org.locations, org.website_url]);

  const locations = useMemo(() => normalizeLocations(org.locations), [org.locations]);
  const formattedFounded = formatDate(org.founded_date);
  const basePath = `/o/${slug}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let parsedLocations: unknown = undefined;

    if (formState.locations.trim().length > 0) {
      try {
        const parsed = JSON.parse(formState.locations);
        parsedLocations = parsed;
      } catch (parseError) {
        setError('Locations must be valid JSON.');
        return;
      }
    } else {
      parsedLocations = [];
    }

    const payload: Record<string, unknown> = {};

    if (formState.size.trim()) payload.size = formState.size.trim();
    else payload.size = null;
    if (formState.industry.trim()) payload.industry = formState.industry.trim();
    else payload.industry = null;
    if (formState.foundedDate) payload.founded_date = formState.foundedDate;
    else payload.founded_date = null;
    if (formState.legalForm.trim()) payload.legal_form = formState.legalForm.trim();
    else payload.legal_form = null;
    if (formState.websiteUrl.trim()) payload.website_url = formState.websiteUrl.trim();
    else payload.website_url = null;
    payload.locations = parsedLocations;

    startTransition(async () => {
      await patchOrganization(orgId, payload);
      router.refresh();
      setOpen(false);
    });
  }

  const initials = useMemo(() => {
    if (org.display_name) {
      return org.display_name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]!.toUpperCase())
        .slice(0, 2)
        .join('');
    }
    return 'OR';
  }, [org.display_name]);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full border border-dashed bg-muted text-lg font-semibold uppercase',
              org.logo_url ? 'overflow-hidden border-transparent' : 'text-muted-foreground'
            )}
          >
            {org.logo_url ? (
              <Image
                src={org.logo_url}
                alt={`${org.display_name} logo`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <p className="text-sm uppercase text-muted-foreground tracking-wide">
              Your Organization
            </p>
            <h2 className="text-xl font-semibold">{org.display_name}</h2>
          </div>
        </div>
        {canEdit && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Edit organization details</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="size">
                    Organization size
                  </label>
                  <Input
                    id="size"
                    value={formState.size}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, size: event.target.value }))
                    }
                    placeholder="11-50 employees"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="industry">
                    Industry
                  </label>
                  <Input
                    id="industry"
                    value={formState.industry}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, industry: event.target.value }))
                    }
                    placeholder="Climate tech"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="founded-date">
                    Founded date
                  </label>
                  <Input
                    id="founded-date"
                    type="date"
                    value={formState.foundedDate}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, foundedDate: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="legal-form">
                    Legal form
                  </label>
                  <Input
                    id="legal-form"
                    value={formState.legalForm}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, legalForm: event.target.value }))
                    }
                    placeholder="Non-profit"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="locations">
                    Locations JSON
                  </label>
                  <textarea
                    id="locations"
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formState.locations}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, locations: event.target.value }))
                    }
                    placeholder='[{"city":"Stockholm","country":"SE"}]'
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide an array of objects with <code>city</code> and <code>country</code>{' '}
                    keys.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="website-url">
                    Website URL
                  </label>
                  <Input
                    id="website-url"
                    type="url"
                    value={formState.websiteUrl}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, websiteUrl: event.target.value }))
                    }
                    placeholder="https://your-organization.com"
                  />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Organization size</p>
          <p className="text-base font-medium">{org.size || 'Add size'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Industry</p>
          <p className="text-base font-medium">{org.industry || 'Add industry'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Founded</p>
          <p className="text-base font-medium">{formattedFounded || 'Add founded date'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Legal form</p>
          <p className="text-base font-medium">{org.legal_form || 'Add legal form'}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-sm text-muted-foreground">Locations</p>
          {locations.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-2 text-base font-medium">
              {locations.map((location, index) => (
                <li
                  key={`${location.city}-${location.country}-${index}`}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  {[location.city, location.country].filter(Boolean).join(', ') || 'Location'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base font-medium">Add locations</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`${basePath}/assignments`}
          className="text-primary underline-offset-2 hover:underline"
        >
          View Assignments
        </Link>
        <span aria-hidden="true" className="text-muted-foreground">
          |
        </span>
        {org.website_url ? (
          <a
            href={org.website_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            Visit Website
          </a>
        ) : (
          <span className="text-muted-foreground">Add website</span>
        )}
      </div>
    </Card>
  );
}
