import { useEffect } from 'react';
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
import { Volunteering, type ContextMeasuredOutcome } from '@/types/profile';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ProfileSkillPicker } from './ProfileSkillPicker';
import {
  mapLegacySkillsToAvailable,
  mapSkillListToAvailable,
  serializeSelectedSkills,
} from './skill-selection-utils';
import { useState } from 'react';
import { MAX_CONTEXT_OUTCOME_SKILLS } from '@/lib/profile/context-outcomes';

const volunteerSchema = z.object({
  title: z.string().min(1, 'Role/Title is required'),
  orgDescription: z.string().min(1, 'Organization description is required'),
  duration: z.string().min(1, 'Duration is required'),
  cause: z.string().min(1, 'Cause is required'),
  impact: z.string().min(1, 'Impact description is required'),
  personalWhy: z.string().min(1, 'Personal motivation is required'),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

interface VolunteerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteering?: Volunteering | null;
  availableSkills: string[];
  proofPackOptions?: Array<{ id: string; title: string }>;
  onSave: (volunteering: Omit<Volunteering, 'id'>) => void;
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

export function VolunteerForm({
  open,
  onOpenChange,
  volunteering,
  availableSkills,
  proofPackOptions = [],
  onSave,
}: VolunteerFormProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [measuredOutcomes, setMeasuredOutcomes] = useState<OutcomeDraft[]>([]);
  const [outcomeErrors, setOutcomeErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      orgDescription: '',
      duration: '',
      cause: '',
      impact: '',
      personalWhy: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (volunteering) {
        reset({
          title: volunteering.title,
          orgDescription: volunteering.orgDescription,
          duration: volunteering.duration,
          cause: volunteering.cause,
          impact: volunteering.impact,
          personalWhy: volunteering.personalWhy,
        });
        setSelectedSkills(mapLegacySkillsToAvailable(volunteering.skillsDeployed, availableSkills));
        setMeasuredOutcomes(
          (volunteering.measuredOutcomes || []).map((outcome) =>
            createOutcomeDraft(outcome, availableSkills)
          )
        );
      } else {
        reset({
          title: '',
          orgDescription: '',
          duration: '',
          cause: '',
          impact: '',
          personalWhy: '',
        });
        setSelectedSkills([]);
        setMeasuredOutcomes([]);
      }
      setSkillsError(null);
      setOutcomeErrors({});
    }
  }, [open, volunteering, reset, availableSkills]);

  const onSubmit = (data: VolunteerFormData) => {
    if (selectedSkills.length === 0) {
      setSkillsError('Select at least one skill');
      return;
    }

    const nextOutcomeErrors: Record<string, string> = {};
    measuredOutcomes.forEach((outcome, index) => {
      if (!outcomeHasInput(outcome)) return;

      if (!outcome.name.trim()) {
        nextOutcomeErrors[`outcome-${index}-name`] = 'Outcome name is required';
      }
      if (outcome.value.trim() && Number.isNaN(Number(outcome.value))) {
        nextOutcomeErrors[`outcome-${index}-value`] = 'Outcome value must be numeric';
      }
      if (outcome.value.trim() && !outcome.unit.trim()) {
        nextOutcomeErrors[`outcome-${index}-unit`] =
          'Measurement unit is required when value is provided';
      }
      if (outcome.supportingSkills.length < 1 || outcome.supportingSkills.length > 3) {
        nextOutcomeErrors[`outcome-${index}-skills`] =
          'Link each outcome to 1 to 3 supporting skills';
      }
    });

    setOutcomeErrors(nextOutcomeErrors);
    if (Object.keys(nextOutcomeErrors).length > 0) {
      return;
    }

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
      ...data,
      skillsDeployed: serializeSelectedSkills(selectedSkills),
      measuredOutcomes: normalizedMeasuredOutcomes,
      verified: false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{volunteering ? 'Edit Volunteer Work' : 'Add Volunteer Work'}</DialogTitle>
          <DialogDescription>
            Highlight your volunteer work and community involvement. Explain what changed, who
            benefited, and what proof supports it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, staggerChildren: 0.1 }}
            className="space-y-6"
          >
            {/* Title */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="title">
                Role/Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder='e.g., "Board governance and strategic direction"'
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </motion.div>

            {/* Organization Description */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="orgDescription">
                Organization <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orgDescription"
                {...register('orgDescription')}
                placeholder='e.g., "Youth-led climate organization, National reach"'
                className={errors.orgDescription ? 'border-red-500' : ''}
              />
              {errors.orgDescription && (
                <p className="text-xs text-red-500">{errors.orgDescription.message}</p>
              )}
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
                {...register('duration')}
                placeholder='e.g., "2022 - Present"'
                className={errors.duration ? 'border-red-500' : ''}
              />
              {errors.duration && <p className="text-xs text-red-500">{errors.duration.message}</p>}
            </motion.div>

            {/* Personal Connection - HIGHLIGHTED SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-4 rounded-lg border-2 bg-[#C67B5C]/5 border-[#C67B5C]/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C67B5C]" />
                <Label className="text-base text-[#C67B5C]">Personal Connection</Label>
              </div>

              {/* Cause */}
              <div className="space-y-2">
                <Label htmlFor="cause">
                  Cause <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cause"
                  {...register('cause')}
                  placeholder='e.g., "Climate Justice - Amplifying youth voices"'
                  className={errors.cause ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground">What cause is this connected to?</p>
                {errors.cause && <p className="text-xs text-red-500">{errors.cause.message}</p>}
              </div>

              {/* Personal Why */}
              <div className="space-y-2">
                <Label htmlFor="personalWhy">
                  Why This Matters to You <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="personalWhy"
                  {...register('personalWhy')}
                  placeholder="Share your personal connection and motivation for this cause"
                  className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.personalWhy ? 'border-red-500' : ''
                  }`}
                />
                <p className="text-xs text-muted-foreground italic">
                  This is the heart of your service work - be authentic
                </p>
                {errors.personalWhy && (
                  <p className="text-xs text-red-500">{errors.personalWhy.message}</p>
                )}
              </div>
            </motion.div>

            {/* Impact Created */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="impact">
                Impact Created <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="impact"
                {...register('impact')}
                placeholder="What change did you help create?"
                className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.impact ? 'border-red-500' : ''
                }`}
              />
              {errors.impact && <p className="text-xs text-red-500">{errors.impact.message}</p>}
            </motion.div>

            {/* Skills Deployed */}
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
                  Add one only when the contribution has a concrete result to connect to skills.
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
                        placeholder="Reduced admin load"
                        className={outcomeErrors[`outcome-${index}-name`] ? 'border-red-500' : ''}
                      />
                      {outcomeErrors[`outcome-${index}-name`] ? (
                        <p className="text-xs text-red-500">
                          {outcomeErrors[`outcome-${index}-name`]}
                        </p>
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
                        placeholder="30"
                        className={outcomeErrors[`outcome-${index}-value`] ? 'border-red-500' : ''}
                      />
                      {outcomeErrors[`outcome-${index}-value`] ? (
                        <p className="text-xs text-red-500">
                          {outcomeErrors[`outcome-${index}-value`]}
                        </p>
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
                        placeholder="%"
                        className={outcomeErrors[`outcome-${index}-unit`] ? 'border-red-500' : ''}
                      />
                      {outcomeErrors[`outcome-${index}-unit`] ? (
                        <p className="text-xs text-red-500">
                          {outcomeErrors[`outcome-${index}-unit`]}
                        </p>
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
                        placeholder="volunteer season"
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
                      {outcomeErrors[`outcome-${index}-skills`] ? (
                        <p className="text-xs text-red-500">
                          {outcomeErrors[`outcome-${index}-skills`]}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${outcome.id}-proof-pack`}>Supporting proof record</Label>
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
                        <option value="">No proof record linked yet</option>
                        {proofPackOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        A proof record link supports the claim but does not verify it by itself.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="volunteer-skills-picker">
                Skills Deployed <span className="text-red-500">*</span>
              </Label>
              {availableSkills.length === 0 ? (
                <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/40 p-3">
                  <p className="text-sm text-amber-900">
                    Add proof-backed portfolio content before attaching volunteer work.
                  </p>
                  <Button asChild type="button" variant="outline" size="sm">
                    <Link href="/app/i/profile?profileView=full&tab=proof_packs">
                      Add proof-backed content
                    </Link>
                  </Button>
                </div>
              ) : (
                <ProfileSkillPicker
                  inputId="volunteer-skills-picker"
                  availableSkills={availableSkills}
                  selectedSkills={selectedSkills}
                  onChange={(nextSkills) => {
                    setSelectedSkills(nextSkills);
                    if (nextSkills.length > 0) {
                      setSkillsError(null);
                    }
                  }}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Choose only from the skills already represented on your profile.
              </p>
              {skillsError ? <p className="text-xs text-red-500">{skillsError}</p> : null}
            </motion.div>

            {/* Guidance */}
            <motion.div
              className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-medium mb-2">💡 Tip:</p>
              <p>
                Connect your service to the context and explain your concrete contribution.
                Authentic evidence matters more than polish.
              </p>
            </motion.div>
          </motion.div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={availableSkills.length === 0}>
              {volunteering ? 'Save Changes' : 'Add Volunteer Work'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
