/**
 * Well-Being Delta Chart (Flow I-26, PRD Feature F5)
 *
 * Shows stress and control trends over 14/30 days with:
 * - Line charts for stress and control over time
 * - Delta indicators (improving/stable/declining)
 * - Empty state for <2 check-ins
 * - Private by default, never used in ranking
 *
 * Implements PRD Part 5 Feature F5: Zen Hub Well-Being Delta
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Calendar, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/fetch';

interface CheckInData {
  date: string; // ISO date string
  stress: number; // 1-5
  control: number; // 1-5
}

interface DeltaData {
  stressDelta: number;
  controlDelta: number;
  period: 14 | 30;
  checkinsCount: number;
  hasBaseline: boolean;
  checkIns?: CheckInData[];
}

interface WellBeingDeltaChartProps {
  period?: 14 | 30;
  autoFetch?: boolean;
}

export function WellBeingDeltaChart({ period = 14, autoFetch = true }: WellBeingDeltaChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<14 | 30>(period);
  const [deltaData, setDeltaData] = useState<DeltaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (autoFetch) {
      fetchDelta();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, autoFetch]);

  const fetchDelta = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/wellbeing/delta?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();

        // Fetch check-in history for chart
        const historyResponse = await apiFetch('/api/wellbeing/checkins');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const checkIns =
            historyData.checkIns?.map((c: any) => ({
              date: c.created_at,
              stress: c.stress_level,
              control: c.control_level,
            })) || [];

          setDeltaData({ ...data, checkIns });
        } else {
          setDeltaData(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch well-being delta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0.5) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (delta < -0.5) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0.5) return '#059669'; // green-600
    if (delta < -0.5) return '#DC2626'; // red-600
    return '#6B7280'; // gray-500
  };

  const getDeltaText = (delta: number) => {
    if (Math.abs(delta) < 0.5) return 'Stable';
    return delta > 0 ? 'Improving' : 'Declining';
  };

  const formatDelta = (delta: number) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}`;
  };

  // Empty state
  if (!deltaData || !deltaData.hasBaseline) {
    return (
      <Card className="border-[#E8E6DD]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-['Crimson_Pro']">Well-Being Delta</CardTitle>
              <CardDescription className="text-[#6B6760]">
                Track how your well-being changes over time
              </CardDescription>
            </div>
            <Lock className="w-5 h-5 text-[#6B6760]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-[#6B6760] mx-auto mb-4 opacity-50" />
            <p className="text-sm text-[#6B6760] mb-2">
              Complete at least 2 check-ins to establish a baseline.
            </p>
            <p className="text-xs text-[#6B6760]">
              Then we can show you how your well-being is trending over time.
            </p>
          </div>

          <div className="mt-4 p-4 bg-[#F7F6F1] rounded-lg border border-[#E8E6DD]">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#1C4D3A] flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[#2D3330]">
                <strong className="font-semibold">Private & Safe:</strong> Your well-being data is
                completely private and never used in matching or ranking. It's solely for your own
                insight and reflection.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const recentCheckIns = (deltaData.checkIns || [])
    .filter((c) => {
      const daysAgo = Math.floor((Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo <= selectedPeriod;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate chart dimensions
  const maxValue = 5;
  const chartHeight = 160;
  const chartWidth = 100; // percentage

  const getYPosition = (value: number) => {
    return chartHeight - (value / maxValue) * chartHeight;
  };

  const getXPosition = (index: number, total: number) => {
    if (total === 1) return chartWidth / 2;
    return (index / (total - 1)) * chartWidth;
  };

  // Generate SVG path for line
  const generatePath = (values: number[]) => {
    if (values.length === 0) return '';
    if (values.length === 1) {
      const x = getXPosition(0, 1);
      const y = getYPosition(values[0]);
      return `M ${x} ${y} L ${x} ${y}`;
    }

    return values
      .map((value, index) => {
        const x = getXPosition(index, values.length);
        const y = getYPosition(value);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  const stressPath = generatePath(recentCheckIns.map((c) => c.stress));
  const controlPath = generatePath(recentCheckIns.map((c) => c.control));

  return (
    <Card className="border-[#E8E6DD]">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-['Crimson_Pro']">Well-Being Delta</CardTitle>
            <Lock className="w-4 h-4 text-[#6B6760]" />
          </div>

          {/* Period Toggle */}
          <div className="flex gap-1">
            <Button
              variant={selectedPeriod === 14 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(14)}
              className={
                selectedPeriod === 14
                  ? 'bg-[#1C4D3A] text-white'
                  : 'border-[#E8E6DD] text-[#6B6760]'
              }
            >
              14 days
            </Button>
            <Button
              variant={selectedPeriod === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(30)}
              className={
                selectedPeriod === 30
                  ? 'bg-[#1C4D3A] text-white'
                  : 'border-[#E8E6DD] text-[#6B6760]'
              }
            >
              30 days
            </Button>
          </div>
        </div>

        <CardDescription className="text-[#6B6760]">
          {deltaData.checkinsCount} check-ins • {selectedPeriod}-day comparison to baseline
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Delta Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Stress Delta */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#F7F6F1] to-white border border-[#E8E6DD]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-[#2D3330]">Stress</span>
              {getDeltaIcon(deltaData.stressDelta)}
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="text-3xl font-bold"
                style={{ color: getDeltaColor(deltaData.stressDelta) }}
              >
                {formatDelta(deltaData.stressDelta)}
              </span>
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${getDeltaColor(deltaData.stressDelta)}20`,
                  color: getDeltaColor(deltaData.stressDelta),
                }}
              >
                {getDeltaText(deltaData.stressDelta)}
              </Badge>
            </div>
            <p className="text-xs text-[#6B6760]">
              {deltaData.stressDelta > 0
                ? 'Less stress ↓'
                : deltaData.stressDelta < 0
                  ? 'More stress ↑'
                  : 'No change'}
            </p>
          </div>

          {/* Control Delta */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#F7F6F1] to-white border border-[#E8E6DD]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-[#2D3330]">Control</span>
              {getDeltaIcon(deltaData.controlDelta)}
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="text-3xl font-bold"
                style={{ color: getDeltaColor(deltaData.controlDelta) }}
              >
                {formatDelta(deltaData.controlDelta)}
              </span>
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${getDeltaColor(deltaData.controlDelta)}20`,
                  color: getDeltaColor(deltaData.controlDelta),
                }}
              >
                {getDeltaText(deltaData.controlDelta)}
              </Badge>
            </div>
            <p className="text-xs text-[#6B6760]">
              {deltaData.controlDelta > 0
                ? 'More control ↑'
                : deltaData.controlDelta < 0
                  ? 'Less control ↓'
                  : 'No change'}
            </p>
          </div>
        </div>

        {/* Trend Chart */}
        {recentCheckIns.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[#2D3330]">Trend Over Time</h4>
            <div className="relative bg-white rounded-lg border border-[#E8E6DD] p-4">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full"
                style={{ height: '180px' }}
              >
                {/* Grid lines */}
                {[1, 2, 3, 4, 5].map((level) => (
                  <line
                    key={level}
                    x1="0"
                    y1={getYPosition(level)}
                    x2={chartWidth}
                    y2={getYPosition(level)}
                    stroke="#E8E6DD"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                ))}

                {/* Stress line (red) */}
                <path
                  d={stressPath}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Control line (green) */}
                <path
                  d={controlPath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {recentCheckIns.map((c, index) => {
                  const x = getXPosition(index, recentCheckIns.length);
                  return (
                    <g key={index}>
                      {/* Stress point */}
                      <circle
                        cx={x}
                        cy={getYPosition(c.stress)}
                        r="3"
                        fill="#DC2626"
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* Control point */}
                      <circle
                        cx={x}
                        cy={getYPosition(c.control)}
                        r="3"
                        fill="#059669"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4 pr-2">
                {[5, 4, 3, 2, 1].map((level) => (
                  <span key={level} className="text-xs text-[#6B6760]">
                    {level}
                  </span>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#E8E6DD]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                  <span className="text-xs text-[#6B6760]">Stress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-xs text-[#6B6760]">Control</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interpretation Help */}
        <div className="p-4 bg-[#F7F6F1] rounded-lg border border-[#E8E6DD]">
          <p className="text-xs leading-relaxed text-[#2D3330]">
            <strong className="font-semibold">How to read this:</strong> Positive deltas mean
            improvement from your baseline. Lower stress (↓) and higher control (↑) are healthier.
            The chart shows your recent check-ins to help you spot patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
