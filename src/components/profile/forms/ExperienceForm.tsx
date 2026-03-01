import { useEffect } from 'react';
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
import { Experience } from '@/types/profile';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  buildExperienceTimeline,
  isoDateToMonthInput,
  monthInputToIsoDate,
} from '@/lib/profile/experience-timeline';
import {
  EXPERIENCE_EMPLOYEE_AMOUNT_OPTIONS,
  EXPERIENCE_ORGANIZATION_TYPE_OPTIONS,
  EXPERIENCE_PARTICIPATION_CAPACITY_OPTIONS,
  type ExperienceEmployeeAmount,
  type ExperienceOrganizationType,
  type ExperienceParticipationCapacity,
} from '@/lib/profile/experience-options';
import {
  DEFAULT_INDUSTRY_KEY,
  INDUSTRY_OPTIONS,
  getIndustryLabelForKey,
  isIndustryKey,
  resolveIndustryFromInputs,
} from '@/lib/industry/options';

const monthInputRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const orgTypeValues = EXPERIENCE_ORGANIZATION_TYPE_OPTIONS.map((option) => option.value) as [
  ExperienceOrganizationType,
  ...ExperienceOrganizationType[],
];

const employeeAmountValues = EXPERIENCE_EMPLOYEE_AMOUNT_OPTIONS.map((option) => option.value) as [
  ExperienceEmployeeAmount,
  ...ExperienceEmployeeAmount[],
];

const participationCapacityValues = EXPERIENCE_PARTICIPATION_CAPACITY_OPTIONS.map(
  (option) => option.value
) as [ExperienceParticipationCapacity, ...ExperienceParticipationCapacity[]];

const outcomeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Outcome name is required'),
  value: z.string().optional(),
  unit: z.string().optional(),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required'),
  participationCapacity: z.enum(participationCapacityValues),
  duration: z.string().min(1, 'Project duration is required'),
});

const experienceSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    organizationName: z.string().min(1, 'Organization name is required'),
    organizationType: z.enum(orgTypeValues),
    organizationIndustryKey: z.string().min(1, 'Industry is required'),
    organizationEmployeeAmount: z.enum(employeeAmountValues),
    startMonth: z.string().regex(monthInputRegex, 'Start month is required'),
    ongoing: z.boolean().default(false),
    endMonth: z
      .string()
      .optional()
      .refine((value) => !value || monthInputRegex.test(value), 'End month must be a valid month'),
    outcomes: z.array(outcomeSchema).min(1, 'At least one outcome is required'),
    projects: z.array(projectSchema).min(1, 'At least one project is required'),
  })
  .superRefine((value, context) => {
    if (!value.ongoing && !value.endMonth) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End month is required unless ongoing',
        path: ['endMonth'],
      });
    }

    if (value.endMonth && value.endMonth < value.startMonth) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End month cannot be earlier than start month',
        path: ['endMonth'],
      });
    }

    value.outcomes.forEach((outcome, index) => {
      if (outcome.value && outcome.value.trim().length > 0 && Number.isNaN(Number(outcome.value))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Outcome value must be numeric',
          path: ['outcomes', index, 'value'],
        });
      }

      if (outcome.value && outcome.value.trim().length > 0 && !outcome.unit?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Measurement unit is required when value is provided',
          path: ['outcomes', index, 'unit'],
        });
      }
    });
  });

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience | null;
  onSave: (experience: Omit<Experience, 'id'>) => void;
}

function createOutcomeDraft(seed?: Partial<ExperienceFormData['outcomes'][number]>) {
  return {
    id: seed?.id || crypto.randomUUID(),
    name: seed?.name || '',
    value: seed?.value || '',
    unit: seed?.unit || '',
  };
}

function createProjectDraft(seed?: Partial<ExperienceFormData['projects'][number]>) {
  return {
    id: seed?.id || crypto.randomUUID(),
    name: seed?.name || '',
    participationCapacity: seed?.participationCapacity || 'contributed',
    duration: seed?.duration || '',
  };
}

