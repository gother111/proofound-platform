'use client';

import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeAvailableSkills } from './skill-selection-utils';

type ProfileSkillPickerProps = {
  availableSkills: string[];
  selectedSkills: string[];
  onChange: (nextSkills: string[]) => void;
  inputId?: string;
  searchPlaceholder?: string;
};

export function ProfileSkillPicker({
  availableSkills,
  selectedSkills,
  onChange,
  inputId = 'profile-skill-picker-search',
  searchPlaceholder = 'Search your Expertise Atlas skills',
}: ProfileSkillPickerProps) {
  const [query, setQuery] = useState('');
  const normalizedSkills = useMemo(
    () => normalizeAvailableSkills(availableSkills),
    [availableSkills]
  );

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return normalizedSkills;
    return normalizedSkills.filter((skill) => skill.toLocaleLowerCase().includes(q));
  }, [normalizedSkills, query]);

  const selectedSet = useMemo(
    () => new Set(selectedSkills.map((skill) => skill.toLocaleLowerCase())),
    [selectedSkills]
  );

  const toggleSkill = (skill: string) => {
    const key = skill.toLocaleLowerCase();
    if (selectedSet.has(key)) {
      onChange(selectedSkills.filter((selected) => selected.toLocaleLowerCase() !== key));
      return;
    }
    onChange([...selectedSkills, skill]);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
          placeholder={searchPlaceholder}
        />
      </div>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1 px-2 py-1">
              <span>{skill}</span>
              <button
                type="button"
                className="rounded-sm hover:bg-black/10"
                aria-label={`Remove ${skill}`}
                onClick={() => toggleSkill(skill)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
        {filteredSkills.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No skills found for this search.
          </p>
        ) : (
          filteredSkills.map((skill) => {
            const isSelected = selectedSet.has(skill.toLocaleLowerCase());
            return (
              <Button
                key={skill}
                type="button"
                variant="ghost"
                className="h-9 w-full justify-between px-2 text-left"
                onClick={() => toggleSkill(skill)}
              >
                <span className="truncate">{skill}</span>
                {isSelected ? <Check className="h-4 w-4 text-proofound-forest" /> : null}
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}
