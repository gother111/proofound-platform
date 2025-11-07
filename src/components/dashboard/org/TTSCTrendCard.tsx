/**
 * TTSC Trend Card
 *
 * Displays Time-to-Signed-Contract trends over time with target comparison.
 * PRD Reference: Part 5 O8 - Company Dashboard Analytics Tiles
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, TrendingUp, Calendar, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TTSCTrendPoint {
  period: string;
  medianDays: number;
  count: number;
  target: number;
}

interface TTSCTrendCardProps {
  orgSlug: string;
  groupBy?: 'week' | 'month';
}

export function TTSCTrendCard({ orgSlug, groupBy = 'week' }: TTSCTrendCardProps) {
  const [trends, setTrends] = useState<TTSCTrendPoint[]>([]);
  const [target, setTarget] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupBy, setSelectedGroupBy] = useState(groupBy);

  useEffect(() => {
    fetchTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, selectedGroupBy]);

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/org/ttsc-trend?orgSlug=${orgSlug}&groupBy=${selectedGroupBy}&limit=12`
      );
      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends || []);
        setTarget(data.target || 30);
      }
    } catch (error) {
      console.error('Failed to fetch TTSC trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate trend direction (comparing latest to previous)
  const getTrendIndicator = () => {
    if (trends.length < 2) return null;
    const latest = trends[trends.length - 1].medianDays;
    const previous = trends[trends.length - 2].medianDays;
    const change = latest - previous;
    const isImproving = change < 0; // Lower TTSC is better

    return {
      isImproving,
      change: Math.abs(change),
      percentage: Math.abs(Math.round((change / previous) * 100)),
    };
  };

  const trend = getTrendIndicator();
  const latestTTSC = trends.length > 0 ? trends[trends.length - 1].medianDays : null;

  // Determine status color
  const getStatusColor = (days: number) => {
    if (days <= 30) return 'text-[#1C4D3A] bg-[#E8F5E1]'; // Green - Good
    if (days <= 45) return 'text-[#C76B4A] bg-[#FFF4E6]'; // Terracotta - Warning
    return 'text-[#D93F3F] bg-[#FEE]'; // Red - Poor
  };

  // Format date labels
  const formatPeriodLabel = (period: string) => {
    const date = new Date(period);
    if (selectedGroupBy === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Simple line chart visualization (SVG)
  const renderChart = () => {
    if (trends.length === 0) return null;

    const width = 400;
    const height = 120;
    const padding = { top: 10, right: 10, bottom: 20, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...trends.map((t) => t.medianDays), target) * 1.1;
    const minValue = 0;

    // Scale functions
    const xScale = (index: number) => padding.left + (index / (trends.length - 1)) * chartWidth;
    const yScale = (value: number) =>
      padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

    // Generate line path
    const linePath = trends
      .map((point, index) => {
        const x = xScale(index);
        const y = yScale(point.medianDays);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');

    // Target line
    const targetY = yScale(target);

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Target line */}
        <line
          x1={padding.left}
          y1={targetY}
          x2={width - padding.right}
          y2={targetY}
          stroke="#6B6760"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <text
          x={width - padding.right - 5}
          y={targetY - 5}
          fontSize="10"
          fill="#6B6760"
          textAnchor="end"
        >
          Target: {target}d
        </text>

        {/* TTSC line */}
        <path d={linePath} fill="none" stroke="#1C4D3A" strokeWidth="2" />

        {/* Data points */}
        {trends.map((point, index) => {
          const x = xScale(index);
          const y = yScale(point.medianDays);
          const color = point.medianDays <= target ? '#1C4D3A' : '#C76B4A';

          return (
            <g key={index}>
              <circle cx={x} cy={y} r="4" fill={color} />
              {/* Tooltip on hover would go here */}
            </g>
          );
        })}

        {/* Y-axis labels */}
        <text x={padding.left - 5} y={padding.top} fontSize="10" fill="#6B6760" textAnchor="end">
          {Math.round(maxValue)}d
        </text>
        <text
          x={padding.left - 5}
          y={height - padding.bottom}
          fontSize="10"
          fill="#6B6760"
          textAnchor="end"
        >
          0d
        </text>
      </svg>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-[#6B6760]" />
            <h3 className="text-lg font-semibold text-[#2D3330]">Time-to-Contract</h3>
          </div>
          <p className="text-sm text-[#6B6760]">Median days from activation to signed contract</p>
        </div>

        {/* Time period selector */}
        <div className="flex gap-1 bg-[#F7F6F1] rounded-lg p-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedGroupBy('week')}
            className={`text-xs ${selectedGroupBy === 'week' ? 'bg-white shadow-sm' : ''}`}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedGroupBy('month')}
            className={`text-xs ${selectedGroupBy === 'month' ? 'bg-white shadow-sm' : ''}`}
          >
            Month
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-sm text-[#6B6760]">
          Loading trends...
        </div>
      ) : trends.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-sm text-[#6B6760]">
          <Target className="w-8 h-8 mb-2 opacity-50" />
          <p>No contract data yet</p>
          <p className="text-xs mt-1">Data will appear as contracts are signed</p>
        </div>
      ) : (
        <>
          {/* Current TTSC value */}
          <div className="flex items-center gap-4 mb-4">
            <div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold ${latestTTSC ? getStatusColor(latestTTSC) : ''}`}
              >
                <span className="text-2xl">{latestTTSC}</span>
                <span className="text-sm">days</span>
              </div>
            </div>

            {trend && (
              <div className="flex items-center gap-1.5">
                {trend.isImproving ? (
                  <TrendingDown className="w-4 h-4 text-[#1C4D3A]" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-[#C76B4A]" />
                )}
                <span
                  className={`text-sm font-medium ${trend.isImproving ? 'text-[#1C4D3A]' : 'text-[#C76B4A]'}`}
                >
                  {trend.isImproving ? '↓' : '↑'} {trend.change}d ({trend.percentage}%)
                </span>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="mb-4">{renderChart()}</div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-[#6B6760] border-t border-[#E8E6DD] pt-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#1C4D3A]" />
                <span>Median TTSC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-0.5 bg-[#6B6760]"
                  style={{ borderTop: '1px dashed #6B6760' }}
                />
                <span>Target ({target} days)</span>
              </div>
            </div>
            <span>
              {trends[0] && formatPeriodLabel(trends[0].period)} -{' '}
              {trends[trends.length - 1] && formatPeriodLabel(trends[trends.length - 1].period)}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
