'use client';

import { FormEvent, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import {
  LEGAL_FORM_OPTIONS,
  type LegalFormValue,
  LEGAL_FORM_VALUES,
  type OrganizationSizeValue,
  ORGANIZATION_SIZE_OPTIONS,
  ORGANIZATION_SIZE_VALUES,
} from '@/lib/organizations/profile-options';

interface OrganizationBasicInfoEditorProps {
  org: {
    id: string;
    displayName: string;
    legalName: string | null;
    tagline: string | null;
    mission: string | null;
    vision: string | null;
    industry: string | null;
    organizationSize: string | null;
    impactArea: string | null;
    legalForm: string | null;
    foundedDate: string | null;
    website: string | null;
  };
  canEdit: boolean;
  onSaved?: () => void;
}

export function OrganizationBasicInfoEditor({
  org,
  canEdit,
  onSaved,
}: OrganizationBasicInfoEditorProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const isOrganizationSizeValue = (value: string): value is OrganizationSizeValue =>
    ORGANIZATION_SIZE_VALUES.some((option) => option === value);
  const isLegalFormValue = (value: string): value is LegalFormValue =>
    LEGAL_FORM_VALUES.some((option) => option === value);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get('displayName') ?? '').trim();
    const legalName = String(formData.get('legalName') ?? '').trim();
    const tagline = String(formData.get('tagline') ?? '').trim();
    const mission = String(formData.get('mission') ?? '').trim();
    const vision = String(formData.get('vision') ?? '').trim();
    const industry = String(formData.get('industry') ?? '').trim();
    const organizationSizeRaw = String(formData.get('organizationSize') ?? '').trim();
    const impactArea = String(formData.get('impactArea') ?? '').trim();
    const legalFormRaw = String(formData.get('legalForm') ?? '').trim();
    const foundedDateRaw = String(formData.get('foundedDate') ?? '').trim();
    const websiteInput = String(formData.get('website') ?? '');

    if (!displayName) {
      toast({
        title: 'Validation error',
        description: 'Organization name is required.',
        variant: 'destructive',
      });
      return;
    }

    const organizationSize =
      organizationSizeRaw && isOrganizationSizeValue(organizationSizeRaw)
        ? organizationSizeRaw
        : null;
    const legalForm = legalFormRaw && isLegalFormValue(legalFormRaw) ? legalFormRaw : null;
    const foundedDate = foundedDateRaw || null;

    const normalizedWebsite = normalizeOrganizationWebsite(websiteInput);
    if (normalizedWebsite.error) {
      toast({
        title: 'Validation error',
        description: normalizedWebsite.error,
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
          displayName,
          legalName: legalName || null,
          tagline: tagline || null,
          mission: mission || null,
          vision: vision || null,
          industry: industry || null,
          organizationSize,
          impactArea: impactArea || null,
          legalForm,
          foundedDate,
          website: normalizedWebsite.value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          typeof errorData?.error === 'string' ? errorData.error : 'Failed to update organization.';
        throw new Error(message);
      }

      toast({
        title: 'Organization updated',
        description: 'Basic information has been saved successfully.',
      });
      router.refresh();
      onSaved?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update organization.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  }

  if (!canEdit) return null;

  return (
    <Card className="border-proofound-stone dark:border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="font-display text-proofound-charcoal dark:text-foreground">
          Edit Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="displayName" className="text-proofound-charcoal dark:text-foreground">
              Organization Name
            </Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={org.displayName}
              placeholder="Organization Name"
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
          </div>

          <div>
            <Label htmlFor="legalName" className="text-proofound-charcoal dark:text-foreground">
              Legal Name (Optional)
            </Label>
            <Input
              id="legalName"
              name="legalName"
              defaultValue={org.legalName || ''}
              placeholder="Legal company name"
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
          </div>

          <div>
            <Label htmlFor="mission" className="text-proofound-charcoal dark:text-foreground">
              Mission Statement
            </Label>
            <textarea
              id="mission"
              name="mission"
              defaultValue={org.mission || ''}
              placeholder="Describe your organization's mission and goals"
              className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
              maxLength={2000}
            />
          </div>

          <div>
            <Label htmlFor="tagline" className="text-proofound-charcoal dark:text-foreground">
              Tagline
            </Label>
            <Input
              id="tagline"
              name="tagline"
              defaultValue={org.tagline || ''}
              placeholder="A concise statement of your organization purpose"
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="vision" className="text-proofound-charcoal dark:text-foreground">
              Vision Statement
            </Label>
            <textarea
              id="vision"
              name="vision"
              defaultValue={org.vision || ''}
              placeholder="Describe your organization's long-term vision and aspirations"
              className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
              maxLength={2000}
            />
            <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground/60 mt-1">
              Max 300 characters recommended
            </p>
          </div>

          <div>
            <Label htmlFor="website" className="text-proofound-charcoal dark:text-foreground">
              Website
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={org.website || ''}
              placeholder="https://your-organization.com"
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
          </div>

          <div>
            <Label htmlFor="industry" className="text-proofound-charcoal dark:text-foreground">
              Industry
            </Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={org.industry || ''}
              placeholder="Primary industry or sector"
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
          </div>

          <div>
            <Label
              htmlFor="organizationSize"
              className="text-proofound-charcoal dark:text-foreground"
            >
              Organization Size
            </Label>
            <select
              id="organizationSize"
              name="organizationSize"
              defaultValue={org.organizationSize || ''}
              className="flex h-11 w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
            >
              <option value="">Select size</option>
              {ORGANIZATION_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="impactArea" className="text-proofound-charcoal dark:text-foreground">
              Impact Area
            </Label>
            <Input
              id="impactArea"
              name="impactArea"
              defaultValue={org.impactArea || ''}
              placeholder="Primary area of impact"
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
          </div>

          <div>
            <Label htmlFor="legalForm" className="text-proofound-charcoal dark:text-foreground">
              Legal Form
            </Label>
            <select
              id="legalForm"
              name="legalForm"
              defaultValue={org.legalForm || ''}
              className="flex h-11 w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
            >
              <option value="">Select legal form</option>
              {LEGAL_FORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="foundedDate" className="text-proofound-charcoal dark:text-foreground">
              Founded Date
            </Label>
            <Input
              id="foundedDate"
              name="foundedDate"
              type="date"
              defaultValue={org.foundedDate || ''}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
          </div>

          <Button
            type="submit"
            className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
            disabled={isPending}
            data-testid="org-basic-info-save"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