function summarizeOutcomes(outcomes: ExperienceFormData['outcomes']) {
  return outcomes
    .map((outcome) => {
      const name = outcome.name.trim();
      if (!name) return null;
      const value = outcome.value?.trim();
      if (!value) return name;
      const unitSuffix = outcome.unit?.trim() ? ` ${outcome.unit.trim()}` : '';
      return `${name}: ${value}${unitSuffix}`;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join('; ');
}

function summarizeProjects(projects: ExperienceFormData['projects']) {
  return projects
    .map((project) => {
      const name = project.name.trim();
      const duration = project.duration.trim();
      if (!name || !duration) return null;

      const participationLabel =
        EXPERIENCE_PARTICIPATION_CAPACITY_OPTIONS.find(
          (option) => option.value === project.participationCapacity
        )?.label || 'Contributed';

      return `${name} (${participationLabel}, ${duration})`;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join('; ');
}

export function ExperienceForm({ open, onOpenChange, experience, onSave }: ExperienceFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      organizationName: '',
      organizationType: 'company',
      organizationIndustryKey: DEFAULT_INDUSTRY_KEY,
      organizationEmployeeAmount: '11-50',
      startMonth: '',
      ongoing: false,
      endMonth: '',
      outcomes: [createOutcomeDraft()],
      projects: [createProjectDraft()],
    },
  });

  const {
    fields: outcomeFields,
    append: appendOutcome,
    remove: removeOutcome,
  } = useFieldArray({
    control,
    name: 'outcomes',
  });

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({
    control,
    name: 'projects',
  });

  const ongoing = watch('ongoing');
  useEffect(() => {
    if (ongoing) {
      setValue('endMonth', '');
    }
  }, [ongoing, setValue]);

  useEffect(() => {
    if (!open) return;

    if (experience) {
      const timeline = buildExperienceTimeline({
        startDate: experience.startDate,
        endDate: experience.endDate,
        duration: experience.duration,
      });

      const resolvedIndustry = resolveIndustryFromInputs({
        industryKey: experience.organizationIndustryKey,
        industryLabel: experience.organizationIndustryLabel,
        legacyIndustry: experience.organizationIndustry,
      });

      const outcomeDefaults =
        experience.measuredOutcomes && experience.measuredOutcomes.length > 0
          ? experience.measuredOutcomes.map((outcome) =>
              createOutcomeDraft({
                id: outcome.id,
                name: outcome.name,
                value:
                  outcome.value !== null && outcome.value !== undefined
                    ? String(outcome.value)
                    : '',
                unit: outcome.unit || '',
              })
            )
          : [
              createOutcomeDraft({
                name: experience.outcomes,
              }),
            ];

      const projectDefaults =
        experience.projectEntries && experience.projectEntries.length > 0
          ? experience.projectEntries.map((project) =>
              createProjectDraft({
                id: project.id,
                name: project.name,
                participationCapacity: project.participationCapacity,
                duration: project.duration,
              })
            )
          : [
              createProjectDraft({
                name: experience.projects,
                participationCapacity: 'contributed',
                duration: experience.duration,
              }),
            ];

      reset({
        title: experience.title,
        organizationName: experience.organizationName || '',
        organizationType: experience.organizationType || 'company',
        organizationIndustryKey: resolvedIndustry.industryKey,
        organizationEmployeeAmount: experience.organizationEmployeeAmount || '11-50',
        startMonth: isoDateToMonthInput(timeline.startDate),
        ongoing: !timeline.endDate,
        endMonth: isoDateToMonthInput(timeline.endDate),
        outcomes: outcomeDefaults,
        projects: projectDefaults,
      });

      return;
    }

    reset({
      title: '',
      organizationName: '',
      organizationType: 'company',
      organizationIndustryKey: DEFAULT_INDUSTRY_KEY,
      organizationEmployeeAmount: '11-50',
      startMonth: '',
      ongoing: false,
      endMonth: '',
      outcomes: [createOutcomeDraft()],
      projects: [createProjectDraft()],
    });
  }, [open, experience, reset]);

  const onSubmit = (data: ExperienceFormData) => {
    const timeline = buildExperienceTimeline({
      startDate: monthInputToIsoDate(data.startMonth),
      endDate: data.ongoing ? null : monthInputToIsoDate(data.endMonth),
    });

    const measuredOutcomes = data.outcomes.map((outcome) => ({
      id: outcome.id,
      name: outcome.name.trim(),
      value: outcome.value && outcome.value.trim().length > 0 ? Number(outcome.value) : null,
      unit: outcome.unit?.trim() ? outcome.unit.trim() : null,
    }));

    const projectEntries = data.projects.map((project) => ({
      id: project.id,
      name: project.name.trim(),
      participationCapacity: project.participationCapacity,
      duration: project.duration.trim(),
    }));

    const industryKey = isIndustryKey(data.organizationIndustryKey)
      ? data.organizationIndustryKey
      : DEFAULT_INDUSTRY_KEY;
    const industryLabel = getIndustryLabelForKey(industryKey);

    onSave({
      title: data.title,
      organizationName: data.organizationName.trim(),
      organizationType: data.organizationType,
      organizationIndustry: industryLabel,
      organizationIndustryKey: industryKey,
      organizationIndustryLabel: industryLabel,
      organizationEmployeeAmount: data.organizationEmployeeAmount,
      orgDescription: experience?.orgDescription || 'Organization details not specified',
      duration: timeline.duration,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      outcomes: summarizeOutcomes(data.outcomes),
      projects: summarizeProjects(data.projects),
      measuredOutcomes,
      projectEntries,
      colleagues: experience?.colleagues || 'Not specified',
      achievements: experience?.achievements || 'Not specified',
      verified: experience?.verified ?? false,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{experience ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          <DialogDescription>
            Capture role context with structured outcomes and projects. Organization name is private
            and not shown on public profile surfaces.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Role/Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder='e.g., "Leading systemic change initiatives"'
              className={errors.title ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">Describe your work, not only job title</p>
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationName">
              Organization Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="organizationName"
              {...register('organizationName')}
              placeholder='e.g., "Proofound Labs"'
              className={errors.organizationName ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Private field. Not shown on public-facing profile views.
            </p>
            {errors.organizationName && (
              <p className="text-xs text-red-500">{errors.organizationName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="organizationType">
                Organization Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="organizationType"
                {...register('organizationType')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {EXPERIENCE_ORGANIZATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationEmployeeAmount">
                Employee Amount <span className="text-red-500">*</span>
              </Label>
              <select
                id="organizationEmployeeAmount"
                {...register('organizationEmployeeAmount')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {EXPERIENCE_EMPLOYEE_AMOUNT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationIndustryKey">
              Industry <span className="text-red-500">*</span>
            </Label>
            <select
              id="organizationIndustryKey"
              {...register('organizationIndustryKey')}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${
                errors.organizationIndustryKey ? 'border-red-500' : 'border-input'
              }`}
            >
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.organizationIndustryKey && (
              <p className="text-xs text-red-500">{errors.organizationIndustryKey.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Timeline <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startMonth" className="text-xs text-muted-foreground">
                  Start month
                </Label>
                <Input
                  id="startMonth"
                  type="month"
                  {...register('startMonth')}
                  className={errors.startMonth ? 'border-red-500' : ''}
                />
                {errors.startMonth && (
                  <p className="text-xs text-red-500">{errors.startMonth.message}</p>
                )}
              </div>

              {!ongoing && (
                <div className="space-y-1">
                  <Label htmlFor="endMonth" className="text-xs text-muted-foreground">
                    End month
                  </Label>
                  <Input
                    id="endMonth"
                    type="month"
                    {...register('endMonth')}
                    className={errors.endMonth ? 'border-red-500' : ''}
                  />
                  {errors.endMonth && (
                    <p className="text-xs text-red-500">{errors.endMonth.message}</p>
                  )}
                </div>
              )}
            </div>

            <label
              htmlFor="ongoing"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <input id="ongoing" type="checkbox" {...register('ongoing')} />
              Ongoing
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Outcomes <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendOutcome(createOutcomeDraft())}
              >
                Add outcome
              </Button>
            </div>

            {outcomeFields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Outcome {index + 1}</p>
                  {outcomeFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOutcome(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1 sm:col-span-1">
                    <Label htmlFor={`outcomes.${index}.name`}>Name</Label>
                    <Input
                      id={`outcomes.${index}.name`}
                      {...register(`outcomes.${index}.name`)}
                      placeholder="e.g., Hiring cycle time"
                      className={errors.outcomes?.[index]?.name ? 'border-red-500' : ''}
                    />
                    {errors.outcomes?.[index]?.name && (
                      <p className="text-xs text-red-500">
                        {errors.outcomes[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`outcomes.${index}.value`}>Number</Label>
                    <Input
                      id={`outcomes.${index}.value`}
                      {...register(`outcomes.${index}.value`)}
                      placeholder="e.g., 32"
                      className={errors.outcomes?.[index]?.value ? 'border-red-500' : ''}
                    />
                    {errors.outcomes?.[index]?.value && (
                      <p className="text-xs text-red-500">
                        {errors.outcomes[index]?.value?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`outcomes.${index}.unit`}>Measurement Unit</Label>
                    <Input
                      id={`outcomes.${index}.unit`}
                      {...register(`outcomes.${index}.unit`)}
                      placeholder="e.g., %"
                      className={errors.outcomes?.[index]?.unit ? 'border-red-500' : ''}
                    />
                    {errors.outcomes?.[index]?.unit && (
                      <p className="text-xs text-red-500">
                        {errors.outcomes[index]?.unit?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Projects <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendProject(createProjectDraft())}
              >
                Add project
              </Button>
            </div>

            {projectFields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Project {index + 1}</p>
                  {projectFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`projects.${index}.name`}>Name</Label>
                    <Input
                      id={`projects.${index}.name`}
                      {...register(`projects.${index}.name`)}
                      placeholder="e.g., Interview rubric revamp"
                      className={errors.projects?.[index]?.name ? 'border-red-500' : ''}
                    />
                    {errors.projects?.[index]?.name && (
                      <p className="text-xs text-red-500">
                        {errors.projects[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`projects.${index}.participationCapacity`}>
                      Participation Capacity
                    </Label>
                    <select
                      id={`projects.${index}.participationCapacity`}
                      {...register(`projects.${index}.participationCapacity`)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {EXPERIENCE_PARTICIPATION_CAPACITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`projects.${index}.duration`}>Duration</Label>
                    <Input
                      id={`projects.${index}.duration`}
                      {...register(`projects.${index}.duration`)}
                      placeholder="e.g., Jan 2024 - May 2024"
                      className={errors.projects?.[index]?.duration ? 'border-red-500' : ''}
                    />
                    {errors.projects?.[index]?.duration && (
                      <p className="text-xs text-red-500">
                        {errors.projects[index]?.duration?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
            <p className="font-medium mb-2">Tip</p>
            <p>
              Focus on concrete outcomes and clear project scope instead of generic responsibility
              lists.
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {experience ? 'Save Changes' : 'Add Experience'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
