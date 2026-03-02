'use client';

import { Check, RefreshCw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type SkillMatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';

export interface SkillMatchOption {
  skill_id: string;
  skill_name: string;
  match_method: SkillMatchMethod;
  score: number;
}

interface SkillMatchPickerProps {
  open: boolean;
  loading: boolean;
  query: string;
  options: SkillMatchOption[];
  selectedSkillIds: string[];
  lastSearchedAtLabel?: string;
  onSelect: (option: SkillMatchOption) => void;
  onReplace: (option: SkillMatchOption) => void;
  onClose: () => void;
}

function scorePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

export function SkillMatchPicker({
  open,
  loading,
  query,
  options,
  selectedSkillIds,
  lastSearchedAtLabel,
  onSelect,
  onReplace,
  onClose,
}: SkillMatchPickerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="rounded-md border bg-background p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">
          {loading
            ? 'Searching Atlas skills...'
            : options.length > 0
              ? `${options.length} matches found${lastSearchedAtLabel ? ` • ${lastSearchedAtLabel}` : ''}`
              : 'No close Atlas match found. Try another term.'}
        </p>
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close match picker">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="mb-2 text-xs text-muted-foreground">Search term: {query || '-'}</p>

      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedSkillIds.includes(option.skill_id);
          return (
            <div key={option.skill_id} className="rounded border p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{option.skill_name}</p>
                  <p className="text-xs text-muted-foreground">{option.skill_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{scorePercent(option.score)}%</Badge>
                  <Badge variant="outline">{option.match_method}</Badge>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={isSelected ? 'secondary' : 'outline'}
                  onClick={() => onSelect(option)}
                >
                  <Check className="mr-1 h-3 w-3" />
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReplace(option)}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Replace current
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
