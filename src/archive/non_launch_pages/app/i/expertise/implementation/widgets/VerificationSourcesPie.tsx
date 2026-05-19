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
  self: '#D4A574', // Ochre
  peer: '#5C8B89', // Teal
  manager: '#1C4D3A', // Forest Green
  external: '#2D3330', // Charcoal
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
  ].filter((item) => item.value > 0);

  const total = data.self + data.peer + data.manager + data.external;

  // Empty state
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No verifications yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Request verifications to build credibility
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const percentage = ((data.value / total) * 100).toFixed(1);

    return (
      <div className="bg-white border border-proofound-stone rounded-xl shadow-lg p-4">
        <p className="font-display font-semibold text-proofound-charcoal">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value} verifications ({percentage}%)
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-display text-proofound-charcoal">Verifiers</h3>
        <p className="text-sm text-muted-foreground font-sans">{total} total</p>
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
              <Cell key={`cell-${index}`} fill={COLORS[entry.source]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {chartData.map((item) => {
          const Icon = item.icon;
          const percentage = ((item.value / total) * 100).toFixed(0);

          return (
            <button
              key={item.source}
              onClick={() => onSegmentClick(item.source)}
              className="flex flex-col items-center p-3 rounded-xl border border-transparent hover:border-proofound-stone hover:bg-proofound-parchment transition-all duration-300"
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: COLORS[item.source] }} />
              <p className="text-xs font-medium text-proofound-charcoal mb-1">{item.name}</p>
              <p className="text-xl font-bold text-proofound-charcoal font-display">{item.value}</p>
              <p className="text-xs text-muted-foreground">{percentage}%</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
