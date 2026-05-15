import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Education, type ContextMeasuredOutcome } from '@/types/profile';
import { motion } from 'framer-motion';
import { ProfileSkillPicker } from './ProfileSkillPicker';
import {
  mapLegacySkillsToAvailable,
  mapSkillListToAvailable,
  serializeSelectedSkills,
} from './skill-selection-utils';
import { MAX_CONTEXT_OUTCOME_SKILLS } from '@/lib/profile/context-outcomes';

interface EducationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  education?: Education | null;
  availableSkills: string[];
  proofPackOptions?: Array<{ id: string; title: string }>;
  onSave: (education: Omit<Education, 'id'>) => void;
}

type OutcomeDraft = {
  id: string;
  name: string;
  value: string;
  unit: string;
  timeframe: string;
  supportingSkills: string[];
  proofPackId: string;
  proofPackTitle: string;
};

function createOutcomeDraft(
  seed?: Partial<ContextMeasuredOutcome>,
  availableSkills: string[] = []
) {
  return {
    id: seed?.id || crypto.randomUUID(),
    name: seed?.name || '',
    value: seed?.value !== null && seed?.value !== undefined ? String(seed.value) : '',
    unit: seed?.unit || '',
    timeframe: seed?.timeframe || '',
    supportingSkills: mapSkillListToAvailable(seed?.supportingSkills || [], availableSkills),
    proofPackId: seed?.proofPackId || '',
    proofPackTitle: seed?.proofPackTitle || '',
  };
}

function outcomeHasInput(outcome: OutcomeDraft) {
  return Boolean(
    outcome.name.trim() ||
      outcome.value.trim() ||
      outcome.unit.trim() ||
      outcome.timeframe.trim() ||
      outcome.supportingSkills.length > 0 ||
      outcome.proofPackId.trim()
  );
}

