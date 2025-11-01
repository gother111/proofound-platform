'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, Minus, TrendingUp, AlertCircle } from 'lucide-react';

interface RelevanceBarsProps {
  data: {
    obsolete: number;
    current: number;
    emerging: number;
  };
  onBarClick: (relevance: 'obsolete' | 'current' | 'emerging') => void;
}

const COLORS = {
  obsolete: '#ef4444', // Red
  current: '#10b981', // Green
  emerging: '#3b82f6', // Blue
};

const ICONS = {
  obsolete: TrendingDown,
  current: Minus,
  emerging: TrendingUp,
};

export function RelevanceBars({ data, onBarClick }: RelevanceBarsProps) {
  const chartData = [
    { name: 'Obsolete', value: data.obsolete, key: 'obsolete' as const, color: COLORS.obsolete },
    { name: 'Current', value: data.current, key: 'current' as const, color: COLORS.current },
    { name: 'Emerging', value: data.emerging, key: 'emerging' as const, color: COLORS.emerging },
  ];

  const total = data.obsolete + data.current + data.emerging;

  // Empty state
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No skills to display</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first skill to see relevance distribution</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const percentage = ((data.value / total) * 100).toFixed(1);

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.payload.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value} skills ({percentage}%)
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Skills Relevance</h3>
        <p className="text-sm text-muted-foreground">{total} total skills</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
            onClick={(data) => onBarClick(data.key)}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {chartData.map((item) => {
          const Icon = ICONS[item.key];
          const percentage = ((item.value / total) * 100).toFixed(0);
          
          return (
            <button
              key={item.key}
              onClick={() => onBarClick(item.key)}
              className="flex flex-col items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Icon 
                className="w-5 h-5 mb-1" 
                style={{ color: item.color }}
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


