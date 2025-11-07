/**
 * PAC Badge Component
 *
 * Displays Purpose-Alignment Contribution (PAC) score
 * Shows values/causes overlap between individual and organization
 *
 * PRD References:
 * - Part 2: PAC as key metric for match quality
 * - Part 7: Display PAC in Match Detail
 * - Top-decile PAC matches get highlighted
 */

'use client';

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PACBadgeProps {
  pacScore: number; // 0-100
  size?: 'small' | 'default' | 'large';
  showLabel?: boolean;
  showTooltip?: boolean;
}

export function PACBadge({
  pacScore,
  size = 'default',
  showLabel = false,
  showTooltip = true,
}: PACBadgeProps) {
  // Color coding based on PRD thresholds
  const getColor = (score: number) => {
    if (score >= 71)
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
    if (score >= 31)
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
  };

  const getLabel = (score: number) => {
    if (score >= 71) return 'High Alignment';
    if (score >= 31) return 'Moderate Alignment';
    return 'Low Alignment';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-0.5 text-xs';
      case 'large':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const colors = getColor(pacScore);

  const badge = (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${getSizeClasses()} font-medium`}
    >
      <span className="font-semibold">{pacScore.toFixed(0)}</span>
      {showLabel && <span className="text-xs opacity-90">{getLabel(pacScore)}</span>}
      {showTooltip && <Info className="h-3 w-3 opacity-70" />}
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">Purpose-Alignment Contribution</p>
            <p className="text-sm text-[#6B6760]">
              This score measures how well your values and causes align with this organization's
              mission. A higher PAC score indicates stronger purpose alignment.
            </p>
            <div className="pt-2 border-t border-[#E8E6DD] text-xs space-y-1">
              <p>
                <strong>Score:</strong> {pacScore}/100
              </p>
              <p>
                <strong>Level:</strong> {getLabel(pacScore)}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
