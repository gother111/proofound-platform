'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
} from 'recharts';
import { Clock, AlertCircle } from 'lucide-react';

interface RecencyScatterProps {
  data: Array<{
    id: string;
    name: string;
    level: number;
    monthsSinceLastUsed: number;
    relevance: string;
  }>;
  onSkillClick: (skillId: string) => void;
}

const RELEVANCE_COLORS: Record<string, string> = {
  obsolete: '#C76B4A', // Terracotta
  current: '#1C4D3A', // Forest Green
  emerging: '#5C8B89', // Teal
};

export function RecencyScatter({ data, onSkillClick }: RecencyScatterProps) {
  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No skills to display</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add your first skill to see the recency analysis
        </p>
      </div>
    );
  }

  // Transform data for scatter chart
  const scatterData = data.map((skill) => ({
    ...skill,
    x: Math.min(skill.monthsSinceLastUsed, 60), // Cap at 60 months for display
    y: skill.level,
    fill: RELEVANCE_COLORS[skill.relevance] || RELEVANCE_COLORS.current,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const skill = payload[0].payload;
    const monthsText =
      skill.monthsSinceLastUsed > 60
        ? '5+ years'
        : skill.monthsSinceLastUsed > 24
          ? `${Math.floor(skill.monthsSinceLastUsed / 12)} years`
          : `${skill.monthsSinceLastUsed} months`;

    return (
      <div className="bg-white border border-proofound-stone rounded-xl shadow-lg p-4 max-w-[250px]">
        <p className="font-display font-semibold text-proofound-charcoal truncate">{skill.name}</p>
        <div className="text-sm text-muted-foreground mt-1 space-y-1">
          <p>Level: {skill.level}/5</p>
          <p>Last used: {monthsText} ago</p>
          <p className="capitalize">Relevance: {skill.relevance}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-display text-proofound-charcoal">
          Recency × Competence
        </h3>
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DD" />
          <XAxis
            type="number"
            dataKey="x"
            name="Months Since Last Used"
            label={{
              value: 'Months Since Last Used',
              position: 'bottom',
              offset: 0,
              fontSize: 12,
              fill: '#6B6760',
              fontFamily: 'Inter',
            }}
            tick={{ fill: '#6B6760', fontSize: 11, fontFamily: 'Inter' }}
            domain={[0, 60]}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Level"
            label={{
              value: 'Level',
              angle: -90,
              position: 'left',
              offset: 0,
              fontSize: 12,
              fill: '#6B6760',
              fontFamily: 'Inter',
            }}
            tick={{ fill: '#6B6760', fontSize: 11, fontFamily: 'Inter' }}
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis range={[50, 200]} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '3 3', stroke: '#E8E6DD' }}
          />

          {/* Reference lines for quadrants */}
          <ReferenceLine y={3} stroke="#D8D2C8" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine x={18} stroke="#D8D2C8" strokeDasharray="3 3" strokeWidth={1} />

          <Scatter
            name="Skills"
            data={scatterData}
            onClick={(data) => onSkillClick(data.id)}
            style={{ cursor: 'pointer' }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3 mt-6 text-xs">
        <div className="p-3 rounded-xl border border-transparent bg-proofound-sage/10 text-proofound-charcoal">
          <p className="font-semibold font-display text-proofound-forest">Fresh & Strong</p>
          <p className="text-muted-foreground">High level, recently used</p>
        </div>
        <div className="p-3 rounded-xl border border-transparent bg-proofound-ochre/10 text-proofound-charcoal">
          <p className="font-semibold font-display text-[#8B6F47]">Rusty Expertise</p>
          <p className="text-muted-foreground">High level, needs refresh</p>
        </div>
        <div className="p-3 rounded-xl border border-transparent bg-proofound-teal/10 text-proofound-charcoal">
          <p className="font-semibold font-display text-proofound-teal">Developing</p>
          <p className="text-muted-foreground">Low level, recently practiced</p>
        </div>
        <div className="p-3 rounded-xl border border-transparent bg-proofound-parchment text-proofound-charcoal">
          <p className="font-semibold font-display text-muted-foreground">Dormant</p>
          <p className="text-muted-foreground">Low level, not recent</p>
        </div>
      </div>
    </div>
  );
}
