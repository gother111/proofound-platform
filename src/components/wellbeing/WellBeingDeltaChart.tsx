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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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
          const historyCheckIns = historyData.checkIns || historyData.checkins || [];
          const checkIns =
            historyCheckIns
              .map((c: any) => ({
                date: c.createdAt ?? c.created_at,
                stress: c.stressLevel ?? c.stress_level,
                control: c.controlLevel ?? c.control_level,
              }))
              .filter((c: any) => c.date && c.stress && c.control) || [];

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
      <Card className="border-proofound-stone rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-['Crimson_Pro']">Well-Being Delta</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track how your well-being changes over time
              </CardDescription>
            </div>
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 flex flex-col items-center">
            <svg
              width="120"
              height="80"
              viewBox="0 0 120 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-6 opacity-60"
            >
              <path
                d="M10 60 Q 30 20, 60 50 T 110 30"
                stroke="#1C4D3A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <path
                d="M10 40 Q 40 70, 70 30 T 110 50"
                stroke="#DC2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <circle cx="10" cy="60" r="4" fill="#1C4D3A" opacity="0.8" />
              <circle cx="110" cy="30" r="4" fill="#1C4D3A" opacity="0.8" />
              <circle cx="10" cy="40" r="4" fill="#DC2626" opacity="0.8" />
              <circle cx="110" cy="50" r="4" fill="#DC2626" opacity="0.8" />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2 font-['Crimson_Pro']">
              Establish Your Baseline
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-2">
              Complete at least 2 check-ins to track how your well-being trends over time.
            </p>
          </div>

          <div className="mt-4 p-5 bg-japandi-bg rounded-2xl border border-proofound-stone">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-proofound-forest flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-foreground">
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

  return (
    <Card className="border-proofound-stone rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-['Crimson_Pro']">Well-Being Delta</CardTitle>
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Period Toggle */}
          <div className="flex gap-1">
            <Button
              variant={selectedPeriod === 14 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(14)}
              className={
                selectedPeriod === 14
                  ? 'bg-proofound-forest text-white'
                  : 'border-proofound-stone text-muted-foreground'
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
                  ? 'bg-proofound-forest text-white'
                  : 'border-proofound-stone text-muted-foreground'
              }
            >
              30 days
            </Button>
          </div>
        </div>

        <CardDescription className="text-muted-foreground">
          {deltaData.checkinsCount} check-ins • {selectedPeriod}-day comparison to baseline
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Delta Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Stress Delta */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#F7F6F1] to-white border border-proofound-stone">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">Stress</span>
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
            <p className="text-xs text-muted-foreground">
              {deltaData.stressDelta > 0
                ? 'Less stress ↓'
                : deltaData.stressDelta < 0
                  ? 'More stress ↑'
                  : 'No change'}
            </p>
          </div>

          {/* Control Delta */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#F7F6F1] to-white border border-proofound-stone">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">Control</span>
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
            <p className="text-xs text-muted-foreground">
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
          <div className="space-y-4 pt-4 border-t border-proofound-stone">
            <h4 className="text-sm font-medium text-foreground">Trend Over Time</h4>
            <div className="h-[220px] w-full bg-white rounded-2xl border border-proofound-stone p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={recentCheckIns}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6DD" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
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
                  <RechartsTooltip
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-proofound-stone shadow-sm">
                            <p className="text-xs font-semibold text-foreground mb-2">
                              {new Date(label).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground font-medium">
                                  {entry.name}:
                                </span>
                                <span className="text-foreground font-bold">
                                  {Number(entry.value).toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: '#E8E6DD', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground ml-1">{value}</span>
                    )}
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    name="Stress (lower is better)"
                    stroke="#DC2626"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#DC2626', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="control"
                    name="Control (higher is better)"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#059669', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Interpretation Help */}
        <div className="p-4 bg-japandi-bg rounded-2xl border border-proofound-stone">
          <p className="text-xs leading-relaxed text-foreground">
            <strong className="font-semibold">How to read this:</strong> Positive deltas mean
            improvement from your baseline. Lower stress (↓) and higher control (↑) are healthier.
            The chart shows your recent check-ins to help you spot patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
