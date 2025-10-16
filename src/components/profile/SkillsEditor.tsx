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
import { Badge } from '@/components/ui/badge';
import { Skill } from '@/types/profile';
import { CheckCircle2, X } from 'lucide-react';

interface SkillsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: Skill[];
  onSave: (skills: Skill[]) => void;
}

export function SkillsEditor({ open, onOpenChange, skills, onSave }: SkillsEditorProps) {
  const [editedSkills, setEditedSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEditedSkills([...skills]);
      setNewSkillName('');
      setError(null);
    }
  }, [open, skills]);

  const handleAddSkill = () => {
    const trimmedName = newSkillName.trim();

    if (!trimmedName) {
      setError('Skill name cannot be empty');
      return;
    }

    if (editedSkills.some((s) => s.name === trimmedName)) {
      setError('Skill already added');
      return;
    }

    const newSkill: Skill = {
      id: Date.now().toString(),
      name: trimmedName,
      verified: false,
    };

    setEditedSkills([...editedSkills, newSkill]);
    setNewSkillName('');
    setError(null);
  };

  const handleDeleteSkill = (id: string) => {
    setEditedSkills(editedSkills.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    if (editedSkills.length === 0) {
      setError('Please add at least one skill');
      return;
    }

    onSave(editedSkills);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Skills & Expertise</DialogTitle>
          <DialogDescription>Your capabilities and areas of knowledge.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Skills */}
          {editedSkills.length > 0 && (
            <div className="space-y-2">
              <Label>Your Skills</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {editedSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{skill.name}</span>
                      {skill.verified && <CheckCircle2 className="w-4 h-4 text-[#7A9278]" />}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Skill */}
          <div className="space-y-2">
            <Label htmlFor="new-skill">Add New Skill</Label>
            <div className="flex gap-2">
              <Input
                id="new-skill"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g., Strategic Planning"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddSkill}>
                Add
              </Button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Tip:</p>
            <p>
              Add skills that are relevant to your work and impact. These can be verified by your
              network connections.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Skills
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
