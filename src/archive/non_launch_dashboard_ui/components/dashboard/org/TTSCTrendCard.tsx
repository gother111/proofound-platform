/**
 * TTSC Trend Card
 *
 * Displays Time-to-Signed-Contract trends over time with target comparison.
 * PRD Reference: Part 5 O8 - Company Dashboard Analytics Tiles
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, TrendingUp, Calendar, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupBy, setSelectedGroupBy] = useState(groupBy);

  const fetchTrends = async () => {
    void orgSlug;
    setIsLoading(true);
    setTrends([]);
    setTarget(30);
    setIsLoading(false);
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
    if (days <= 30) return 'text-proofound-forest bg-proofound-success-tint'; // Green - Good
    if (days <= 45) return 'text-proofound-terracotta bg-[#FFF4E6]'; // Terracotta - Warning
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

  // Recharts visualization
  const renderChart = () => {
    if (trends.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-proofound-stone shadow-sm">
            <p className="text-xs font-semibold text-foreground mb-2">{formatPeriodLabel(label)}</p>
            <div className="flex items-center gap-2 text-xs mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1C4D3A' }} />
              <span className="text-muted-foreground font-medium">Median TTSC:</span>
              <span className="text-foreground font-bold">{payload[0].value}d</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-0 border-t border-dashed border-[#6B6760]" />
              <span className="text-muted-foreground font-medium">Target:</span>
              <span className="text-foreground font-bold">{target}d</span>
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="h-[200px] w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6DD" />
            <XAxis
              dataKey="period"
              tickFormatter={formatPeriodLabel}
              stroke="#6B6760"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#6B6760"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              tickFormatter={(val) => `${val}d`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#E8E6DD', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <ReferenceLine y={target} stroke="#6B6760" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="medianDays"
              stroke="#1C4D3A"
              strokeWidth={2}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#1C4D3A' }}
              dot={({ cx, cy, payload }) => {
                const color = payload.medianDays <= target ? '#1C4D3A' : '#C76B4A';
                return (
                  <circle
                    key={`dot-${payload.period}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={color}
                    stroke="none"
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="p-6 border-proofound-stone rounded-3xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground font-['Crimson_Pro']">
              Time-to-Contract
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Median days from activation to signed contract
          </p>
        </div>

        {/* Time period selector */}
        <div className="flex gap-1 bg-japandi-bg rounded-lg p-1 border border-proofound-stone">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedGroupBy('week')}
            className={`text-xs ${selectedGroupBy === 'week' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedGroupBy('month')}
            className={`text-xs ${selectedGroupBy === 'month' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
          >
            Month
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
          Loading trends...
        </div>
      ) : trends.length === 0 ? (
        <div className="py-10 flex flex-col items-center text-center">
          <svg
            width="160"
            height="100"
            viewBox="0 0 160 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-6 opacity-40 animate-breathe"
          >
            <path
              d="M10 80C30 80 40 50 60 50C80 50 90 70 110 70C130 70 140 30 150 30"
              stroke="url(#emptyGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M10 80C30 80 40 50 60 50C80 50 90 70 110 70C130 70 140 30 150 30 L150 100 L10 100 Z"
              fill="url(#emptyAreaGradient)"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="emptyGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E8E6DD" />
                <stop offset="50%" stopColor="#1C4D3A" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#E8E6DD" />
              </linearGradient>
              <linearGradient id="emptyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1C4D3A" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#1C4D3A" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-2 font-['Crimson_Pro']">
            Awaiting Contract Data
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Trends will appear here as soon as time-to-contract metrics are recorded.
          </p>
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
                  <TrendingDown className="w-4 h-4 text-proofound-forest" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-proofound-terracotta" />
                )}
                <span
                  className={`text-sm font-medium ${trend.isImproving ? 'text-proofound-forest' : 'text-proofound-terracotta'}`}
                >
                  {trend.isImproving ? '↓' : '↑'} {trend.change}d ({trend.percentage}%)
                </span>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="mb-4">{renderChart()}</div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-proofound-stone pt-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-proofound-forest" />
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
