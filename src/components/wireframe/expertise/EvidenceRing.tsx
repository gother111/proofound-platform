'use client';

import { cn } from '@/lib/utils';
import type { EvidenceType } from './types';

type Segment = { type: EvidenceType; weight: number };

type Recency = 'fresh' | 'recent' | 'stale';

const PALETTE: Record<EvidenceType, string> = {
  'self-claim': '#7A9278',
  peer: '#4A5943',
  artifact: '#C67B5C',
  assessment: '#5C8B89',
  certification: '#D4A574',
  impact: '#8B6B50',
  external: '#4B6A8B',
};

const RECENCY_CLASSES: Record<Recency, string> = {
  fresh: 'opacity-100',
  recent: 'opacity-80',
  stale: 'opacity-50',
};

export function EvidenceRing({
  segments,
  recency,
  size = 'md',
}: {
  segments: Segment[];
  recency: Recency;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dimension = size === 'sm' ? 60 : size === 'lg' ? 120 : 90;
  const radius = dimension / 2;
  const strokeWidth = size === 'sm' ? 6 : 8;
  const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0) || 1;

  let cumulative = 0;

  return (
    <svg
      width={dimension}
      height={dimension}
      className={cn('drop-shadow-sm', RECENCY_CLASSES[recency])}
    >
      <circle
        cx={radius}
        cy={radius}
        r={radius - strokeWidth / 2}
        fill="none"
        stroke="#E8E6DD"
        strokeWidth={strokeWidth}
      />
      {segments.map((segment, index) => {
        const startAngle = (cumulative / totalWeight) * 2 * Math.PI;
        const sweep = (segment.weight / totalWeight) * 2 * Math.PI;
        cumulative += segment.weight;
        return (
          <RingSegment
            key={`${segment.type}-${index}`}
            cx={radius}
            cy={radius}
            radius={radius - strokeWidth / 2}
            startAngle={startAngle}
            sweep={sweep}
            stroke={PALETTE[segment.type]}
            strokeWidth={strokeWidth}
          />
        );
      })}
    </svg>
  );
}

function RingSegment({
  cx,
  cy,
  radius,
  startAngle,
  sweep,
  stroke,
  strokeWidth,
}: {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  sweep: number;
  stroke: string;
  strokeWidth: number;
}) {
  const endAngle = startAngle + sweep;
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArcFlag = sweep > Math.PI ? 1 : 0;

  const d = `M ${cx} ${cy}
    L ${x1} ${y1}
    A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
    Z`;

  return <path d={d} fill={stroke} stroke={stroke} strokeWidth={strokeWidth} opacity={0.85} />;
}
