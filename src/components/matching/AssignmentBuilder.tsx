'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { TypeaheadChips, type TypeaheadOption } from './TypeaheadChips';
import { SkillLevelRow, type SkillLevel } from './SkillLevelRow';
import { CEFRLanguageRow, type LanguageProficiency } from './CEFRLanguageRow';
import { LocationInput, type LocationPreference } from './LocationInput';
import { CompensationInput, type CompensationRange } from './CompensationInput';
import { DateWindowInput, type DateWindow } from './DateWindowInput';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface AssignmentBuilderProps {
  onComplete: (assignmentId: string) => void;
  onCancel: () => void;
}

const VERIFICATION_OPTIONS = [
  { id: 'id', label: 'Government ID' },
  { id: 'education', label: 'Education Credentials' },
  { id: 'employment', label: 'Employment History' },
  { id: 'portfolio', label: 'Portfolio/Work Samples' },
  { id: 'references', label: 'Professional References' },
];

/**
 * 7-step wizard for creating assignments (organizations).
 */
export function AssignmentBuilder({ onComplete, onCancel }: AssignmentBuilderProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [mustHaveSkills, setMustHaveSkills] = useState<SkillLevel[]>([]);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<SkillLevel[]>([]);
  const [verificationGates, setVerificationGates] = useState<string[]>([]);
  const [valuesTags, setValuesTags] = useState<string[]>([]);
  const [causeTags, setCauseTags] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationPreference>({ workMode: '' });
  const [startWindow, setStartWindow] = useState<DateWindow>({ earliest: '', latest: '' });
  const [hoursMin, setHoursMin] = useState(10);
  const [hoursMax, setHoursMax] = useState(40);
  const [compensation, setCompensation] = useState<CompensationRange>({
    min: 0,
    max: 0,
    currency: 'USD',
  });
  const [minLanguage, setMinLanguage] = useState<LanguageProficiency | null>(null);

  // Taxonomy options
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

  // Add skill helpers
  const handleAddMustHaveSkill = (skillKey: string) => {
    const skillOption = skillsOptions.find((opt) => opt.key === skillKey);
    if (!skillOption) return;

    setMustHaveSkills([
      ...mustHaveSkills,
      { skillId: skillKey, skillLabel: skillOption.label, level: 3, monthsExperience: 24 },
    ]);
  };

  const handleAddNiceToHaveSkill = (skillKey: string) => {
    const skillOption = skillsOptions.find((opt) => opt.key === skillKey);
    if (!skillOption) return;

    setNiceToHaveSkills([
      ...niceToHaveSkills,
      { skillId: skillKey, skillLabel: skillOption.label, level: 2, monthsExperience: 12 },
    ]);
  };

  // Calculate progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 7;

    if (role) completed++;
    if (mustHaveSkills.length > 0) completed++;
    if (valuesTags.length > 0) completed++;
    if (location.workMode && startWindow.earliest) completed++;
    if (compensation.min > 0) completed++;
    if (niceToHaveSkills.length > 0 || minLanguage) completed++;
    completed++; // Weights step always counts

    return (completed / total) * 100;
  };

  const progress = calculateProgress();

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!role) {
      toast.error('Please enter a role title');
      setCurrentTab('overview');
      return;
    }

    if (mustHaveSkills.length === 0) {
      toast.error('Please add at least one must-have skill');
      setCurrentTab('requirements');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          description,
          status: 'active',
          mustHaveSkills: mustHaveSkills.map((s) => ({ id: s.skillId, level: s.level })),
          niceToHaveSkills: niceToHaveSkills.map((s) => ({ id: s.skillId, level: s.level })),
          verificationGates,
          valuesRequired: valuesTags,
          causeTags,
          locationMode: location.workMode,
          country: location.country,
          city: location.city,
          radiusKm: location.radiusKm,
          hoursMin,
          hoursMax,
          compMin: compensation.min,
          compMax: compensation.max,
          currency: compensation.currency,
          startEarliest: startWindow.earliest,
          startLatest: startWindow.latest,
          minLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }

      const data = await response.json();
      toast.success('Assignment published!');
      onComplete(data.assignment.id);
      router.refresh();
    } catch (error) {
      toast.error('Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Available skills
  const availableMustHaveSkills = skillsOptions.filter(
    (opt) => !mustHaveSkills.find((s) => s.skillId === opt.key)
  );

  const availableNiceToHaveSkills = skillsOptions.filter(
    (opt) =>
      !mustHaveSkills.find((s) => s.skillId === opt.key) &&
      !niceToHaveSkills.find((s) => s.skillId === opt.key)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2" style={{ color: '#2D3330' }}>
          Create New Assignment
        </h2>
        <Progress value={progress} className="h-2" />
        <p className="text-sm mt-2" style={{ color: '#6B6760' }}>
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Wizard tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 text-xs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Required</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="compensation">Comp</TabsTrigger>
          <TabsTrigger value="nice">Nice-to-Have</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
        </TabsList>

        {/* Step 1: Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div>
            <Label htmlFor="role">Role Title *</Label>
            <Input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Lead Developer, Community Manager, etc."
            />
          </div>

          <div>
            <Label htmlFor="description">Brief Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this person do? What impact will they have?"
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
              style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
            />
          </div>

          <Button onClick={() => setCurrentTab('requirements')}>Next: Requirements</Button>
        </TabsContent>

        {/* Step 2: Requirements (Hard Filters) */}
        <TabsContent value="requirements" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Must-Have Skills *</h3>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              These are hard requirements. Candidates without these skills won&apos;t appear in
              results.
            </p>

            <div className="space-y-3 mb-4">
              {mustHaveSkills.map((skill, index) => (
                <SkillLevelRow
                  key={skill.skillId}
                  skill={skill}
                  onChange={(updated) => {
                    const newSkills = [...mustHaveSkills];
                    newSkills[index] = updated;
                    setMustHaveSkills(newSkills);
                  }}
                  onRemove={() => setMustHaveSkills(mustHaveSkills.filter((_, i) => i !== index))}
                />
              ))}
            </div>

            {availableMustHaveSkills.length > 0 && (
              <TypeaheadChips
                options={availableMustHaveSkills}
                value={[]}
                onChange={(selected) => {
                  if (selected.length > 0) {
                    handleAddMustHaveSkill(selected[0]);
                  }
                }}
                placeholder="Search and add required skills..."
              />
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Required Verifications</h3>
            <div className="space-y-2">
              {VERIFICATION_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={option.id}
                    checked={verificationGates.includes(option.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setVerificationGates([...verificationGates, option.id]);
                      } else {
                        setVerificationGates(verificationGates.filter((v) => v !== option.id));
                      }
                    }}
                  />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('overview')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('values')}>Next: Values & Causes</Button>
          </div>
        </TabsContent>

        {/* Step 3: Values & Causes */}
        <TabsContent value="values" className="space-y-4">
          <div>
            <Label>Values We&apos;re Looking For</Label>
            <p className="text-sm mb-3" style={{ color: '#6B6760' }}>
              Select values that align with your organization&apos;s mission.
            </p>
            <TypeaheadChips
              options={valuesOptions}
              value={valuesTags}
              onChange={setValuesTags}
              placeholder="Search values..."
            />
          </div>

          <div>
            <Label>Causes & Impact Areas</Label>
            <TypeaheadChips
              options={causesOptions}
              value={causeTags}
              onChange={setCauseTags}
              placeholder="Search causes..."
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('requirements')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('logistics')}>Next: Logistics</Button>
          </div>
        </TabsContent>

        {/* Step 4: Logistics */}
        <TabsContent value="logistics" className="space-y-4">
          <LocationInput value={location} onChange={setLocation} />

          <DateWindowInput
            value={startWindow}
            onChange={setStartWindow}
            label="Start Date Window"
            earliestLabel="Can start as early as"
            latestLabel="Must start by"
          />

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

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('values')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('compensation')}>Next: Compensation</Button>
          </div>
        </TabsContent>

        {/* Step 5: Compensation */}
        <TabsContent value="compensation" className="space-y-4">
          <CompensationInput
            value={compensation}
            onChange={setCompensation}
            label="Compensation Range"
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('logistics')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('nice')}>Next: Nice-to-Haves</Button>
          </div>
        </TabsContent>

        {/* Step 6: Nice-to-Haves */}
        <TabsContent value="nice" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Nice-to-Have Skills</h3>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              These aren&apos;t required but will boost match scores.
            </p>

            <div className="space-y-3 mb-4">
              {niceToHaveSkills.map((skill, index) => (
                <SkillLevelRow
                  key={skill.skillId}
                  skill={skill}
                  onChange={(updated) => {
                    const newSkills = [...niceToHaveSkills];
                    newSkills[index] = updated;
                    setNiceToHaveSkills(newSkills);
                  }}
                  onRemove={() =>
                    setNiceToHaveSkills(niceToHaveSkills.filter((_, i) => i !== index))
                  }
                />
              ))}
            </div>

            {availableNiceToHaveSkills.length > 0 && (
              <TypeaheadChips
                options={availableNiceToHaveSkills}
                value={[]}
                onChange={(selected) => {
                  if (selected.length > 0) {
                    handleAddNiceToHaveSkill(selected[0]);
                  }
                }}
                placeholder="Search and add nice-to-have skills..."
              />
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Minimum Language Requirement</h3>
            {minLanguage ? (
              <CEFRLanguageRow
                language={minLanguage}
                onChange={setMinLanguage}
                onRemove={() => setMinLanguage(null)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMinLanguage({ code: 'en', level: 'B2' })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Language Requirement
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentTab('compensation')}>
              Back
            </Button>
            <Button onClick={() => setCurrentTab('publish')}>Review & Publish</Button>
          </div>
        </TabsContent>

        {/* Step 7: Publish */}
        <TabsContent value="publish" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-4">Review Your Assignment</h3>

            <div className="space-y-3 text-sm">
              <div>
                <strong>Role:</strong> {role || 'Not set'}
              </div>
              <div>
                <strong>Must-Have Skills:</strong> {mustHaveSkills.length} skill(s)
              </div>
              <div>
                <strong>Nice-to-Have Skills:</strong> {niceToHaveSkills.length} skill(s)
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
                <strong>Verifications Required:</strong> {verificationGates.length} verification(s)
              </div>
            </div>

            <div className="mt-6 p-4 rounded-md" style={{ backgroundColor: '#F7F6F1' }}>
              <p className="text-sm" style={{ color: '#2D3330' }}>
                <strong>Blind-First Matching:</strong> Candidates will remain completely anonymous
                until you both express interest. You&apos;ll see their skills, values, and
                qualifications—but not their names, photos, or background.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Save as Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ backgroundColor: '#1C4D3A' }}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Assignment'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
