import React from 'react';
import { cn } from '@/lib/utils';
import { StatTileModel } from '@/lib/ui/v2/types';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { DASHBOARD_TREND_CHIP_CLASS } from '@/components/dashboard/chipStyles';

interface MetricStripProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics: StatTileModel[];
}

export function MetricStrip({ metrics, className, ...props }: MetricStripProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}
      {...props}
    >
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-sm flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-white/60 dark:bg-[#1A1D2E]/60 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">{metric.title}</h4>
            {metric.icon && (
              <div className="text-proofound-forest/60 bg-proofound-forest/5 p-1.5 rounded-lg">
                {metric.icon}
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-proofound-charcoal">
              {metric.value}
            </span>
          </div>

          {(metric.trend || metric.description) && (
            <div className="mt-auto flex min-w-0 items-start gap-2 pt-1 text-sm">
              {metric.trend && (
                <span
                  className={cn(
                    DASHBOARD_TREND_CHIP_CLASS,
                    metric.trend.direction === 'up' && 'text-emerald-700 bg-emerald-50',
                    metric.trend.direction === 'down' && 'text-rose-700 bg-rose-50',
                    metric.trend.direction === 'neutral' && 'text-slate-600 bg-slate-100'
                  )}
                >
                  {metric.trend.direction === 'up' && (
                    <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" />
                  )}
                  {metric.trend.direction === 'down' && (
                    <TrendingDown className="mt-0.5 h-3 w-3 shrink-0" />
                  )}
                  {metric.trend.direction === 'neutral' && (
                    <Minus className="mt-0.5 h-3 w-3 shrink-0" />
                  )}
                  <span>{metric.trend.label}</span>
                </span>
              )}
              {metric.description && (
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {metric.description}
                </span>
              )}
            </div>
          )}

          {metric.action && (
            <div className="mt-auto pt-2">
              <a
                href={metric.action.href}
                className="inline-flex items-center text-xs font-medium text-proofound-forest hover:text-proofound-forest/80 transition-colors"
                onClick={metric.action.onClick}
              >
                {metric.action.label} <span className="ml-1 opacity-70">→</span>
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