export function EducationForm({
  open,
  onOpenChange,
  education,
  availableSkills,
  proofPackOptions = [],
  onSave,
}: EducationFormProps) {
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState('');
  const [measuredOutcomes, setMeasuredOutcomes] = useState<OutcomeDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (education) {
        setInstitution(education.institution);
        setDegree(education.degree);
        setDuration(education.duration);
        setSelectedSkills(mapLegacySkillsToAvailable(education.skills, availableSkills));
        setProjects(education.projects);
        setMeasuredOutcomes(
          (education.measuredOutcomes || []).map((outcome) =>
            createOutcomeDraft(outcome, availableSkills)
          )
        );
      } else {
        setInstitution('');
        setDegree('');
        setDuration('');
        setSelectedSkills([]);
        setProjects('');
        setMeasuredOutcomes([]);
      }
      setErrors({});
    }
  }, [open, education, availableSkills]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!institution.trim()) newErrors.institution = 'Institution name is required';
    if (!degree.trim()) newErrors.degree = 'Degree/Program is required';
    if (!duration.trim()) newErrors.duration = 'Duration is required';
    if (selectedSkills.length === 0) newErrors.skills = 'Select at least one skill';
    if (!projects.trim()) newErrors.projects = 'Meaningful projects is required';

    measuredOutcomes.forEach((outcome, index) => {
      if (!outcomeHasInput(outcome)) return;

      if (!outcome.name.trim()) {
        newErrors[`outcome-${index}-name`] = 'Outcome name is required';
      }
      if (outcome.value.trim() && Number.isNaN(Number(outcome.value))) {
        newErrors[`outcome-${index}-value`] = 'Outcome value must be numeric';
      }
      if (outcome.value.trim() && !outcome.unit.trim()) {
        newErrors[`outcome-${index}-unit`] = 'Measurement unit is required when value is provided';
      }
      if (outcome.supportingSkills.length < 1 || outcome.supportingSkills.length > 3) {
        newErrors[`outcome-${index}-skills`] = 'Link each outcome to 1 to 3 supporting skills';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const normalizedMeasuredOutcomes = measuredOutcomes.filter(outcomeHasInput).map((outcome) => ({
      id: outcome.id,
      name: outcome.name.trim(),
      value: outcome.value.trim() ? Number(outcome.value) : null,
      unit: outcome.unit.trim() || null,
      timeframe: outcome.timeframe.trim() || null,
      supportingSkills: outcome.supportingSkills.slice(0, MAX_CONTEXT_OUTCOME_SKILLS),
      proofPackId: outcome.proofPackId.trim() || null,
      proofPackTitle:
        proofPackOptions.find((option) => option.id === outcome.proofPackId)?.title ||
        outcome.proofPackTitle.trim() ||
        null,
      claimStatus: outcome.proofPackId.trim() ? ('proof_linked' as const) : ('claimed' as const),
      verificationStatus: outcome.proofPackId.trim()
        ? ('proof_linked' as const)
        : ('unverified' as const),
      visibility: 'private_context' as const,
    }));

    onSave({
      institution: institution.trim(),
      degree: degree.trim(),
      duration: duration.trim(),
      skills: serializeSelectedSkills(selectedSkills),
      projects: projects.trim(),
      measuredOutcomes: normalizedMeasuredOutcomes,
      verified: false,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{education ? 'Edit Education' : 'Add Education'}</DialogTitle>
          <DialogDescription>
            Share your educational background. Include skills gained and meaningful projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, staggerChildren: 0.1 }}
            className="space-y-6"
          >
            {/* Institution */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="institution">
                Institution <span className="text-red-500">*</span>
              </Label>
              <Input
                id="institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="University or institution name"
                className={errors.institution ? 'border-red-500' : ''}
              />
              {errors.institution && <p className="text-xs text-red-500">{errors.institution}</p>}
            </motion.div>

            {/* Degree */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="degree">
                Degree/Program <span className="text-red-500">*</span>
              </Label>
              <Input
                id="degree"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder={'e.g., "Master\'s in Public Policy"'}
                className={errors.degree ? 'border-red-500' : ''}
              />
              {errors.degree && <p className="text-xs text-red-500">{errors.degree}</p>}
            </motion.div>

            {/* Duration */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="duration">
                Duration <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder='e.g., "2017 - 2019"'
                className={errors.duration ? 'border-red-500' : ''}
              />
              {errors.duration && <p className="text-xs text-red-500">{errors.duration}</p>}
            </motion.div>

            {/* Skills Gained */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="education-skills-picker">
                Skills Gained <span className="text-red-500">*</span>
              </Label>
              {availableSkills.length === 0 ? (
                <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/40 p-3">
                  <p className="text-sm text-amber-900">
                    Add proof-backed portfolio content before attaching education entries.
                  </p>
                  <Button asChild type="button" variant="outline" size="sm">
                    <Link href="/app/i/profile?profileView=full&tab=proof_packs">
                      Add proof-backed content
                    </Link>
                  </Button>
                </div>
              ) : (
                <ProfileSkillPicker
                  inputId="education-skills-picker"
                  availableSkills={availableSkills}
                  selectedSkills={selectedSkills}
                  onChange={(nextSkills) => {
                    setSelectedSkills(nextSkills);
                    if (nextSkills.length > 0) {
                      setErrors((prev) => ({ ...prev, skills: '' }));
                    }
                  }}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Choose only from the skills already represented on your profile.
              </p>
              {errors.skills && <p className="text-xs text-red-500">{errors.skills}</p>}
            </motion.div>

            {/* Meaningful Projects */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="projects">
                Meaningful Projects <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="projects"
                value={projects}
                onChange={(e) => setProjects(e.target.value)}
                placeholder="Describe significant projects or work that shaped your path"
                className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.projects ? 'border-red-500' : ''
                }`}
              />
              {errors.projects && <p className="text-xs text-red-500">{errors.projects}</p>}
            </motion.div>

            {/* Guidance */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>Measured outcomes</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional. Outcomes stay claimed until linked to proof or scoped verification.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMeasuredOutcomes((current) => [
                      ...current,
                      createOutcomeDraft(undefined, availableSkills),
                    ])
                  }
                  disabled={availableSkills.length === 0}
                >
                  Add outcome
                </Button>
              </div>

              {measuredOutcomes.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Add one only when there is a concrete learning result to connect to skills.
                </p>
              ) : null}

              {measuredOutcomes.map((outcome, index) => (
                <div key={outcome.id} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Outcome {index + 1}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white">
                        Claimed
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setMeasuredOutcomes((current) =>
                            current.filter((item) => item.id !== outcome.id)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="space-y-1 sm:col-span-1">
                      <Label htmlFor={`${outcome.id}-name`}>What changed?</Label>
                      <Input
                        id={`${outcome.id}-name`}
                        value={outcome.name}
                        onChange={(event) =>
                          setMeasuredOutcomes((current) =>
                            current.map((item) =>
                              item.id === outcome.id ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        placeholder="Completed research sprint"
                        className={errors[`outcome-${index}-name`] ? 'border-red-500' : ''}
                      />
                      {errors[`outcome-${index}-name`] ? (
                        <p className="text-xs text-red-500">{errors[`outcome-${index}-name`]}</p>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`${outcome.id}-value`}>Number</Label>
                      <Input
                        id={`${outcome.id}-value`}
                        value={outcome.value}
                        onChange={(event) =>
                          setMeasuredOutcomes((current) =>
                            current.map((item) =>
                              item.id === outcome.id ? { ...item, value: event.target.value } : item
                            )
                          )
                        }
                        placeholder="12"
                        className={errors[`outcome-${index}-value`] ? 'border-red-500' : ''}
                      />
                      {errors[`outcome-${index}-value`] ? (
                        <p className="text-xs text-red-500">{errors[`outcome-${index}-value`]}</p>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`${outcome.id}-unit`}>Unit</Label>
                      <Input
                        id={`${outcome.id}-unit`}
                        value={outcome.unit}
                        onChange={(event) =>
                          setMeasuredOutcomes((current) =>
                            current.map((item) =>
                              item.id === outcome.id ? { ...item, unit: event.target.value } : item
                            )
                          )
                        }
                        placeholder="deliverables"
                        className={errors[`outcome-${index}-unit`] ? 'border-red-500' : ''}
                      />
                      {errors[`outcome-${index}-unit`] ? (
                        <p className="text-xs text-red-500">{errors[`outcome-${index}-unit`]}</p>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`${outcome.id}-timeframe`}>Scope</Label>
                      <Input
                        id={`${outcome.id}-timeframe`}
                        value={outcome.timeframe}
                        onChange={(event) =>
                          setMeasuredOutcomes((current) =>
                            current.map((item) =>
                              item.id === outcome.id
                                ? { ...item, timeframe: event.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="semester project"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
                    <div className="space-y-2">
                      <Label htmlFor={`${outcome.id}-skills`}>1 to 3 supporting skills</Label>
                      <ProfileSkillPicker
                        inputId={`${outcome.id}-skills`}
                        availableSkills={availableSkills}
                        selectedSkills={outcome.supportingSkills}
                        maxSelections={MAX_CONTEXT_OUTCOME_SKILLS}
                        searchPlaceholder="Search proof-backed skills"
                        onChange={(nextSkills) =>
                          setMeasuredOutcomes((current) =>
                            current.map((item) =>
                              item.id === outcome.id
                                ? { ...item, supportingSkills: nextSkills }
                                : item
                            )
                          )
                        }
                      />
                      {errors[`outcome-${index}-skills`] ? (
                        <p className="text-xs text-red-500">{errors[`outcome-${index}-skills`]}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${outcome.id}-proof-pack`}>Supporting Proof Pack</Label>
                      <select
                        id={`${outcome.id}-proof-pack`}
                        value={outcome.proofPackId}
                        onChange={(event) => {
                          const selected = proofPackOptions.find(
                            (option) => option.id === event.target.value
                          );
                          setMeasuredOutcomes((current) =>
                            current.map((item) =>
                              item.id === outcome.id
                                ? {
                                    ...item,
                                    proofPackId: event.target.value,
                                    proofPackTitle: selected?.title || '',
                                  }
                                : item
                            )
                          );
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">No Proof Pack linked yet</option>
                        {proofPackOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        A Proof Pack link supports the claim but does not verify it by itself.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-medium mb-2">💡 Tip:</p>
              <p>
                Include both formal degrees and significant informal learning experiences. Focus on
                what you learned and how it applies to your work.
              </p>
            </motion.div>
          </motion.div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={availableSkills.length === 0}>
            {education ? 'Save Changes' : 'Add Education'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
