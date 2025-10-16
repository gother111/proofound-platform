import { useState, useEffect } from 'react';
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

interface ExperienceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience | null;
  onSave: (experience: Omit<Experience, 'id'>) => void;
}

export function ExperienceForm({ open, onOpenChange, experience, onSave }: ExperienceFormProps) {
  const [title, setTitle] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [learning, setLearning] = useState('');
  const [growth, setGrowth] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (experience) {
        setTitle(experience.title);
        setOrgDescription(experience.orgDescription);
        setDuration(experience.duration);
        setLearning(experience.learning);
        setGrowth(experience.growth);
      } else {
        setTitle('');
        setOrgDescription('');
        setDuration('');
        setLearning('');
        setGrowth('');
      }
      setErrors({});
    }
  }, [open, experience]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!orgDescription.trim()) newErrors.orgDescription = 'Organization description is required';
    if (!duration.trim()) newErrors.duration = 'Duration is required';
    if (!learning.trim()) newErrors.learning = 'Learning description is required';
    if (!growth.trim()) newErrors.growth = 'Growth description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      title: title.trim(),
      orgDescription: orgDescription.trim(),
      duration: duration.trim(),
      learning: learning.trim(),
      growth: growth.trim(),
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
            Share your professional experiences. Focus on what you learned and how you grew.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Role/Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g., "Leading systemic change initiatives"'
              className={errors.title ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">Describe your work, not your job title</p>
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Organization Description */}
          <div className="space-y-2">
            <Label htmlFor="orgDescription">
              Organization <span className="text-red-500">*</span>
            </Label>
            <Input
              id="orgDescription"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              placeholder='e.g., "National nonprofit, Climate Justice, 50-200 employees"'
              className={errors.orgDescription ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">Size, industry, location</p>
            {errors.orgDescription && (
              <p className="text-xs text-red-500">{errors.orgDescription}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">
              Duration <span className="text-red-500">*</span>
            </Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder='e.g., "2023 - Present"'
              className={errors.duration ? 'border-red-500' : ''}
            />
            {errors.duration && <p className="text-xs text-red-500">{errors.duration}</p>}
          </div>

          {/* What I Learned */}
          <div className="space-y-2">
            <Label htmlFor="learning">
              What I Learned <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="learning"
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              placeholder="What new skills, knowledge, or perspectives did you gain?"
              className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.learning ? 'border-red-500' : ''
              }`}
            />
            {errors.learning && <p className="text-xs text-red-500">{errors.learning}</p>}
          </div>

          {/* How I Grew */}
          <div className="space-y-2">
            <Label htmlFor="growth">
              How I Grew <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="growth"
              value={growth}
              onChange={(e) => setGrowth(e.target.value)}
              placeholder="How did this experience change you professionally?"
              className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.growth ? 'border-red-500' : ''
              }`}
            />
            {errors.growth && <p className="text-xs text-red-500">{errors.growth}</p>}
          </div>

          {/* Guidance */}
          <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
            <p className="font-medium mb-2">💡 Tip:</p>
            <p>
              Emphasize personal growth over job titles and responsibilities. Share authentic
              insights about your development.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {experience ? 'Save Changes' : 'Add Experience'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
