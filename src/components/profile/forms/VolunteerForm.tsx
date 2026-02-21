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
import { Volunteering } from '@/types/profile';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const volunteerSchema = z.object({
  title: z.string().min(1, 'Role/Title is required'),
  orgDescription: z.string().min(1, 'Organization description is required'),
  duration: z.string().min(1, 'Duration is required'),
  cause: z.string().min(1, 'Cause is required'),
  impact: z.string().min(1, 'Impact description is required'),
  skillsDeployed: z.string().min(1, 'Skills deployed is required'),
  personalWhy: z.string().min(1, 'Personal motivation is required'),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

interface VolunteerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteering?: Volunteering | null;
  onSave: (volunteering: Omit<Volunteering, 'id'>) => void;
}

export function VolunteerForm({ open, onOpenChange, volunteering, onSave }: VolunteerFormProps) {
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
      skillsDeployed: '',
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
          skillsDeployed: volunteering.skillsDeployed,
          personalWhy: volunteering.personalWhy,
        });
      } else {
        reset({
          title: '',
          orgDescription: '',
          duration: '',
          cause: '',
          impact: '',
          skillsDeployed: '',
          personalWhy: '',
        });
      }
    }
  }, [open, volunteering, reset]);

  const onSubmit = (data: VolunteerFormData) => {
    onSave({
      ...data,
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
            Highlight your volunteer work and community involvement. Explain why these causes matter
            to you.
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
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label htmlFor="skillsDeployed">
                Skills Deployed <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="skillsDeployed"
                {...register('skillsDeployed')}
                placeholder="What skills and expertise did you contribute?"
                className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.skillsDeployed ? 'border-red-500' : ''
                }`}
              />
              {errors.skillsDeployed && (
                <p className="text-xs text-red-500">{errors.skillsDeployed.message}</p>
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
                Connect your service to your values and explain your personal motivation. Authentic
                connection matters more than polish.
              </p>
            </motion.div>
          </motion.div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{volunteering ? 'Save Changes' : 'Add Volunteer Work'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
