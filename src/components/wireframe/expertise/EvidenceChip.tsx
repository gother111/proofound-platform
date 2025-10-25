'use client';

import type { EvidenceType } from './types';

const COLORS: Record<EvidenceType, { bg: string; text: string; darkBg: string; darkText: string }> =
  {
    'self-claim': { bg: '#E8E6DD', text: '#2D3330', darkBg: '#3A3530', darkText: '#E8E6DD' },
    peer: { bg: '#D4E5DC', text: '#1C4D3A', darkBg: '#2D4A3F', darkText: '#B8D4C6' },
    artifact: { bg: '#F5DDD0', text: '#8B4A2F', darkBg: '#4A3A30', darkText: '#E5C5B5' },
    assessment: { bg: '#D4E8E5', text: '#1C4D4D', darkBg: '#2D4A48', darkText: '#B8D4D1' },
    certification: { bg: '#E5D4DC', text: '#4D1C3A', darkBg: '#4A2D3F', darkText: '#D4B8C6' },
    impact: { bg: '#E8D4C0', text: '#6B4A2F', darkBg: '#4A3A2F', darkText: '#D4BBA8' },
    external: { bg: '#C0D4E8', text: '#2F4A6B', darkBg: '#2F3A4A', darkText: '#A8BBD4' },
  };

const LABELS: Record<EvidenceType, string> = {
  'self-claim': 'Self',
  peer: 'Peer',
  artifact: 'Artifact',
  assessment: 'Assessment',
  certification: 'Cert',
  impact: 'Impact',
  external: 'External',
};

export function EvidenceChip({
  type,
  count,
  compact = false,
}: {
  type: EvidenceType;
  count?: number;
  compact?: boolean;
}) {
  const palette = COLORS[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-xs ${compact ? 'px-2 py-0.5' : 'px-3 py-1'}`}
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
      }}
    >
      {LABELS[type]}
      {typeof count === 'number' && count > 0 && <span className="opacity-70">·{count}</span>}
    </span>
  );
}
