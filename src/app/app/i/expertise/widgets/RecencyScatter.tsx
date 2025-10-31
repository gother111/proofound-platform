'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis } from 'recharts';
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
  obsolete: '#ef4444', // Red
  current: '#10b981', // Green
  emerging: '#3b82f6', // Blue
};

export function RecencyScatter({ data, onSkillClick }: RecencyScatterProps) {
  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No skills to display</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first skill to see the recency analysis</p>
      </div>
    );
  }

  // Transform data for scatter chart
  const scatterData = data.map(skill => ({
    ...skill,
    x: Math.min(skill.monthsSinceLastUsed, 60), // Cap at 60 months for display
    y: skill.level,
    fill: RELEVANCE_COLORS[skill.relevance] || RELEVANCE_COLORS.current,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const skill = payload[0].payload;
    const monthsText = skill.monthsSinceLastUsed > 60 ? '5+ years' : 
      skill.monthsSinceLastUsed > 24 ? `${Math.floor(skill.monthsSinceLastUsed / 12)} years` :
      `${skill.monthsSinceLastUsed} months`;

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 max-w-[250px]">
        <p className="font-medium truncate">{skill.name}</p>
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recency × Competence</h3>
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Months Since Last Used"
            label={{ value: 'Months Since Last Used', position: 'bottom', offset: 0, fontSize: 12 }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            domain={[0, 60]}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Level"
            label={{ value: 'Level', angle: -90, position: 'left', offset: 0, fontSize: 12 }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
          />
          <ZAxis range={[50, 200]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Reference lines for quadrants */}
          <ReferenceLine y={3} stroke="#9ca3af" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine x={18} stroke="#9ca3af" strokeDasharray="3 3" strokeWidth={1} />
          
          <Scatter 
            name="Skills" 
            data={scatterData} 
            onClick={(data) => onSkillClick(data.id)}
            style={{ cursor: 'pointer' }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <div className="p-2 rounded border bg-green-50 dark:bg-green-950/20">
          <p className="font-medium text-green-700 dark:text-green-400">Fresh & Strong</p>
          <p className="text-green-600 dark:text-green-500">High level, recently used</p>
        </div>
        <div className="p-2 rounded border bg-yellow-50 dark:bg-yellow-950/20">
          <p className="font-medium text-yellow-700 dark:text-yellow-400">Rusty Expertise</p>
          <p className="text-yellow-600 dark:text-yellow-500">High level, needs refresh</p>
        </div>
        <div className="p-2 rounded border bg-blue-50 dark:bg-blue-950/20">
          <p className="font-medium text-blue-700 dark:text-blue-400">Developing</p>
          <p className="text-blue-600 dark:text-blue-500">Low level, recently practiced</p>
        </div>
        <div className="p-2 rounded border bg-gray-50 dark:bg-gray-950/20">
          <p className="font-medium text-gray-700 dark:text-gray-400">Dormant</p>
          <p className="text-gray-600 dark:text-gray-500">Low level, not recent</p>
        </div>
      </div>
    </div>
  );
}


