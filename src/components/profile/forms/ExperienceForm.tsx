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
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  buildExperienceTimeline,
  isoDateToMonthInput,
  monthInputToIsoDate,
} from '@/lib/profile/experience-timeline';

const monthInputRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const experienceSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    orgDescription: z.string().min(1, 'Organization description is required'),
    startMonth: z.string().regex(monthInputRegex, 'Start month is required'),
    endMonth: z
      .string()
      .optional()
      .refine((value) => !value || monthInputRegex.test(value), 'End month must be a valid month'),
    outcomes: z.string().min(1, 'Outcomes are required'),
    projects: z.string().min(1, 'Projects are required'),
    colleagues: z.string().min(1, 'Colleagues are required'),
    achievements: z.string().min(1, 'Achievements are required'),
  })
  .superRefine((value, context) => {
    if (value.endMonth && value.endMonth < value.startMonth) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End month cannot be earlier than start month',
        path: ['endMonth'],
      });
    }
  });

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience | null;
  onSave: (experience: Omit<Experience, 'id'>) => void;
}

export function ExperienceForm({ open, onOpenChange, experience, onSave }: ExperienceFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      orgDescription: '',
      startMonth: '',
      endMonth: '',
      outcomes: '',
      projects: '',
      colleagues: '',
      achievements: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (experience) {
        const timeline = buildExperienceTimeline({
          startDate: experience.startDate,
          endDate: experience.endDate,
          duration: experience.duration,
        });

        reset({
          title: experience.title,
          orgDescription: experience.orgDescription,
          startMonth: isoDateToMonthInput(timeline.startDate),
          endMonth: isoDateToMonthInput(timeline.endDate),
          outcomes: experience.outcomes,
          projects: experience.projects,
          colleagues: experience.colleagues,
          achievements: experience.achievements,
        });
      } else {
        reset({
          title: '',
          orgDescription: '',
          startMonth: '',
          endMonth: '',
          outcomes: '',
          projects: '',
          colleagues: '',
          achievements: '',
        });
      }
    }
  }, [open, experience, reset]);

  const onSubmit = (data: ExperienceFormData) => {
    const timeline = buildExperienceTimeline({
      startDate: monthInputToIsoDate(data.startMonth),
      endDate: monthInputToIsoDate(data.endMonth),
    });

    onSave({
      title: data.title,
      orgDescription: data.orgDescription,
      duration: timeline.duration,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      outcomes: data.outcomes,
      projects: data.projects,
      colleagues: data.colleagues,
      achievements: data.achievements,
      verified: false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{experience ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          <DialogDescription>
            Share your professional experiences with outcomes, projects, colleagues, and
            achievements.
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
                placeholder='e.g., "Leading systemic change initiatives"'
                className={errors.title ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Describe your work, not your job title
              </p>
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
                placeholder='e.g., "National nonprofit, Climate Justice, 50-200 employees"'
                className={errors.orgDescription ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">Size, industry, location</p>
              {errors.orgDescription && (
                <p className="text-xs text-red-500">{errors.orgDescription.message}</p>
              )}
            </motion.div>

            {/* Timeline */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
              </div>
              <p className="text-xs text-muted-foreground">
                Leave end month empty if this role is ongoing.
              </p>
            </motion.div>

            {/* Outcomes */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="outcomes">
                Outcomes <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="outcomes"
                {...register('outcomes')}
                placeholder="What measurable outcomes did this experience produce?"
                className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.outcomes ? 'border-red-500' : ''
                }`}
              />
              {errors.outcomes && <p className="text-xs text-red-500">{errors.outcomes.message}</p>}
            </motion.div>

            {/* Projects */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="projects">
                Projects <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="projects"
                {...register('projects')}
                placeholder="Which projects or initiatives did you lead or contribute to?"
                className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.projects ? 'border-red-500' : ''
                }`}
              />
              {errors.projects && <p className="text-xs text-red-500">{errors.projects.message}</p>}
            </motion.div>

            {/* Colleagues */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="colleagues">
                Colleagues <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="colleagues"
                {...register('colleagues')}
                placeholder="Who did you collaborate with and what was your working dynamic?"
                className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.colleagues ? 'border-red-500' : ''
                }`}
              />
              {errors.colleagues && (
                <p className="text-xs text-red-500">{errors.colleagues.message}</p>
              )}
            </motion.div>

            {/* Achievements */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="achievements">
                Achievements <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="achievements"
                {...register('achievements')}
                placeholder="What achievements or recognition stand out from this experience?"
                className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.achievements ? 'border-red-500' : ''
                }`}
              />
              {errors.achievements && (
                <p className="text-xs text-red-500">{errors.achievements.message}</p>
              )}
            </motion.div>

            {/* Guidance */}
            <motion.div
              className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-medium mb-2">💡 Tip:</p>
              <p>
                Focus on concrete outcomes, collaboration context, and achievements instead of only
                listing responsibilities.
              </p>
            </motion.div>
          </motion.div>

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
