'use client';

import React from 'react';
import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({ label, active, onClick, onRemove, className = '' }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200
        ${
          active
            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
            : 'bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
        }
        ${className}
      `}
    >
      <span className="text-sm">{label}</span>
      {active && onRemove && (
        <X
          className="w-3 h-3"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
}
