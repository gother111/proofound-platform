'use client';

import React, { useState } from 'react';
import { Play, Pin, ChevronDown, ChevronUp, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { EvidenceBadge } from './EvidenceBadge';

interface PracticeTileCardProps {
  title: string;
  duration: string;
  benefit: string;
  evidenceType: 'rct-backed' | 'nice-recommended' | 'meta-reviewed' | 'initial' | 'third-party';
  whatToExpect: string;
  isThirdParty?: boolean;
  isPinned?: boolean;
  onStart: () => void;
  onPin: () => void;
  onOpenDetail: () => void;
  showCaution?: boolean;
  isSpiritual?: boolean;
}

export function PracticeTileCard({
  title,
  duration,
  benefit,
  evidenceType,
  whatToExpect,
  isThirdParty,
  isPinned,
  onStart,
  onPin,
  onOpenDetail,
  showCaution,
  isSpiritual,
}: PracticeTileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-2xl p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              className="text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-primary)] text-left font-semibold"
              onClick={onOpenDetail}
            >
              {title}
            </button>
            {showCaution && (
              <AlertCircle
                className="w-4 h-4 text-[var(--color-accent)]"
                title="Consider shorter practice first"
              />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] rounded-lg text-xs">
              {duration}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">{benefit}</span>
          </div>
        </div>
        <button
          onClick={onPin}
          className={`p-2 rounded-lg transition-colors ${
            isPinned
              ? 'text-[var(--color-accent)] bg-[var(--color-accent)] bg-opacity-10'
              : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-neutral-light)] dark:hover:bg-[var(--color-neutral-dark)]'
          }`}
          title={isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <EvidenceBadge type={evidenceType} />
        {isThirdParty && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400">External app</span>
          </div>
        )}
        {isSpiritual && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <span className="text-xs text-purple-600 dark:text-purple-400">Spiritual</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <span>What to expect</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {isExpanded && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {whatToExpect}
          </p>
        )}
      </div>

      <Button
        onClick={onStart}
        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
      >
        <Play className="w-4 h-4 mr-2" />
        Start
      </Button>
    </div>
  );
}
