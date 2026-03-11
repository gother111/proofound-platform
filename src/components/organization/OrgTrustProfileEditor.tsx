'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api/fetch';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';

type OrgTrustProfileEditorProps = {
  org: {
    id: string;
    displayName: string;
    tagline: string | null;
    mission: string | null;
    website: string | null;
    values: string[] | null;
  };
  canEdit: boolean;
};

export function OrgTrustProfileEditor({ org, canEdit }: OrgTrustProfileEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(org.displayName);
  const [tagline, setTagline] = useState(org.tagline ?? '');
  const [mission, setMission] = useState(org.mission ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [values, setValues] = useState(() => normalizeOrganizationValues(org.values));
  const [nextValue, setNextValue] = useState('');
  const [isPending, setIsPending] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    return (
      displayName !== org.displayName ||
      tagline !== (org.tagline ?? '') ||
      mission !== (org.mission ?? '') ||
      website !== (org.website ?? '') ||
      JSON.stringify(values) !== JSON.stringify(normalizeOrganizationValues(org.values))
    );
  }, [
    displayName,
    mission,
    org.displayName,
    org.mission,
    org.tagline,
    org.values,
    org.website,
    tagline,
    values,
    website,
  ]);

  const handleAddValue = () => {
    const normalized = nextValue.trim();
    if (!normalized) {
      return;
    }
    if (values.includes(normalized)) {
      setNextValue('');
      return;
    }
    if (values.length >= 5) {
      toast({
        title: 'Too many values',
        description: 'Keep the launch trust profile to 5 values or fewer.',
        variant: 'destructive',
      });
      return;
    }
    setValues((current) => [...current, normalized]);
    setNextValue('');
  };

  const handleRemoveValue = (value: string) => {
    setValues((current) => current.filter((item) => item !== value));
  };

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
          website: website || null,
          values,
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
          Keep the org launch story tight: what you do, why someone should join, the mission you are
          advancing, and the values candidates should expect.
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
            <Label htmlFor="org-website">Public website</Label>
            <Input
              id="org-website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              disabled={!canEdit || isPending}
              placeholder="https://example.org"
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label>Core values</Label>
              <p className="text-sm text-muted-foreground">
                Keep the MVP profile to the values that should visibly shape selection and review.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => (
                <Badge key={value} variant="secondary" className="gap-1 pr-1">
                  {value}
                  {canEdit ? (
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10"
                      onClick={() => handleRemoveValue(value)}
                      aria-label={`Remove ${value}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </Badge>
              ))}
              {values.length === 0 ? (
                <p className="text-sm text-muted-foreground">No core values added yet.</p>
              ) : null}
            </div>
            {canEdit ? (
              <div className="flex gap-2">
                <Input
                  value={nextValue}
                  onChange={(event) => setNextValue(event.target.value)}
                  disabled={isPending}
                  placeholder="Add a core value"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddValue}
                  disabled={isPending || values.length >= 5}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            ) : null}
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
