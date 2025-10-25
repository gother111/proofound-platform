'use client';

import { useState } from 'react';
import { Plus, TrendingUp, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EvidenceType, Recency } from './types';
import { ProficiencyDots } from './ProficiencyDots';
import { EvidenceRing } from './EvidenceRing';
import { PrivacySelector } from './PrivacySelector';
import type { PrivacyLevel } from './types';
import { EvidenceChip } from './EvidenceChip';

type Evidence = {
  type: EvidenceType;
  weight: number;
  issuer?: string;
  date?: string;
};

type LeafSkillCardProps = {
  label: string;
  description: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  verified: boolean;
  evidence: Evidence[];
  recency?: Recency;
  standards?: {
    esco?: string;
    onet?: string;
    sfia?: string;
  };
  privacy?: PrivacyLevel;
  onClick?: () => void;
  onAddProof?: () => void;
  onAskReview?: () => void;
  onAddGrowthStep?: () => void;
  onPrivacyChange?: (privacy: PrivacyLevel) => void;
};

export function LeafSkillCard({
  label,
  description,
  proficiency,
  verified,
  evidence,
  recency = 'recent',
  standards,
  privacy = 'team',
  onClick,
  onAddProof,
  onAskReview,
  onAddGrowthStep,
  onPrivacyChange,
}: LeafSkillCardProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if ((event.target as HTMLElement).closest('button')) return;
    onClick?.();
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative rounded-2xl border p-4 transition ${
        onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-md' : ''
      } ${
        verified
          ? 'border-[#1C4D3A]/20 bg-white dark:border-[#4A5F52]/40 dark:bg-[#3A3530]'
          : 'border-[#E8E6DD] bg-[#F7F6F1] dark:border-[#4A4540] dark:bg-[#343430]'
      }`}
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <h4 className="truncate text-sm font-semibold text-[#2D3330] dark:text-[#E8E6DD]">
            {label}
          </h4>
          {verified && <VerifiedIcon />}
        </div>
        {onPrivacyChange && (
          <div
            className={`transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <PrivacySelector value={privacy} onChange={onPrivacyChange} compact />
          </div>
        )}
      </header>

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-3 text-xs text-[#2D3330]/70 dark:text-[#E8E6DD]/70">{description}</p>
          <ProficiencyDots level={proficiency} showLabel showBARS />
        </div>
        {evidence.length > 0 && <EvidenceRing segments={evidence} recency={recency} size="sm" />}
      </div>

      {standards && Object.keys(standards).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E8E6DD] pt-3 text-xs text-[#2D3330]/60 dark:border-[#4A4540] dark:text-[#E8E6DD]/60">
          {standards.esco && (
            <span className="rounded bg-[#E8E6DD] px-2 py-0.5 dark:bg-[#4A4540]">
              ESCO: {standards.esco}
            </span>
          )}
          {standards.onet && (
            <span className="rounded bg-[#E8E6DD] px-2 py-0.5 dark:bg-[#4A4540]">
              O*NET: {standards.onet}
            </span>
          )}
          {standards.sfia && (
            <span className="rounded bg-[#E8E6DD] px-2 py-0.5 dark:bg-[#4A4540]">
              SFIA: {standards.sfia}
            </span>
          )}
        </div>
      )}

      {evidence.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {evidence.slice(0, 3).map((item, index) => (
            <EvidenceChip key={`${item.type}-${index}`} type={item.type} />
          ))}
          {evidence.length > 3 && (
            <span className="text-xs text-[#6B6760] dark:text-[#E8E6DD]/70">
              +{evidence.length - 3} more
            </span>
          )}
        </div>
      )}

      {(onAddProof || onAskReview || onAddGrowthStep) && (
        <div
          className={`mt-3 flex gap-2 border-t border-[#E8E6DD] pt-3 transition-all dark:border-[#4A4540] ${hovered ? 'opacity-100' : 'max-h-0 opacity-0'} ${hovered ? 'max-h-20' : ''}`}
        >
          {onAddProof && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 gap-1.5 text-xs"
              onClick={onAddProof}
            >
              <Plus className="h-3 w-3" /> Add proof
            </Button>
          )}
          {onAskReview && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 gap-1.5 text-xs"
              onClick={onAskReview}
            >
              <UserPlus className="h-3 w-3" /> Ask review
            </Button>
          )}
          {onAddGrowthStep && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 gap-1.5 text-xs"
              onClick={onAddGrowthStep}
            >
              <TrendingUp className="h-3 w-3" /> Growth step
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#1C4D3A] dark:text-[#B8D4C6]">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
