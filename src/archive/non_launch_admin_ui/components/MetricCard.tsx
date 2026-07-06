'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  target?: number;
  status?: 'meeting_target' | 'below_target';
  trend?: 'up' | 'down' | 'stable';
  sampleSize?: number;
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  target,
  status,
  trend,
  sampleSize,
  subtitle,
  className,
}: MetricCardProps) {
  const isGood = status === 'meeting_target';

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend && (
          <div
            className={cn(
              'flex h-4 w-4 items-center justify-center',
              trend === 'up' && 'text-green-600',
              trend === 'down' && 'text-red-600',
              trend === 'stable' && 'text-gray-400'
            )}
          >
            {trend === 'up' && <ArrowUpIcon className="h-4 w-4" />}
            {trend === 'down' && <ArrowDownIcon className="h-4 w-4" />}
            {trend === 'stable' && <MinusIcon className="h-4 w-4" />}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div
            className={cn(
              'text-2xl font-bold',
              status && (isGood ? 'text-green-600' : 'text-red-600')
            )}
          >
            {typeof value === 'number' ? value.toFixed(1) : value}
          </div>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>

        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}

        {status && (
          <div className="mt-2 flex items-center space-x-2">
            <div
              className={cn(
                'flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs font-medium',
                isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}
            >
              {isGood ? '✓' : '✗'} {isGood ? 'Meeting Target' : 'Below Target'}
            </div>
            {target !== undefined && (
              <span className="text-xs text-muted-foreground">
                Target: {target}
                {unit ? ` ${unit}` : ''}
              </span>
            )}
          </div>
        )}

        {sampleSize !== undefined && (
          <p className="text-xs text-muted-foreground mt-2">
            Based on {sampleSize.toLocaleString()} data point{sampleSize !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
