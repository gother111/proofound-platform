'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Hexagon, AlertCircle } from 'lucide-react';

interface SkillWheelProps {
  data: Array<{
    domain: string;
    count: number;
    weightedCount: number;
  }>;
  onSectorClick: (domain: string) => void;
}

const DOMAIN_COLORS: Record<string, string> = {
  'Universal Capabilities': '#7A9278', // Sage
  'Functional Competencies': '#D4A574', // Ochre
  'Tools & Technologies': '#5C8B89', // Teal
  'Languages & Culture': '#9B7BA8', // Muted Purple
  'Methods & Practices': '#C76B4A', // Terracotta
  'Domain Knowledge': '#6B7F5F', // Bamboo
};

export function SkillWheel({ data, onSectorClick }: SkillWheelProps) {
  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No skills to display</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add your first skill to see the skill wheel
        </p>
      </div>
    );
  }

  // Transform data for radar chart - ensure all 6 domains are present
  const allDomains = [
    'Universal Capabilities',
    'Functional Competencies',
    'Tools & Technologies',
    'Languages & Culture',
    'Methods & Practices',
    'Domain Knowledge',
  ];

  const radarData = allDomains.map((domain) => {
    const existing = data.find((d) => d.domain === domain);
    return {
      domain: domain.split(' ')[0], // Shorten for display
      fullDomain: domain,
      count: existing?.count || 0,
      weightedCount: existing?.weightedCount || 0,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white border border-proofound-stone rounded-xl shadow-lg p-4">
        <p className="font-display font-semibold text-proofound-charcoal">{data.fullDomain}</p>
        <div className="text-sm text-muted-foreground mt-1 space-y-1">
          <p>Skills: {data.count}</p>
          <p>Weighted: {data.weightedCount.toFixed(1)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-display text-proofound-charcoal">Skill Wheel</h3>
        <Hexagon className="w-5 h-5 text-muted-foreground" />
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="#E8E6DD" />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: '#6B6760', fontSize: 11, fontFamily: 'Inter' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 'auto']}
            tick={{ fill: '#6B6760', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
          />
          <Radar
            name="Weighted Count"
            dataKey="weightedCount"
            stroke="#1C4D3A"
            fill="#1C4D3A"
            fillOpacity={0.4}
            strokeWidth={2}
            onClick={(data: any) => {
              if (data && data.fullDomain) {
                onSectorClick(data.fullDomain);
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1C4D3A', strokeWidth: 1 }} />
        </RadarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {data.map((item) => {
          const shortName = item.domain.split(' ')[0];
          const color = DOMAIN_COLORS[item.domain] || '#7A9278';

          return (
            <button
              key={item.domain}
              onClick={() => onSectorClick(item.domain)}
              className="flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-proofound-stone hover:bg-proofound-parchment transition-all duration-300 text-left"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-proofound-charcoal">{shortName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.count} ({item.weightedCount.toFixed(1)})
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
