'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/fetch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { TypeaheadChips, type TypeaheadOption } from './TypeaheadChips';
import { CEFRLanguageRow, type LanguageProficiency } from './CEFRLanguageRow';
import { LocationInput, type LocationPreference } from './LocationInput';
import { CompensationInput, type CompensationRange } from './CompensationInput';
import { DateWindowInput, type DateWindow } from './DateWindowInput';
import { FocusAreasSection } from './FocusAreasSection';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { BookOpen, ExternalLink, Plus } from 'lucide-react';
import { weightsFromMissionSkillsBias } from '@/lib/core/matching/presets';

interface MatchingProfileSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Multi-step wizard for setting up matching profile (individuals).
 */
export function MatchingProfileSetup({ onComplete, onCancel }: MatchingProfileSetupProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('atlas-skills');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [valuesTags, setValuesTags] = useState<string[]>([]);
  const [causeTags, setCauseTags] = useState<string[]>([]);
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [desiredIndustries, setDesiredIndustries] = useState<string[]>([]);
  const [orgTypes, setOrgTypes] = useState<string[]>([]);
  const [weightBias, setWeightBias] = useState(50);
  const [location, setLocation] = useState<LocationPreference>({ workMode: '' });
  const [hoursMin, setHoursMin] = useState(10);
  const [hoursMax, setHoursMax] = useState(40);
  const [compensation, setCompensation] = useState<CompensationRange>({
    min: 0,
    max: 0,
    currency: 'USD',
  });
  const [availability, setAvailability] = useState<DateWindow>({ earliest: '', latest: '' });
  const [languages, setLanguages] = useState<LanguageProficiency[]>([]);

  // Taxonomy options (will be fetched from API)
  const [valuesOptions, setValuesOptions] = useState<TypeaheadOption[]>([]);
  const [causesOptions, setCausesOptions] = useState<TypeaheadOption[]>([]);
  const [atlasSkillCount, setAtlasSkillCount] = useState<number | null>(null);
  const [sampleMatches, setSampleMatches] = useState<
    Array<{ title: string; reason: string; score: number }>
  >([]);
  const [sampleSource, setSampleSource] = useState<'real' | 'mock'>('mock');
  const [sampleLoading, setSampleLoading] = useState(false);

  // Fetch taxonomies + Atlas skill stats
  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        const [valuesRes, causesRes, statsRes] = await Promise.all([
          apiFetch('/api/taxonomy/values'),
          apiFetch('/api/taxonomy/causes'),
          apiFetch('/api/expertise/stats'),
        ]);

        const [valuesData, causesData, statsData] = await Promise.all([
          valuesRes.json(),
          causesRes.json(),
          statsRes.ok ? statsRes.json() : Promise.resolve({ totalL4Skills: null }),
        ]);

        setValuesOptions(valuesData.items || []);
        setCausesOptions(causesData.items || []);
        setAtlasSkillCount(
          typeof statsData.totalL4Skills === 'number' ? statsData.totalL4Skills : null
        );
      } catch (error) {
        toast.error('Failed to load setup data');
      }
    };

    fetchSetupData();
  }, []);

  useEffect(() => {
    const fallbackSamples = [
      {
        title: desiredRoles[0] || 'Impact-focused product role',
        reason: 'Strong values and causes overlap with one or more active organizations.',
        score: 0.72,
      },
      {
        title: desiredIndustries[0]
          ? `${desiredIndustries[0]} opportunity`
          : 'Mission-aligned engineering assignment',
        reason: 'Your selected work preferences and language profile are compatible.',
        score: 0.64,
      },
      {
        title:
          orgTypes[0] === 'ngo'
            ? 'NGO transformation project'
            : orgTypes[0] === 'startup'
              ? 'Startup product build assignment'
              : 'Cross-functional growth assignment',
        reason: 'Skills and practical constraints are close enough to start conversations.',
        score: 0.58,
      },
    ];

    const loadSampleMatches = async () => {
      setSampleLoading(true);
      let usedRealMatches = false;
      try {
        const response = await apiFetch('/api/core/matching/near-matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ k: 3, threshold: 0.2 }),
        });

        if (response.ok) {
          const payload = await response.json();
          const realItems = Array.isArray(payload?.items)
            ? payload.items.slice(0, 3).map((item: any) => ({
                title: item?.assignment?.role || 'Opportunity',
                reason: item?.reason || 'Near match based on your current profile data.',
                score: typeof item?.score === 'number' ? item.score : 0,
              }))
            : [];

          if (realItems.length > 0) {
            setSampleMatches(realItems);
            setSampleSource('real');
            usedRealMatches = true;
          }
        }
      } catch (error) {
        console.error('Failed to load sample matches', error);
      } finally {
        if (!usedRealMatches) {
          setSampleMatches(fallbackSamples);
          setSampleSource('mock');
        }
        setSampleLoading(false);
      }
    };

    void loadSampleMatches();
  }, [desiredIndustries, desiredRoles, orgTypes]);

  // Add language
  const handleAddLanguage = () => {
    setLanguages([...languages, { code: 'en', level: 'B2' }]);
  };

  const handleFocusChange = (partial: {
    desiredRoles?: string[];
    desiredIndustries?: string[];
    orgTypes?: string[];
  }) => {
    if (partial.desiredRoles) {
      setDesiredRoles(partial.desiredRoles);
    }
    if (partial.desiredIndustries) {
      setDesiredIndustries(partial.desiredIndustries);
    }
    if (partial.orgTypes) {
      setOrgTypes(partial.orgTypes);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 5;

    if (valuesTags.length >= 3) completed++;
    if (desiredRoles.length > 0 || desiredIndustries.length > 0 || orgTypes.length > 0) completed++;
    if (location.workMode && availability.earliest && availability.latest) completed++;
    if (languages.length > 0) completed++;
    if (compensation.min > 0 && compensation.max > 0) completed++;

    return (completed / total) * 100;
  };

  const progress = calculateProgress();

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (valuesTags.length < 3) {
      toast.error('Please select at least 3 values');
      setCurrentTab('values');
      return;
    }

    setIsSubmitting(true);

    try {
      const weights = weightsFromMissionSkillsBias(weightBias);
      const response = await apiFetch('/api/matching-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desiredRoles,
          desiredIndustries,
          orgTypes,
          valuesTags,
          causeTags,
          workMode: location.workMode,
          country: location.country,
          city: location.city,
          radiusKm: location.radiusKm,
          hoursMin,
          hoursMax,
          compMin: compensation.min,
          compMax: compensation.max,
          currency: compensation.currency,
          availabilityEarliest: availability.earliest,
          availabilityLatest: availability.latest,
          languages,
          weights,
          weightBias,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || errorData.error || 'Failed to save matching profile';

        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success('Matching profile activated!');
      onComplete();
      router.refresh();
    } catch (error) {
      // Only show error toast if we haven't already shown one
      if (error instanceof Error && !error.message.includes('Failed to save')) {
        toast.error(error.message || 'Failed to save matching profile');
      } else if (!(error instanceof Error)) {
        toast.error('Failed to save matching profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2" style={{ color: '#2D3330' }}>
          Set Up Your Matching Profile
        </h2>
        <Progress value={progress} className="h-2" />
        <p className="text-sm mt-2" style={{ color: '#6B6760' }}>
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Wizard tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="atlas-skills">Atlas Skills</TabsTrigger>
          <TabsTrigger value="focus-weights">Focus & Weights</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* Step 1: Atlas Skills Source */}
        <TabsContent value="atlas-skills" className="space-y-4">
          <div className="rounded-lg border border-[#E5E3DA] bg-[#F7F6F1] p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 text-[#1C4D3A]" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-[#2D3330]">
                  Skills come from Expertise Atlas
                </h3>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  Matching now uses your Expertise Atlas as the single source of truth for skills.
                  Edit skills, proofs, and verification there.
                </p>
                <p className="text-sm" style={{ color: '#2D3330' }}>
                  Current Atlas skills:{' '}
                  <strong>{atlasSkillCount === null ? 'Loading…' : atlasSkillCount}</strong>
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open('/app/i/expertise', '_blank', 'noopener,noreferrer')}
                >
                  Open Expertise Atlas
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={() => setCurrentTab('focus-weights')}>Next: Focus & Weights</Button>
        </TabsContent>

        {/* Step 2: Focus and Weights */}
        <TabsContent value="focus-weights" className="space-y-5">
          <FocusAreasSection
            profile={{ desiredRoles, desiredIndustries, orgTypes }}
            onChange={handleFocusChange}
          />

          <div className="space-y-3 rounded-lg border border-[#E5E3DA] bg-[#F7F6F1] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#2D3330]">Skills-first</span>
              <span className="font-medium text-[#2D3330]">Mission-first</span>
            </div>
            <Slider
              value={[weightBias]}
              onValueChange={(values) => setWeightBias(values[0] ?? 50)}
              min={0}
              max={100}
              step={1}
              aria-label="Mission vs skills weighting"
            />
            <p className="text-xs text-[#6B6760]">
              Current emphasis:{' '}
              {weightBias < 40 ? 'Skills-first' : weightBias > 60 ? 'Mission-first' : 'Balanced'} (
              {weightBias}%)
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('atlas-skills')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('values')}>Next: Values & Causes</Button>
          </div>
        </TabsContent>

        {/* Step 3: Values & Causes */}
        <TabsContent value="values" className="space-y-4">
          <div>
            <Label>Your Top Values (Select 3-5)</Label>
            <TypeaheadChips
              options={valuesOptions}
              value={valuesTags}
              onChange={setValuesTags}
              placeholder="Search values..."
              maxSelections={5}
            />
          </div>

          <div>
            <Label>Causes You Care About</Label>
            <TypeaheadChips
              options={causesOptions}
              value={causeTags}
              onChange={setCauseTags}
              placeholder="Search causes..."
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('focus-weights')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('work')}>Next: Work Preferences</Button>
          </div>
        </TabsContent>

        {/* Step 4: Work Preferences */}
        <TabsContent value="work" className="space-y-4">
          <LocationInput value={location} onChange={setLocation} />

          <div>
            <Label>Hours per Week</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min="1"
                value={hoursMin}
                onChange={(e) => setHoursMin(parseInt(e.target.value, 10) || 1)}
                placeholder="Min"
              />
              <Input
                type="number"
                min="1"
                value={hoursMax}
                onChange={(e) => setHoursMax(parseInt(e.target.value, 10) || 40)}
                placeholder="Max"
              />
            </div>
          </div>

          <CompensationInput value={compensation} onChange={setCompensation} />

          <DateWindowInput value={availability} onChange={setAvailability} />

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('values')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('languages')}>Next: Languages</Button>
          </div>
        </TabsContent>

        {/* Step 5: Languages */}
        <TabsContent value="languages" className="space-y-4">
          <div>
            <Label>Languages & Proficiency</Label>
            <p className="text-sm mb-3" style={{ color: '#6B6760' }}>
              Add languages you can work in with your CEFR level (A1-C2).
            </p>

            <div className="space-y-3 mb-3">
              {languages.map((lang, index) => (
                <CEFRLanguageRow
                  key={index}
                  language={lang}
                  onChange={(updated) => {
                    const newLangs = [...languages];
                    newLangs[index] = updated;
                    setLanguages(newLangs);
                  }}
                  onRemove={() => setLanguages(languages.filter((_, i) => i !== index))}
                />
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={handleAddLanguage}>
              <Plus className="w-4 h-4 mr-1" />
              Add Language
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('work')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('review')}>Review & Activate</Button>
          </div>
        </TabsContent>

        {/* Step 6: Review & Activate */}
        <TabsContent value="review" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-4">Review Your Profile</h3>

            <div className="space-y-3 text-sm">
              <div>
                <strong>Atlas Skills:</strong>{' '}
                {atlasSkillCount === null ? 'Loading…' : `${atlasSkillCount} skills`}
              </div>
              <div>
                <strong>Values:</strong> {valuesTags.join(', ') || 'None'}
              </div>
              <div>
                <strong>Causes:</strong> {causeTags.join(', ') || 'None'}
              </div>
              <div>
                <strong>Desired Roles:</strong> {desiredRoles.join(', ') || 'None'}
              </div>
              <div>
                <strong>Desired Industries:</strong> {desiredIndustries.join(', ') || 'None'}
              </div>
              <div>
                <strong>Organization Types:</strong> {orgTypes.join(', ') || 'None'}
              </div>
              <div>
                <strong>Match Bias:</strong>{' '}
                {weightBias < 40 ? 'Skills-first' : weightBias > 60 ? 'Mission-first' : 'Balanced'}{' '}
                ({weightBias}%)
              </div>
              <div>
                <strong>Work Mode:</strong> {location.workMode || 'Not set'}
              </div>
              <div>
                <strong>Languages:</strong> {languages.length} language(s)
              </div>
            </div>

            <div className="mt-6 p-4 rounded-md" style={{ backgroundColor: '#F7F6F1' }}>
              <p className="text-sm" style={{ color: '#2D3330' }}>
                <strong>Privacy Note:</strong> Your profile is completely anonymous. Organizations
                will only see your skills, values, and qualifications—not your name, photo, or
                background. Identity is revealed only after mutual interest.
              </p>
            </div>

            <div className="mt-4 rounded-md border border-[#E5E3DA] p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-[#2D3330]">Sample matches preview</h4>
                <span className="text-xs text-[#6B6760]">
                  {sampleSource === 'real' ? 'Real near matches' : 'Mock preview'}
                </span>
              </div>
              <p className="text-xs text-[#6B6760] mt-1">
                {sampleSource === 'real'
                  ? 'Based on current profile data and live opportunities.'
                  : 'Example matches shown until enough live data is available.'}
              </p>
              {sampleLoading ? (
                <p className="text-xs text-[#6B6760] mt-3">Loading sample matches...</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {sampleMatches.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="rounded border border-[#E8E6DD] p-3"
                    >
                      <p className="text-sm font-medium text-[#2D3330]">{item.title}</p>
                      <p className="text-xs text-[#6B6760]">{item.reason}</p>
                      <p className="text-xs text-[#6B6760] mt-1">
                        Match score preview: {Math.round(item.score * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('languages')}>
              Back
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Save & Continue Later
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ backgroundColor: '#1C4D3A' }}
            >
              {isSubmitting ? 'Activating...' : 'Activate Matching'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
