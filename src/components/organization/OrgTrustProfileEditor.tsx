'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api/fetch';

type OrgTrustProfileEditorProps = {
  org: {
    id: string;
    displayName: string;
    whyWorkMatters: string | null;
    mission: string | null;
    operatingContext: string | null;
    website: string | null;
  };
  canEdit: boolean;
};

export function OrgTrustProfileEditor({ org, canEdit }: OrgTrustProfileEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(org.displayName);
  const [whyWorkMatters, setWhyWorkMatters] = useState(org.whyWorkMatters ?? '');
  const [mission, setMission] = useState(org.mission ?? '');
  const [operatingContext, setOperatingContext] = useState(org.operatingContext ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [isPending, setIsPending] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    return (
      displayName !== org.displayName ||
      whyWorkMatters !== (org.whyWorkMatters ?? '') ||
      mission !== (org.mission ?? '') ||
      operatingContext !== (org.operatingContext ?? '') ||
      website !== (org.website ?? '')
    );
  }, [
    displayName,
    mission,
    org.displayName,
    org.mission,
    org.operatingContext,
    org.website,
    org.whyWorkMatters,
    operatingContext,
    website,
    whyWorkMatters,
  ]);
  const fieldReadiness = [
    { label: 'Name', ready: Boolean(displayName.trim()) },
    { label: 'Why it matters', ready: Boolean(whyWorkMatters.trim()) },
    { label: 'Mission', ready: Boolean(mission.trim()) },
    { label: 'Operating context', ready: Boolean(operatingContext.trim()) },
    { label: 'Domain path', ready: Boolean(website.trim()) },
  ];
  const readyFieldCount = fieldReadiness.filter((item) => item.ready).length;
  const saveButtonLabel = isPending
    ? 'Saving...'
    : hasUnsavedChanges
      ? 'Save organization profile'
      : 'No changes to save';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    if (!displayName.trim()) {
      toast({
        title: 'Missing organization name',
        description: 'Display name is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    try {
      const response = await apiFetch(`/api/organizations/${org.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalContext: {
            principalType: 'organization',
            orgId: org.id,
          },
          displayName,
          whyWorkMatters: whyWorkMatters || null,
          mission: mission || null,
          operatingContext: operatingContext || null,
          website: website || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Failed to update organization profile');
      }

      toast({
        title: 'Organization profile updated',
        description: 'The launch-facing organization profile has been saved.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Unable to save organization profile',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="border-black/[0.04] dark:border-white/5">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Organization profile</CardTitle>
            <CardDescription className="max-w-2xl leading-6">
              Keep the launch story narrow and credible: org name, verified domain path, mission,
              why the work matters, and the essential operating context.
            </CardDescription>
          </div>
          <div className="rounded-full bg-proofound-forest px-3 py-1 text-xs font-medium text-white">
            {readyFieldCount}/{fieldReadiness.length} ready
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org-display-name">Organization name</Label>
              <Input
                id="org-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={!canEdit || isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-why-work-matters">Why this work matters</Label>
              <Textarea
                id="org-why-work-matters"
                value={whyWorkMatters}
                onChange={(event) => setWhyWorkMatters(event.target.value)}
                disabled={!canEdit || isPending}
                rows={4}
                placeholder="Explain why the work matters in practical terms."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-mission">Mission</Label>
              <Textarea
                id="org-mission"
                value={mission}
                onChange={(event) => setMission(event.target.value)}
                disabled={!canEdit || isPending}
                rows={6}
                placeholder="Explain the mission this assignment path supports."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-operating-context">Essential operating context</Label>
              <Textarea
                id="org-operating-context"
                value={operatingContext}
                onChange={(event) => setOperatingContext(event.target.value)}
                disabled={!canEdit || isPending}
                rows={8}
                placeholder="Describe the real operating environment candidates should understand."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-website">Verified website or domain path</Label>
              <Input
                id="org-website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                disabled={!canEdit || isPending}
                placeholder="https://example.org/team"
              />
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-proofound-stone/70 bg-proofound-parchment/45 p-4">
              <p className="text-sm font-medium text-proofound-charcoal">Launch essentials</p>
              <div className="mt-3 space-y-2">
                {fieldReadiness.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    {item.ready ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span
                      className={item.ready ? 'text-proofound-charcoal' : 'text-muted-foreground'}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Review starts cleaner when these basics are present before the first assignment.
              </p>
            </div>
            {canEdit ? (
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isPending || !hasUnsavedChanges}>
                  {saveButtonLabel}
                </Button>
                {!hasUnsavedChanges ? (
                  <p className="text-center text-xs text-muted-foreground">
                    Edit a field to enable saving.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
