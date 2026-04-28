'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type HeroVariant = 'manifesto' | 'artifact' | 'human-proof';

interface HeroSwitcherProps {
  activeVariant: HeroVariant;
  onChange: (variant: HeroVariant) => void;
}

export function HeroSwitcher({ activeVariant, onChange }: HeroSwitcherProps) {
  const options: { id: HeroVariant; label: string }[] = [
    { id: 'manifesto', label: 'Manifesto' },
    { id: 'artifact', label: 'Artifact' },
    { id: 'human-proof', label: 'Human + Proof' },
  ];

  return (
    <div className="flex items-center justify-center pointer-events-auto">
      <div className="flex items-center gap-1 bg-muted/30 backdrop-blur-md p-1 rounded-full border border-border/40">
        {options.map((option) => {
          const isActive = activeVariant === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                'relative px-5 py-2 text-sm font-medium transition-colors rounded-full outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest',
                isActive
                  ? 'text-proofound-forest dark:text-proofound-parchment'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="hero-switcher-active"
                  className="absolute inset-0 bg-background shadow-sm rounded-full border border-border/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
