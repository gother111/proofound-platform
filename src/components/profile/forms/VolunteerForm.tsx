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
import { Volunteering } from '@/types/profile';

interface VolunteerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteering?: Volunteering | null;
  onSave: (volunteering: Omit<Volunteering, 'id'>) => void;
}

export function VolunteerForm({ open, onOpenChange, volunteering, onSave }: VolunteerFormProps) {
  const [title, setTitle] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [cause, setCause] = useState('');
  const [impact, setImpact] = useState('');
  const [skillsDeployed, setSkillsDeployed] = useState('');
  const [personalWhy, setPersonalWhy] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (volunteering) {
        setTitle(volunteering.title);
        setOrgDescription(volunteering.orgDescription);
        setDuration(volunteering.duration);
        setCause(volunteering.cause);
        setImpact(volunteering.impact);
        setSkillsDeployed(volunteering.skillsDeployed);
        setPersonalWhy(volunteering.personalWhy);
      } else {
        setTitle('');
        setOrgDescription('');
        setDuration('');
        setCause('');
        setImpact('');
        setSkillsDeployed('');
        setPersonalWhy('');
      }
      setErrors({});
    }
  }, [open, volunteering]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Role/Title is required';
    if (!orgDescription.trim()) newErrors.orgDescription = 'Organization description is required';
    if (!duration.trim()) newErrors.duration = 'Duration is required';
    if (!cause.trim()) newErrors.cause = 'Cause is required';
    if (!impact.trim()) newErrors.impact = 'Impact description is required';
    if (!skillsDeployed.trim()) newErrors.skillsDeployed = 'Skills deployed is required';
    if (!personalWhy.trim()) newErrors.personalWhy = 'Personal motivation is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      title: title.trim(),
      orgDescription: orgDescription.trim(),
      duration: duration.trim(),
      cause: cause.trim(),
      impact: impact.trim(),
      skillsDeployed: skillsDeployed.trim(),
      personalWhy: personalWhy.trim(),
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
              placeholder='e.g., "Board governance and strategic direction"'
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
              placeholder='e.g., "Youth-led climate organization, National reach"'
              className={errors.orgDescription ? 'border-red-500' : ''}
            />
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
              placeholder='e.g., "2022 - Present"'
              className={errors.duration ? 'border-red-500' : ''}
            />
            {errors.duration && <p className="text-xs text-red-500">{errors.duration}</p>}
          </div>

          {/* Personal Connection - HIGHLIGHTED SECTION */}
          <div
            className="space-y-4 p-4 rounded-lg border-2"
            style={{
              backgroundColor: 'rgba(198, 123, 92, 0.05)',
              borderColor: 'rgba(198, 123, 92, 0.3)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'rgb(198, 123, 92)' }}
              />
              <Label className="text-base" style={{ color: 'rgb(198, 123, 92)' }}>
                Personal Connection
              </Label>
            </div>

            {/* Cause */}
            <div className="space-y-2">
              <Label htmlFor="cause">
                Cause <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cause"
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                placeholder='e.g., "Climate Justice - Amplifying youth voices"'
                className={errors.cause ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">What cause is this connected to?</p>
              {errors.cause && <p className="text-xs text-red-500">{errors.cause}</p>}
            </div>

            {/* Personal Why */}
            <div className="space-y-2">
              <Label htmlFor="personalWhy">
                Why This Matters to You <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="personalWhy"
                value={personalWhy}
                onChange={(e) => setPersonalWhy(e.target.value)}
                placeholder="Share your personal connection and motivation for this cause"
                className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.personalWhy ? 'border-red-500' : ''
                }`}
              />
              <p className="text-xs text-muted-foreground italic">
                This is the heart of your service work - be authentic
              </p>
              {errors.personalWhy && <p className="text-xs text-red-500">{errors.personalWhy}</p>}
            </div>
          </div>

          {/* Impact Created */}
          <div className="space-y-2">
            <Label htmlFor="impact">
              Impact Created <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="What change did you help create?"
              className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.impact ? 'border-red-500' : ''
              }`}
            />
            {errors.impact && <p className="text-xs text-red-500">{errors.impact}</p>}
          </div>

          {/* Skills Deployed */}
          <div className="space-y-2">
            <Label htmlFor="skillsDeployed">
              Skills Deployed <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="skillsDeployed"
              value={skillsDeployed}
              onChange={(e) => setSkillsDeployed(e.target.value)}
              placeholder="What skills and expertise did you contribute?"
              className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.skillsDeployed ? 'border-red-500' : ''
              }`}
            />
            {errors.skillsDeployed && (
              <p className="text-xs text-red-500">{errors.skillsDeployed}</p>
            )}
          </div>

          {/* Guidance */}
          <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
            <p className="font-medium mb-2">💡 Tip:</p>
            <p>
              Connect your service to your values and explain your personal motivation. Authentic
              connection matters more than polish.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {volunteering ? 'Save Changes' : 'Add Volunteer Work'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
