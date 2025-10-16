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
import { ImpactStory } from '@/types/profile';

interface ImpactStoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story?: ImpactStory | null; // If editing existing story
  onSave: (story: Omit<ImpactStory, 'id'>) => void;
}

export function ImpactStoryForm({ open, onOpenChange, story, onSave }: ImpactStoryFormProps) {
  const [title, setTitle] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [impact, setImpact] = useState('');
  const [businessValue, setBusinessValue] = useState('');
  const [outcomes, setOutcomes] = useState('');
  const [timeline, setTimeline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (story) {
        setTitle(story.title);
        setOrgDescription(story.orgDescription);
        setImpact(story.impact);
        setBusinessValue(story.businessValue);
        setOutcomes(story.outcomes);
        setTimeline(story.timeline);
      } else {
        setTitle('');
        setOrgDescription('');
        setImpact('');
        setBusinessValue('');
        setOutcomes('');
        setTimeline('');
      }
      setErrors({});
    }
  }, [open, story]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!orgDescription.trim()) {
      newErrors.orgDescription = 'Organization description is required';
    }

    if (!impact.trim()) {
      newErrors.impact = 'Impact description is required';
    }

    if (!businessValue.trim()) {
      newErrors.businessValue = 'Business value is required';
    }

    if (!outcomes.trim()) {
      newErrors.outcomes = 'Outcomes are required';
    }

    if (!timeline.trim()) {
      newErrors.timeline = 'Timeline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      title: title.trim(),
      orgDescription: orgDescription.trim(),
      impact: impact.trim(),
      businessValue: businessValue.trim(),
      outcomes: outcomes.trim(),
      timeline: timeline.trim(),
      verified: false,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{story ? 'Edit Impact Story' : 'Add Impact Story'}</DialogTitle>
          <DialogDescription>
            Share a meaningful project and its impact. Focus on the change created, not just tasks
            completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you work on?"
              className={errors.title ? 'border-red-500' : ''}
            />
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
              placeholder='e.g., "Mid-size nonprofit, Climate sector, Bay Area"'
              className={errors.orgDescription ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Describe the organization without naming it directly
            </p>
            {errors.orgDescription && (
              <p className="text-xs text-red-500">{errors.orgDescription}</p>
            )}
          </div>

          {/* Impact */}
          <div className="space-y-2">
            <Label htmlFor="impact">
              Impact <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="What changed because of this work?"
              className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.impact ? 'border-red-500' : ''
              }`}
            />
            {errors.impact && <p className="text-xs text-red-500">{errors.impact}</p>}
          </div>

          {/* Business Value */}
          <div className="space-y-2">
            <Label htmlFor="businessValue">
              Business Value <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="businessValue"
              value={businessValue}
              onChange={(e) => setBusinessValue(e.target.value)}
              placeholder="Why did this matter to the organization and broader community?"
              className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.businessValue ? 'border-red-500' : ''
              }`}
            />
            {errors.businessValue && <p className="text-xs text-red-500">{errors.businessValue}</p>}
          </div>

          {/* Outcomes */}
          <div className="space-y-2">
            <Label htmlFor="outcomes">
              Outcomes <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="outcomes"
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              placeholder="Measurable results: numbers, metrics, people impacted"
              className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.outcomes ? 'border-red-500' : ''
              }`}
            />
            <p className="text-xs text-muted-foreground">
              Include specific numbers and quantifiable results
            </p>
            {errors.outcomes && <p className="text-xs text-red-500">{errors.outcomes}</p>}
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Label htmlFor="timeline">
              Timeline <span className="text-red-500">*</span>
            </Label>
            <Input
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder='e.g., "2023 - Present" or "2022"'
              className={errors.timeline ? 'border-red-500' : ''}
            />
            {errors.timeline && <p className="text-xs text-red-500">{errors.timeline}</p>}
          </div>

          {/* Guidance */}
          <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-medium">💡 Tips for a great impact story:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Focus on change and outcomes, not just activities</li>
              <li>Include context about the organization and situation</li>
              <li>Use specific numbers and metrics when possible</li>
              <li>Explain both immediate and long-term impact</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {story ? 'Save Changes' : 'Add Story'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
