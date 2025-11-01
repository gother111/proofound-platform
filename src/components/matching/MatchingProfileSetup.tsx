'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { TypeaheadChips, type TypeaheadOption } from './TypeaheadChips';
import { SkillLevelRow, type SkillLevel } from './SkillLevelRow';
import { CEFRLanguageRow, type LanguageProficiency } from './CEFRLanguageRow';
import { LocationInput, type LocationPreference } from './LocationInput';
import { CompensationInput, type CompensationRange } from './CompensationInput';
import { DateWindowInput, type DateWindow } from './DateWindowInput';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface MatchingProfileSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Multi-step wizard for setting up matching profile (individuals).
 */
export function MatchingProfileSetup({ onComplete, onCancel }: MatchingProfileSetupProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('skills');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [skills, setSkills] = useState<SkillLevel[]>([]);
  const [valuesTags, setValuesTags] = useState<string[]>([]);
  const [causeTags, setCauseTags] = useState<string[]>([]);
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
  const [skillsOptions, setSkillsOptions] = useState<TypeaheadOption[]>([]);

  // Fetch taxonomies
  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const [valuesRes, causesRes, skillsRes] = await Promise.all([
          fetch('/api/taxonomy/values'),
          fetch('/api/taxonomy/causes'),
          fetch('/api/taxonomy/skills'),
        ]);

        const [valuesData, causesData, skillsData] = await Promise.all([
          valuesRes.json(),
          causesRes.json(),
          skillsRes.json(),
        ]);

        setValuesOptions(valuesData.items || []);
        setCausesOptions(causesData.items || []);
        setSkillsOptions(skillsData.items || []);
      } catch (error) {
        toast.error('Failed to load taxonomy data');
      }
    };

    fetchTaxonomies();
  }, []);

  // Add skill
  const handleAddSkill = (skillKey: string) => {
    const skillOption = skillsOptions.find((opt) => opt.key === skillKey);
    if (!skillOption) return;

    setSkills([
      ...skills,
      { skillId: skillKey, skillLabel: skillOption.label, level: 2, monthsExperience: 12 },
    ]);
  };

  // Add language
  const handleAddLanguage = () => {
    setLanguages([...languages, { code: 'en', level: 'B2' }]);
  };

  // Calculate progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 5;

    if (skills.length >= 3) completed++;
    if (valuesTags.length >= 3) completed++;
    if (location.workMode && availability.earliest && availability.latest) completed++;
    if (languages.length > 0) completed++;
    if (compensation.min > 0 && compensation.max > 0) completed++;

    return (completed / total) * 100;
  };

  const progress = calculateProgress();

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (skills.length < 3) {
      toast.error('Please add at least 3 skills');
      setCurrentTab('skills');
      return;
    }

    if (valuesTags.length < 3) {
      toast.error('Please select at least 3 values');
      setCurrentTab('values');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/matching-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills,
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to save matching profile';
        
        // Log to console for debugging
        console.error('Matching profile save failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success('Matching profile activated!');
      onComplete();
      router.refresh();
    } catch (error) {
      console.error('Error saving matching profile:', error);
      
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

  // Available skills for adding
  const availableSkills = skillsOptions.filter((opt) => !skills.find((s) => s.skillId === opt.key));

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* Step 1: Core Skills */}
        <TabsContent value="skills" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Core Skills</h3>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              Select at least 3 skills with your proficiency level and experience.
            </p>

            <div className="space-y-3 mb-4">
              {skills.map((skill, index) => (
                <SkillLevelRow
                  key={skill.skillId}
                  skill={skill}
                  onChange={(updated) => {
                    const newSkills = [...skills];
                    newSkills[index] = updated;
                    setSkills(newSkills);
                  }}
                  onRemove={() => setSkills(skills.filter((_, i) => i !== index))}
                />
              ))}
            </div>

            {availableSkills.length > 0 && (
              <TypeaheadChips
                options={availableSkills}
                value={[]}
                onChange={(selected) => {
                  if (selected.length > 0) {
                    handleAddSkill(selected[0]);
                  }
                }}
                placeholder="Search and add skills..."
              />
            )}
          </div>

          <Button onClick={() => setCurrentTab('values')}>Next: Values & Causes</Button>
        </TabsContent>

        {/* Step 2: Values & Causes */}
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
            <Button variant="outline" onClick={() => setCurrentTab('skills')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('work')}>Next: Work Preferences</Button>
          </div>
        </TabsContent>

        {/* Step 3: Work Preferences */}
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

        {/* Step 4: Languages */}
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

        {/* Step 5: Review & Activate */}
        <TabsContent value="review" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-4">Review Your Profile</h3>

            <div className="space-y-3 text-sm">
              <div>
                <strong>Skills:</strong> {skills.length} skills added
              </div>
              <div>
                <strong>Values:</strong> {valuesTags.join(', ') || 'None'}
              </div>
              <div>
                <strong>Causes:</strong> {causeTags.join(', ') || 'None'}
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
          </div>

          <div className="flex gap-2">
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
