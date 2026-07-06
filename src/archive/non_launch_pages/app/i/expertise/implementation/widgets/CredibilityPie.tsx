'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CheckCircle2, FileCheck, AlertCircle } from 'lucide-react';

interface CredibilityPieProps {
  data: {
    verified: number;
    proofOnly: number;
    claimOnly: number;
  };
  onSegmentClick: (status: 'verified' | 'proofOnly' | 'claimOnly') => void;
}

const COLORS = {
  verified: '#1C4D3A', // Forest Green
  proofOnly: '#D4A574', // Ochre
  claimOnly: '#C76B4A', // Terracotta
};

export function CredibilityPie({ data, onSegmentClick }: CredibilityPieProps) {
  const chartData = [
    { name: 'Verified', value: data.verified, status: 'verified' as const, icon: CheckCircle2 },
    { name: 'Proof Only', value: data.proofOnly, status: 'proofOnly' as const, icon: FileCheck },
    { name: 'Claim Only', value: data.claimOnly, status: 'claimOnly' as const, icon: AlertCircle },
  ].filter((item) => item.value > 0);

  const total = data.verified + data.proofOnly + data.claimOnly;

  // Empty state
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No skills to display</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add your first skill to see credibility stats
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
          {data.value} skills ({percentage}%)
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-display text-proofound-charcoal">
          Credibility Status
        </h3>
        <p className="text-sm text-muted-foreground font-sans">{total} total skills</p>
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
            onClick={(data) => onSegmentClick(data.status)}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.status]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-3 mt-6">
        {chartData.map((item) => {
          const Icon = item.icon;
          const percentage = ((item.value / total) * 100).toFixed(0);

          return (
            <button
              key={item.status}
              onClick={() => onSegmentClick(item.status)}
              className="flex flex-col items-center p-3 rounded-xl border border-transparent hover:border-proofound-stone hover:bg-proofound-parchment transition-all duration-300"
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: COLORS[item.status] }} />
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
