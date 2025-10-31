'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { User, Users, Briefcase, Award, AlertCircle } from 'lucide-react';

interface VerificationSourcesPieProps {
  data: {
    self: number;
    peer: number;
    manager: number;
    external: number;
  };
  onSegmentClick: (source: 'self' | 'peer' | 'manager' | 'external') => void;
}

const COLORS = {
  self: '#9ca3af', // Gray
  peer: '#3b82f6', // Blue
  manager: '#8b5cf6', // Purple
  external: '#f59e0b', // Gold
};

const ICONS = {
  self: User,
  peer: Users,
  manager: Briefcase,
  external: Award,
};

export function VerificationSourcesPie({ data, onSegmentClick }: VerificationSourcesPieProps) {
  const chartData = [
    { name: 'Self', value: data.self, source: 'self' as const, icon: User },
    { name: 'Peer', value: data.peer, source: 'peer' as const, icon: Users },
    { name: 'Manager', value: data.manager, source: 'manager' as const, icon: Briefcase },
    { name: 'External', value: data.external, source: 'external' as const, icon: Award },
  ].filter(item => item.value > 0);

  const total = data.self + data.peer + data.manager + data.external;
  
  // Empty state
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No verifications yet</p>
        <p className="text-xs text-muted-foreground mt-1">Request verifications to build credibility</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const percentage = ((data.value / total) * 100).toFixed(1);

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value} verifications ({percentage}%)
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Verification Sources</h3>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            onClick={(data) => onSegmentClick(data.source)}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.source]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.map((item) => {
          const Icon = item.icon;
          const percentage = ((item.value / total) * 100).toFixed(0);
          
          return (
            <button
              key={item.source}
              onClick={() => onSegmentClick(item.source)}
              className="flex flex-col items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Icon 
                className="w-5 h-5 mb-1" 
                style={{ color: COLORS[item.source] }}
              />
              <p className="text-xs font-medium">{item.name}</p>
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{percentage}%</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}


