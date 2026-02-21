/**
 * Well-Being Trend Chart
 *
 * Visual chart showing weekly stress and control trends.
 * Modernized line chart using Recharts for an interactive & responsive experience.
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendDataPoint {
  week: number;
  weekStart: Date | string;
  avgStress: number;
  avgControl: number;
  checkinsCount: number;
}

interface WellBeingTrendChartProps {
  trend: TrendDataPoint[];
}

export function WellBeingTrendChart({ trend }: WellBeingTrendChartProps) {
  const normalizedTrend = trend
    .map((d) => {
      const weekStartDate = typeof d.weekStart === 'string' ? new Date(d.weekStart) : d.weekStart;
      return { ...d, weekStartDate };
    })
    .filter((d) => !Number.isNaN(d.weekStartDate.getTime()));

  if (normalizedTrend.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E8E6DD] p-6 text-center">
        <h3
          className="font-semibold mb-3 font-['Crimson_Pro'] text-lg"
          style={{ color: '#2D3330' }}
        >
          Trend Over Time
        </h3>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Not enough data yet. Check in regularly to see your well-being trends over time.
        </p>
      </div>
    );
  }

  const formatWeekLabel = (weekStartDate: Date | undefined) => {
    if (!weekStartDate) return '';
    return weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-[#E8E6DD] shadow-sm">
          <p className="text-xs font-semibold text-[#2D3330] mb-2">{formatWeekLabel(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[#6B6760] font-medium">{entry.name}:</span>
              <span className="text-[#2D3330] font-bold">{Number(entry.value).toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E8E6DD] p-6">
      {/* Header */}
      <div className="mb-6">
        <h3
          className="font-semibold mb-1 font-['Crimson_Pro'] text-lg"
          style={{ color: '#2D3330' }}
        >
          Trend Over Time
        </h3>
        <p className="text-xs" style={{ color: '#6B6760' }}>
          Weekly averages for the last {trend.length} weeks
        </p>
      </div>

      {/* Chart */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={normalizedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6DD" />
            <XAxis
              dataKey="weekStartDate"
              tickFormatter={formatWeekLabel}
              stroke="#6B6760"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              stroke="#6B6760"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#E8E6DD', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-xs text-[#6B6760] ml-1">{value}</span>}
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Line
              type="monotone"
              dataKey="avgStress"
              name="Stress (lower is better)"
              stroke="#DC2626"
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 0 }}
              dot={{ r: 3, fill: '#DC2626', strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="avgControl"
              name="Control (higher is better)"
              stroke="#059669"
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 0 }}
              dot={{ r: 3, fill: '#059669', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
