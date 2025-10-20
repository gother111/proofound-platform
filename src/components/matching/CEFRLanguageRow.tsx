'use client';

import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LANGUAGE_OPTIONS, CEFR_LEVELS } from '@/lib/taxonomy/data';

export interface LanguageProficiency {
  code: string;
  level: string; // CEFR level (A1-C2)
}

interface CEFRLanguageRowProps {
  language: LanguageProficiency;
  onChange: (language: LanguageProficiency) => void;
  onRemove: () => void;
}

/**
 * Language selector with CEFR proficiency level.
 */
export function CEFRLanguageRow({ language, onChange, onRemove }: CEFRLanguageRowProps) {
  const selectedLanguage = LANGUAGE_OPTIONS.find((opt) => opt.key === language.code);

  return (
    <div className="flex items-center gap-2">
      {/* Language selector */}
      <Select
        value={language.code}
        onValueChange={(value) => onChange({ ...language, code: value })}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select language">
            {selectedLanguage?.label || 'Select language'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((lang) => (
            <SelectItem key={lang.key} value={lang.key}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* CEFR level selector */}
      <Select
        value={language.level}
        onValueChange={(value) => onChange({ ...language, level: value })}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Level" />
        </SelectTrigger>
        <SelectContent>
          {CEFR_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {level}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="p-2"
        aria-label={`Remove ${selectedLanguage?.label || 'language'}`}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
