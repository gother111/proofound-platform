'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/fetch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LocationInput, type LocationPreference } from './LocationInput';
import { CompensationInput, type CompensationRange } from './CompensationInput';
import { DateWindowInput, type DateWindow } from './DateWindowInput';
import { FocusAreasSection } from './FocusAreasSection';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { AlertCircle, BookOpen, ExternalLink } from 'lucide-react';
import { weightsFromProofSkillsBias } from '@/lib/core/matching/presets';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

interface MatchingProfileSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

const MATCHING_PROFILE_SAVE_FAILED_MESSAGE =
  'Assignment review preferences were not saved. Your preferences are still here; please review and try again.';

/**
 * Single-page setup for individual matching preferences.
 */
export function MatchingProfileSetup({ onComplete, onCancel }: MatchingProfileSetupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form state
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [desiredIndustries, setDesiredIndustries] = useState<string[]>([]);
  const [preferredIndustryKeys, setPreferredIndustryKeys] = useState<string[]>([]);
  const [preferredIndustryLabels, setPreferredIndustryLabels] = useState<string[]>([]);
  const [avoidIndustryKeys, setAvoidIndustryKeys] = useState<string[]>([]);
  const [avoidIndustryLabels, setAvoidIndustryLabels] = useState<string[]>([]);
  const [orgTypes, setOrgTypes] = useState<string[]>([]);
  const [weightBias, setWeightBias] = useState(50);

  const [location, setLocation] = useState<LocationPreference>({ workMode: '' });
  const [hoursMinInput, setHoursMinInput] = useState('10');
  const [hoursMaxInput, setHoursMaxInput] = useState('40');
  const [hoursValidationHint, setHoursValidationHint] = useState<string | null>(null);
  const [compensation, setCompensation] = useState<CompensationRange>({
    min: 0,
    max: 0,
    currency: 'USD',
    period: 'annual',
  });
  const [availability, setAvailability] = useState<DateWindow>({ earliest: '', latest: '' });
  const [engagementType, setEngagementType] = useState('');

  const handleFocusChange = (partial: {
    desiredRoles?: string[];
    desiredIndustries?: string[];
    preferredIndustryKeys?: string[];
    preferredIndustryLabels?: string[];
    avoidIndustryKeys?: string[];
    avoidIndustryLabels?: string[];
    orgTypes?: string[];
  }) => {
    if (partial.desiredRoles !== undefined) {
      setDesiredRoles(partial.desiredRoles);
    }
    if (partial.desiredIndustries !== undefined) {
      setDesiredIndustries(partial.desiredIndustries);
    }
    if (partial.preferredIndustryKeys !== undefined) {
      setPreferredIndustryKeys(partial.preferredIndustryKeys);
    }
    if (partial.preferredIndustryLabels !== undefined) {
      setPreferredIndustryLabels(partial.preferredIndustryLabels);
    }
    if (partial.avoidIndustryKeys !== undefined) {
      setAvoidIndustryKeys(partial.avoidIndustryKeys);
    }
    if (partial.avoidIndustryLabels !== undefined) {
      setAvoidIndustryLabels(partial.avoidIndustryLabels);
    }
    if (partial.orgTypes !== undefined) {
      setOrgTypes(partial.orgTypes);
    }
  };

  const parseHoursValue = (value: string): number | null => {
    if (value.trim() === '') {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  };

  const resolveHours = () => ({
    min: parseHoursValue(hoursMinInput),
    max: parseHoursValue(hoursMaxInput),
  });

  const validateWorkStepHours = () => {
    const { min, max } = resolveHours();
    const isValid = min !== null && max !== null && min > 0 && max > 0;

    if (!isValid) {
      setHoursValidationHint('Minimum desired hours is 1. Enter values above 0 to continue.');
      return false;
    }

    if (min > max) {
      setHoursValidationHint('Minimum desired hours must be lower than maximum desired hours.');
      return false;
    }

    setHoursValidationHint(null);
    return true;
  };

  const handleSubmit = async () => {
    setSaveError(null);

    if (!validateWorkStepHours()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { min: hoursMin, max: hoursMax } = resolveHours();
      if (hoursMin === null || hoursMax === null) {
        setHoursValidationHint('Minimum desired hours is 1. Enter values above 0 to continue.');
        return;
      }

      const weights = weightsFromProofSkillsBias(weightBias);
      const response = await apiFetch('/api/matching-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desiredRoles,
          desiredIndustries,
          preferredIndustryKeys,
          preferredIndustryLabels,
          avoidIndustryKeys,
          avoidIndustryLabels,
          orgTypes,
          workMode: location.workMode,
          country: location.country,
          city: location.city,
          radiusKm: location.radiusKm,
          hoursMin,
          hoursMax,
          compMin: compensation.min,
          compMax: compensation.max,
          compPeriod: compensation.period,
          currency: compensation.currency,
          availabilityEarliest: availability.earliest,
          availabilityLatest: availability.latest,
          engagementType,
          weights,
          weightBias,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: unknown;
          error?: unknown;
        };
        const diagnosticMessage =
          typeof errorData.message === 'string' && errorData.message.trim().length > 0
            ? errorData.message
            : typeof errorData.error === 'string' && errorData.error.trim().length > 0
              ? errorData.error
              : `Matching profile save failed with status ${response.status}`;

        dispatchClientErrorDiagnostic(
          'matching.profile_setup.save_failed',
          new Error(diagnosticMessage)
        );
        setSaveError(MATCHING_PROFILE_SAVE_FAILED_MESSAGE);
        toast.error(MATCHING_PROFILE_SAVE_FAILED_MESSAGE);
        return;
      }

      toast.success(
        'Preferences saved. You can keep using assignment reviews while you finish setup.'
      );
      onComplete();
      router.refresh();
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.profile_setup.save_failed', error);
      setSaveError(MATCHING_PROFILE_SAVE_FAILED_MESSAGE);
      toast.error(MATCHING_PROFILE_SAVE_FAILED_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2" style={{ color: '#2D3330' }}>
          Set up assignment review preferences
        </h2>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Save your focus, proof emphasis, and work preferences so assignment reviews stay relevant.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-proofound-stone bg-japandi-bg p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 text-proofound-forest" />
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              Public proof comes from your portfolio. Refresh work examples and proof there.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  '/app/i/profile?profileView=full&tab=proof_packs',
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              Review Proof Packs
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-proofound-stone bg-white p-4 space-y-4">
          <h3 className="text-lg font-medium text-foreground">Focus</h3>
          <FocusAreasSection
            profile={{
              desiredRoles,
              desiredIndustries,
              preferredIndustryKeys,
              preferredIndustryLabels,
              avoidIndustryKeys,
              avoidIndustryLabels,
              orgTypes,
            }}
            onChange={handleFocusChange}
          />
        </section>

        <section className="rounded-lg border border-proofound-stone bg-white p-4 space-y-3">
          <h3 className="text-lg font-medium text-foreground">Review emphasis</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Skills emphasis</span>
            <span className="font-medium text-foreground">Proof emphasis</span>
          </div>
          <Slider
            value={[weightBias]}
            onValueChange={(values) => setWeightBias(values[0] ?? 50)}
            min={0}
            max={100}
            step={1}
            aria-label="Proof vs skills weighting"
          />
          <p className="text-xs text-muted-foreground">
            Current emphasis:{' '}
            {weightBias < 40 ? 'skills-heavy' : weightBias > 60 ? 'proof-heavy' : 'even'} (
            {weightBias}%)
          </p>
        </section>

        <section className="rounded-lg border border-proofound-stone bg-white p-4 space-y-4">
          <h3 className="text-lg font-medium text-foreground">Work Preferences</h3>

          <LocationInput value={location} onChange={setLocation} />

          <div>
            <Label htmlFor="engagement-type">Engagement preference</Label>
            <select
              id="engagement-type"
              value={engagementType}
              onChange={(event) => setEngagementType(event.target.value)}
              className="mt-2 flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
            >
              <option value="">Select one</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract_consulting">Contract / consulting</option>
              <option value="fractional_project">Fractional / project</option>
            </select>
          </div>

          <div>
            <Label>Hours per Week</Label>
            <p className="mb-2 text-xs text-muted-foreground">Desired range (minimum to maximum)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="hours-min" className="text-xs" style={{ color: '#6B6760' }}>
                  Minimum desired
                </Label>
                <Input
                  id="hours-min"
                  type="number"
                  min="0"
                  value={hoursMinInput}
                  onChange={(e) => setHoursMinInput(e.target.value)}
                  placeholder="Min"
                />
              </div>
              <div>
                <Label htmlFor="hours-max" className="text-xs" style={{ color: '#6B6760' }}>
                  Maximum desired
                </Label>
                <Input
                  id="hours-max"
                  type="number"
                  min="0"
                  value={hoursMaxInput}
                  onChange={(e) => setHoursMaxInput(e.target.value)}
                  placeholder="Max"
                />
              </div>
            </div>
            {hoursValidationHint ? (
              <p className="mt-2 text-xs text-[#9A3412]">{hoursValidationHint}</p>
            ) : null}
          </div>

          <CompensationInput value={compensation} onChange={setCompensation} />

          <DateWindowInput value={availability} onChange={setAvailability} />
        </section>
      </div>

      {saveError ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{saveError}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 pb-20 sm:flex-row sm:pb-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Continue later
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{ backgroundColor: '#1C4D3A' }}
        >
          {isSubmitting ? 'Saving...' : 'Save and Continue'}
        </Button>
      </div>
    </div>
  );
}
