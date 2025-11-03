/**
 * Well-Being Delta Widget
 *
 * Displays stress and control level changes over time.
 * Shows improvement/decline with visual indicators.
 */

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WellBeingDeltaWidgetProps {
  stressDelta: number; // Positive = less stress (improvement)
  controlDelta: number; // Positive = more control (improvement)
  period: 14 | 30;
  checkinsCount: number;
  hasBaseline: boolean;
}

export function WellBeingDeltaWidget({
  stressDelta,
  controlDelta,
  period,
  checkinsCount,
  hasBaseline,
}: WellBeingDeltaWidgetProps) {
  if (!hasBaseline) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold mb-3" style={{ color: '#2D3330' }}>
          Well-Being Delta
        </h3>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Complete at least 2 check-ins in your first week to establish a baseline. Then we can show
          you how your well-being is trending.
        </p>
      </div>
    );
  }

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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-semibold mb-1" style={{ color: '#2D3330' }}>
          Well-Being Delta
        </h3>
        <p className="text-xs" style={{ color: '#6B6760' }}>
          {period}-day change compared to baseline ({checkinsCount} check-ins)
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stress Delta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: '#6B6760' }}>
              Stress
            </span>
            {getDeltaIcon(stressDelta)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold" style={{ color: getDeltaColor(stressDelta) }}>
              {formatDelta(stressDelta)}
            </span>
            <span className="text-xs" style={{ color: '#6B6760' }}>
              {getDeltaText(stressDelta)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(Math.abs(stressDelta) * 10, 100)}%`,
                backgroundColor: getDeltaColor(stressDelta),
              }}
            />
          </div>
        </div>

        {/* Control Delta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: '#6B6760' }}>
              Control
            </span>
            {getDeltaIcon(controlDelta)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold" style={{ color: getDeltaColor(controlDelta) }}>
              {formatDelta(controlDelta)}
            </span>
            <span className="text-xs" style={{ color: '#6B6760' }}>
              {getDeltaText(controlDelta)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(Math.abs(controlDelta) * 10, 100)}%`,
                backgroundColor: getDeltaColor(controlDelta),
              }}
            />
          </div>
        </div>
      </div>

      {/* Interpretation Help */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs" style={{ color: '#6B6760' }}>
          <strong>Positive values</strong> indicate improvement from your baseline (first week).
          Lower stress and higher control are better.
        </p>
      </div>
    </div>
  );
}
