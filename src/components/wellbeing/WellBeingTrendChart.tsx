/**
 * Well-Being Trend Chart
 *
 * Visual chart showing weekly stress and control trends.
 * Simple line chart using SVG.
 */

'use client';

interface TrendDataPoint {
  week: number;
  weekStart: Date;
  avgStress: number;
  avgControl: number;
  checkinsCount: number;
}

interface WellBeingTrendChartProps {
  trend: TrendDataPoint[];
}

export function WellBeingTrendChart({ trend }: WellBeingTrendChartProps) {
  if (trend.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold mb-3" style={{ color: '#2D3330' }}>
          Trend Over Time
        </h3>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Not enough data yet. Check in regularly to see your well-being trends over time.
        </p>
      </div>
    );
  }

  // Chart dimensions
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (week: number) => {
    const maxWeek = Math.max(...trend.map((d) => d.week));
    return (week / maxWeek) * chartWidth;
  };

  const yScale = (value: number) => {
    return chartHeight - (value / 5) * chartHeight; // Scale 0-5 to chart height
  };

  // Generate path for line
  const generatePath = (dataKey: 'avgStress' | 'avgControl') => {
    return trend
      .map((d, i) => {
        const x = padding.left + xScale(d.week);
        const y = padding.top + yScale(d[dataKey]);
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');
  };

  const formatWeekLabel = (weekStart: Date) => {
    return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-semibold mb-1" style={{ color: '#2D3330' }}>
          Trend Over Time
        </h3>
        <p className="text-xs" style={{ color: '#6B6760' }}>
          Weekly averages for the last {trend.length} weeks
        </p>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          {/* Grid lines (1-5 scale) */}
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <g key={value}>
              <line
                x1={padding.left}
                y1={padding.top + yScale(value)}
                x2={padding.left + chartWidth}
                y2={padding.top + yScale(value)}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={padding.top + yScale(value)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill="#6B7280"
              >
                {value}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {trend.map((d) => (
            <text
              key={d.week}
              x={padding.left + xScale(d.week)}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#6B7280"
            >
              {formatWeekLabel(d.weekStart)}
            </text>
          ))}

          {/* Stress line (red) */}
          <path
            d={generatePath('avgStress')}
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Control line (green) */}
          <path
            d={generatePath('avgControl')}
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {trend.map((d) => (
            <g key={d.week}>
              {/* Stress point */}
              <circle
                cx={padding.left + xScale(d.week)}
                cy={padding.top + yScale(d.avgStress)}
                r="4"
                fill="#DC2626"
              />
              {/* Control point */}
              <circle
                cx={padding.left + xScale(d.week)}
                cy={padding.top + yScale(d.avgControl)}
                r="4"
                fill="#059669"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DC2626' }} />
          <span className="text-xs" style={{ color: '#6B6760' }}>
            Stress (lower is better)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#059669' }} />
          <span className="text-xs" style={{ color: '#6B6760' }}>
            Control (higher is better)
          </span>
        </div>
      </div>
    </div>
  );
}
