'use client';

import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface SkillLevel {
  skillId: string;
  skillLabel: string;
  level: number; // 0-5
  monthsExperience: number;
}

interface SkillLevelRowProps {
  skill: SkillLevel;
  onChange: (skill: SkillLevel) => void;
  onRemove: () => void;
}

const SKILL_LEVELS = [
  { value: 0, label: 'L0 - Beginner' },
  { value: 1, label: 'L1 - Novice' },
  { value: 2, label: 'L2 - Intermediate' },
  { value: 3, label: 'L3 - Advanced' },
  { value: 4, label: 'L4 - Expert' },
  { value: 5, label: 'L5 - Master' },
];

/**
 * Single skill row with level selector and months of experience.
 */
export function SkillLevelRow({ skill, onChange, onRemove }: SkillLevelRowProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Skill name (read-only) */}
      <div
        className="flex-1 px-3 py-2 text-sm border rounded-md"
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        {skill.skillLabel}
      </div>

      {/* Level selector */}
      <Select
        value={skill.level.toString()}
        onValueChange={(value) => onChange({ ...skill, level: parseInt(value, 10) })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select level" />
        </SelectTrigger>
        <SelectContent>
          {SKILL_LEVELS.map((lvl) => (
            <SelectItem key={lvl.value} value={lvl.value.toString()}>
              {lvl.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Months of experience */}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min="0"
          step="1"
          value={skill.monthsExperience}
          onChange={(e) =>
            onChange({ ...skill, monthsExperience: Math.max(0, parseInt(e.target.value, 10) || 0) })
          }
          className="w-20"
          placeholder="Months"
        />
        <span className="text-xs whitespace-nowrap" style={{ color: '#6B6760' }}>
          months
        </span>
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="p-2"
        aria-label={`Remove ${skill.skillLabel}`}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
