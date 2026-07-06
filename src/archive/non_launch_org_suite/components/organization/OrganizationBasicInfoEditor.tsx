'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';
import {
  createOrganizationDefaultPurposeLinks,
  normalizeOrganizationPurposeLinks,
  pruneOrganizationPurposeLinks,
} from '@/lib/organizations/normalizePurposeLinks';
import {
  LEGAL_FORM_OPTIONS,
  type LegalFormValue,
  LEGAL_FORM_VALUES,
  type OrganizationSizeValue,
  ORGANIZATION_SIZE_OPTIONS,
  ORGANIZATION_SIZE_VALUES,
} from '@/lib/organizations/profile-options';
import { INDUSTRY_OPTIONS, isIndustryKey, resolveIndustryFromInputs } from '@/lib/industry/options';
import { Plus, X } from 'lucide-react';
import type { PurposeLinks } from '@/types/profile';

interface OrganizationBasicInfoEditorProps {
  org: {
    id: string;
    displayName: string;
    legalName: string | null;
    tagline: string | null;
    mission: string | null;
    vision: string | null;
    missionLinks: PurposeLinks;
    visionLinks: PurposeLinks;
    industry: string | null;
    industryKey: string | null;
    industryLabel: string | null;
    industryLegacyText: string | null;
    organizationSize: string | null;
    impactArea: string | null;
    legalForm: string | null;
    foundedDate: string | null;
    website: string | null;
    values: string[] | null;
    causes: string[] | null;
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
  const [values, setValues] = useState<string[]>(() => normalizeOrganizationValues(org.values));
  const [newValue, setNewValue] = useState('');
  const [valueError, setValueError] = useState<string | null>(null);
  const [missionLinks, setMissionLinks] = useState<PurposeLinks>(() => {
    const initial = pruneOrganizationPurposeLinks(
      normalizeOrganizationPurposeLinks(org.missionLinks),
      normalizeOrganizationValues(org.values),
      org.causes ?? []
    );
    if (org.mission && (initial.values.length === 0 || initial.causes.length === 0)) {
      return createOrganizationDefaultPurposeLinks(org.values, org.causes ?? []);
    }
    return initial;
  });
  const [visionLinks, setVisionLinks] = useState<PurposeLinks>(() => {
    const initial = pruneOrganizationPurposeLinks(
      normalizeOrganizationPurposeLinks(org.visionLinks),
      normalizeOrganizationValues(org.values),
      org.causes ?? []
    );
    if (org.vision && (initial.values.length === 0 || initial.causes.length === 0)) {
      return createOrganizationDefaultPurposeLinks(org.values, org.causes ?? []);
    }
    return initial;
  });
  const [linksError, setLinksError] = useState<string | null>(null);

  const isOrganizationSizeValue = (value: string): value is OrganizationSizeValue =>
    ORGANIZATION_SIZE_VALUES.some((option) => option === value);
  const isLegalFormValue = (value: string): value is LegalFormValue =>
    LEGAL_FORM_VALUES.some((option) => option === value);
  const hasCauses = Array.isArray(org.causes) && org.causes.length > 0;
  const initialIndustry = resolveIndustryFromInputs({
    industryKey: org.industryKey,
    industryLabel: org.industryLabel,
    legacyIndustry: org.industry,
  });

  useEffect(() => {
    setMissionLinks((prev) => pruneOrganizationPurposeLinks(prev, values, org.causes ?? []));
    setVisionLinks((prev) => pruneOrganizationPurposeLinks(prev, values, org.causes ?? []));
  }, [values, org.causes]);

  const toggleLink = (
    links: PurposeLinks,
    group: 'values' | 'causes',
    option: string
  ): PurposeLinks => {
    const current = links[group];
    return {
      ...links,
      [group]: current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    };
  };

  const handleAddValue = () => {
    const trimmed = newValue.trim();

    if (!trimmed) {
      setValueError('Value cannot be empty.');
      return;
    }

    if (values.includes(trimmed)) {
      setValueError('Value already added.');
      return;
    }

    if (values.length >= 5) {
      setValueError('Maximum of 5 core values allowed.');
      return;
    }

    setValues((prev) => [...prev, trimmed]);
    setNewValue('');
    setValueError(null);
    setLinksError(null);
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setValues((prev) => prev.filter((value) => value !== valueToRemove));
    setValueError(null);
    setLinksError(null);
  };

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
    const industryKeyRaw = String(formData.get('industryKey') ?? '').trim();
    const organizationSizeRaw = String(formData.get('organizationSize') ?? '').trim();
    const impactArea = String(formData.get('impactArea') ?? '').trim();
    const legalFormRaw = String(formData.get('legalForm') ?? '').trim();
    const foundedDateRaw = String(formData.get('foundedDate') ?? '').trim();
    const websiteInput = String(formData.get('website') ?? '');
    const hasValues = values.length > 0;
    const isSettingPurpose = mission.length > 0 || vision.length > 0;
    const missionLinksValid =
      mission.length === 0 || (missionLinks.values.length > 0 && missionLinks.causes.length > 0);
    const visionLinksValid =
      vision.length === 0 || (visionLinks.values.length > 0 && visionLinks.causes.length > 0);

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
    const selectedIndustryKey = isIndustryKey(industryKeyRaw)
      ? industryKeyRaw
      : initialIndustry.industryKey;
    const selectedIndustryLabel = INDUSTRY_OPTIONS.find(
      (option) => option.key === selectedIndustryKey
    )?.label;

    const normalizedWebsite = normalizeOrganizationWebsite(websiteInput);
    if (normalizedWebsite.error) {
      toast({
        title: 'Validation error',
        description: normalizedWebsite.error,
        variant: 'destructive',
      });
      return;
    }

    if (isSettingPurpose && (!hasValues || !hasCauses)) {
      const missingRequirements: string[] = [];
      if (!hasValues) {
        missingRequirements.push('at least one core value');
      }
      if (!hasCauses) {
        missingRequirements.push('at least one cause');
      }

      toast({
        title: 'Missing prerequisites',
        description: `Add ${missingRequirements.join(' and ')} before setting mission or vision.`,
        variant: 'destructive',
      });
      return;
    }

    if (!missionLinksValid || !visionLinksValid) {
      setLinksError(
        'Select at least one linked value and one linked cause for each non-empty mission or vision.'
      );
      toast({
        title: 'Missing mission/vision links',
        description:
          'Select at least one linked value and one linked cause for each non-empty mission or vision.',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    setLinksError(null);
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
          industry: selectedIndustryLabel || null,
          industryKey: selectedIndustryKey,
          industryLabel: selectedIndustryLabel || null,
          organizationSize,
          impactArea: impactArea || null,
          legalForm,
          foundedDate,
          website: normalizedWebsite.value,
          values: values.length > 0 ? values : null,
          missionLinks,
          visionLinks,
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
    <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
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
            <Label className="text-proofound-charcoal dark:text-foreground">Core Values</Label>
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1 mb-3">
              Add at least one value before setting mission or vision. Maximum 5 values.
            </p>
            {values.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {values.map((value) => (
                  <Badge key={value} variant="outline" className="gap-1.5 py-1">
                    {value}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(value)}
                      className="inline-flex items-center"
                      aria-label={`Remove ${value}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Input
                id="newCoreValue"
                name="newCoreValue"
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder="Add core value (for example: Integrity)"
                className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
                maxLength={80}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddValue();
                  }
                }}
                aria-label="Add Core Value"
                disabled={values.length >= 5}
              />
              <Button
                type="button"
                onClick={handleAddValue}
                variant="outline"
                disabled={values.length >= 5}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Value
              </Button>
            </div>
            <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground/60 mt-1">
              {values.length}/5 values added
            </p>
            {valueError ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{valueError}</p>
            ) : null}
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-3">
              {hasCauses
                ? 'Causes prerequisite is met.'
                : 'Add at least one cause in the Causes panel before setting mission or vision.'}
            </p>
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
            <div className="mt-3 space-y-2">
              <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
                Link mission to at least one value and one cause.
              </p>
              <div className="space-y-2" data-testid="org-mission-values-links">
                <Label className="text-xs">Linked Values</Label>
                <div className="flex flex-wrap gap-2">
                  {values.map((option) => {
                    const selected = missionLinks.values.includes(option);
                    return (
                      <Button
                        key={`mission-value-${option}`}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        onClick={() => {
                          setMissionLinks((prev) => toggleLink(prev, 'values', option));
                          setLinksError(null);
                        }}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2" data-testid="org-mission-causes-links">
                <Label className="text-xs">Linked Causes</Label>
                <div className="flex flex-wrap gap-2">
                  {(org.causes ?? []).map((option) => {
                    const selected = missionLinks.causes.includes(option);
                    return (
                      <Button
                        key={`mission-cause-${option}`}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        onClick={() => {
                          setMissionLinks((prev) => toggleLink(prev, 'causes', option));
                          setLinksError(null);
                        }}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
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
            <div className="mt-3 space-y-2">
              <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
                Link vision to at least one value and one cause.
              </p>
              <div className="space-y-2" data-testid="org-vision-values-links">
                <Label className="text-xs">Linked Values</Label>
                <div className="flex flex-wrap gap-2">
                  {values.map((option) => {
                    const selected = visionLinks.values.includes(option);
                    return (
                      <Button
                        key={`vision-value-${option}`}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        onClick={() => {
                          setVisionLinks((prev) => toggleLink(prev, 'values', option));
                          setLinksError(null);
                        }}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2" data-testid="org-vision-causes-links">
                <Label className="text-xs">Linked Causes</Label>
                <div className="flex flex-wrap gap-2">
                  {(org.causes ?? []).map((option) => {
                    const selected = visionLinks.causes.includes(option);
                    return (
                      <Button
                        key={`vision-cause-${option}`}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        onClick={() => {
                          setVisionLinks((prev) => toggleLink(prev, 'causes', option));
                          setLinksError(null);
                        }}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {linksError ? (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{linksError}</p>
          ) : null}

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
            <Label htmlFor="industryKey" className="text-proofound-charcoal dark:text-foreground">
              Industry
            </Label>
            <select
              id="industryKey"
              name="industryKey"
              defaultValue={initialIndustry.industryKey}
              className="flex h-11 w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
            >
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
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
