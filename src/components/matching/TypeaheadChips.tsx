'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface TypeaheadOption {
  key: string;
  label: string;
}

interface TypeaheadChipsProps {
  options: readonly TypeaheadOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
}

/**
 * Multi-select chip input with typeahead filtering.
 * Used for tag and skill selection from controlled taxonomies.
 */
export function TypeaheadChips({
  options,
  value,
  onChange,
  placeholder = 'Type to search...',
  maxSelections,
  className,
}: TypeaheadChipsProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on input and already selected
  const filteredOptions = options.filter(
    (option) =>
      !value.includes(option.key) && option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (key: string) => {
    if (maxSelections && value.length >= maxSelections) {
      return;
    }
    onChange([...value, key]);
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (key: string) => {
    onChange(value.filter((k) => k !== key));
  };

  const getLabel = (key: string) => {
    return options.find((opt) => opt.key === key)?.label || key;
  };

  const canAddMore = !maxSelections || value.length < maxSelections;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((key) => (
          <Badge
            key={key}
            variant="secondary"
            className="flex items-center gap-1.5 px-2 py-1.5"
            style={{ backgroundColor: '#E8E6DD' }}
          >
            <span className="text-xs">{getLabel(key)}</span>
            <button
              type="button"
              onClick={() => handleRemove(key)}
              className="-my-2 -mr-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/70 hover:text-proofound-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-1"
              aria-label={`Remove ${getLabel(key)}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Input */}
      {canAddMore && (
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : 'Add more...'}
          className="w-full"
        />
      )}

      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div
          className="absolute z-10 w-full mt-1 max-h-60 overflow-auto border rounded-md shadow-lg"
          style={{ backgroundColor: '#FDFCFA', borderColor: 'rgba(232, 230, 221, 0.6)' }}
        >
          {filteredOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleSelect(option.key)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-proofound-stone transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Help text */}
      {maxSelections && (
        <p className="text-xs mt-1" style={{ color: '#6B6760' }}>
          {value.length} / {maxSelections} selected
        </p>
      )}
    </div>
  );
}
