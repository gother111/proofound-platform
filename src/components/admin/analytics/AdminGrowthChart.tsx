'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface GrowthDataPoint {
  period: string;
  count: number;
  cumulative: number;
}

interface GrowthData {
  users: GrowthDataPoint[];
  organizations: GrowthDataPoint[];
}

export function AdminGrowthChart() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [metric, setMetric] = useState<'users' | 'organizations'>('users');

  useEffect(() => {
    loadGrowthData();
  }, [period]);

  const loadGrowthData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/growth?period=${period}&groupBy=day`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load growth data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Failed to load growth data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load growth data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-[#6B6760]">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-[#6B6760]">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = metric === 'users' ? data.users : data.organizations;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Growth Analytics</CardTitle>
          <div className="flex gap-2">
            <div className="flex gap-1 mr-4">
              <Button
                variant={metric === 'users' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetric('users')}
              >
                Users
              </Button>
              <Button
                variant={metric === 'organizations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetric('organizations')}
              >
                Orgs
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                variant={period === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('7d')}
              >
                7d
              </Button>
              <Button
                variant={period === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('30d')}
              >
                30d
              </Button>
              <Button
                variant={period === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('90d')}
              >
                90d
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DD" />
            <XAxis
              dataKey="period"
              stroke="#6B6760"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6B6760" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E8E6DD',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => {
                const date = new Date(value as string);
                return date.toLocaleDateString();
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#1C4D3A"
              strokeWidth={2}
              name="New"
              dot={{ fill: '#1C4D3A', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#6B6760"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Total"
              dot={{ fill: '#6B6760', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
