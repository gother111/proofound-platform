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
import { Education } from '@/types/profile';
import { motion } from 'framer-motion';

interface EducationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  education?: Education | null;
  onSave: (education: Omit<Education, 'id'>) => void;
}

export function EducationForm({ open, onOpenChange, education, onSave }: EducationFormProps) {
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [duration, setDuration] = useState('');
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (education) {
        setInstitution(education.institution);
        setDegree(education.degree);
        setDuration(education.duration);
        setSkills(education.skills);
        setProjects(education.projects);
      } else {
        setInstitution('');
        setDegree('');
        setDuration('');
        setSkills('');
        setProjects('');
      }
      setErrors({});
    }
  }, [open, education]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!institution.trim()) newErrors.institution = 'Institution name is required';
    if (!degree.trim()) newErrors.degree = 'Degree/Program is required';
    if (!duration.trim()) newErrors.duration = 'Duration is required';
    if (!skills.trim()) newErrors.skills = 'Skills gained is required';
    if (!projects.trim()) newErrors.projects = 'Meaningful projects is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      institution: institution.trim(),
      degree: degree.trim(),
      duration: duration.trim(),
      skills: skills.trim(),
      projects: projects.trim(),
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
              <Label htmlFor="skills">
                Skills Gained <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="List the practical skills and knowledge you gained"
                className={`flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.skills ? 'border-red-500' : ''
                }`}
              />
              <p className="text-xs text-muted-foreground">Focus on practical, applicable skills</p>
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
          <Button type="button" onClick={handleSave}>
            {education ? 'Save Changes' : 'Add Education'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
