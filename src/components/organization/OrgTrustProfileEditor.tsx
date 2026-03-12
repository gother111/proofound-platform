'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    tagline: string | null;
    mission: string | null;
    workingContext: string | null;
    hiringProcessSummary: string | null;
    website: string | null;
  };
  canEdit: boolean;
};

export function OrgTrustProfileEditor({ org, canEdit }: OrgTrustProfileEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(org.displayName);
  const [tagline, setTagline] = useState(org.tagline ?? '');
  const [mission, setMission] = useState(org.mission ?? '');
  const [workingContext, setWorkingContext] = useState(org.workingContext ?? '');
  const [hiringProcessSummary, setHiringProcessSummary] = useState(org.hiringProcessSummary ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [isPending, setIsPending] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    return (
      displayName !== org.displayName ||
      tagline !== (org.tagline ?? '') ||
      mission !== (org.mission ?? '') ||
      workingContext !== (org.workingContext ?? '') ||
      hiringProcessSummary !== (org.hiringProcessSummary ?? '') ||
      website !== (org.website ?? '')
    );
  }, [
    displayName,
    hiringProcessSummary,
    mission,
    org.displayName,
    org.hiringProcessSummary,
    org.mission,
    org.tagline,
    org.website,
    tagline,
    website,
    workingContext,
    org.workingContext,
  ]);

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
          tagline: tagline || null,
          mission: mission || null,
          workingContext: workingContext || null,
          hiringProcessSummary: hiringProcessSummary || null,
          website: website || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Failed to update trust profile');
      }

      toast({
        title: 'Trust profile updated',
        description: 'The launch-facing org trust profile has been saved.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Unable to save trust profile',
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
        <CardTitle>Trust profile</CardTitle>
        <CardDescription>
          Keep the launch story narrow and practical: mission, why the work matters, working
          context, and how seriously the team handles hiring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
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
            <Label htmlFor="org-tagline">Why join</Label>
            <Textarea
              id="org-tagline"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              disabled={!canEdit || isPending}
              rows={3}
              placeholder="Describe the opportunity in one concise paragraph."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-mission">Mission</Label>
            <Textarea
              id="org-mission"
              value={mission}
              onChange={(event) => setMission(event.target.value)}
              disabled={!canEdit || isPending}
              rows={4}
              placeholder="Explain the mission this assignment path supports."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-working-context">Working context</Label>
            <Textarea
              id="org-working-context"
              value={workingContext}
              onChange={(event) => setWorkingContext(event.target.value)}
              disabled={!canEdit || isPending}
              rows={4}
              placeholder="Describe the day-to-day context, team setup, or operating environment."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-hiring-process-summary">Hiring process clarity</Label>
            <Textarea
              id="org-hiring-process-summary"
              value={hiringProcessSummary}
              onChange={(event) => setHiringProcessSummary(event.target.value)}
              disabled={!canEdit || isPending}
              rows={4}
              placeholder="Explain how the team reviews assignments, evidence, and internal sign-off before publish."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-website">Public website</Label>
            <Input
              id="org-website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              disabled={!canEdit || isPending}
              placeholder="https://example.org"
            />
          </div>

          {canEdit ? (
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || !hasUnsavedChanges}>
                {isPending ? 'Saving...' : 'Save trust profile'}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
