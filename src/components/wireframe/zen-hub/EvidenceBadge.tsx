'use client';

import React from 'react';
import { BadgeCheck, Award, FileText, FlaskConical, ExternalLink } from 'lucide-react';

interface EvidenceBadgeProps {
  type: 'rct-backed' | 'nice-recommended' | 'meta-reviewed' | 'initial' | 'third-party';
}

export function EvidenceBadge({ type }: EvidenceBadgeProps) {
  const configs = {
    'rct-backed': {
      label: 'RCT-backed',
      icon: BadgeCheck,
      className:
        'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    'nice-recommended': {
      label: 'NICE recommended',
      icon: Award,
      className:
        'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    'meta-reviewed': {
      label: 'Meta-reviewed',
      icon: FileText,
      className:
        'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    initial: {
      label: 'Initial evidence',
      icon: FlaskConical,
      className:
        'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    'third-party': {
      label: 'Third-party',
      icon: ExternalLink,
      className:
        'bg-slate-100 dark:bg-slate-900/20 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300',
      iconColor: 'text-slate-600 dark:text-slate-400',
    },
  } as const;

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${config.className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
}
