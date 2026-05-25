'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';

export interface DataPoint {
  date: string;
  value: number;
}

export interface MetricsTrendChartProps {
  title: string;
  data: DataPoint[];
  target?: number;
  unit?: string;
  className?: string;
}

export function MetricsTrendChart({
  title,
  data,
  target,
  unit,
  className,
}: MetricsTrendChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [data]);

  const hasData = data.length > 0;
  const minValue = hasData ? Math.min(...data.map((d) => d.value)) : 0;
  const maxValue = hasData ? Math.max(...data.map((d) => d.value)) : 100;
  const yAxisDomain = [Math.floor(minValue * 0.9), Math.ceil(maxValue * 1.1)];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No trend data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="dateLabel"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={yAxisDomain}
                tickFormatter={(value) => `${value}${unit ? unit : ''}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-muted-foreground">{data.dateLabel}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Value
                          </span>
                          <span className="font-bold">
                            {data.value}
                            {unit ? ` ${unit}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              {target !== undefined && (
                <ReferenceLine
                  y={target}
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{
                    value: `Target: ${target}`,
                    position: 'right',
                    fill: '#22c55e',
                    fontSize: 12,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
