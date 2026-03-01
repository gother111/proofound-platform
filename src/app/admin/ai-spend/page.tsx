'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CreditCard, Loader2, Users } from 'lucide-react';

import { apiFetch } from '@/lib/api/fetch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SpendPayload = {
  success: boolean;
  totals: {
    cost_ore: number;
    requests: number;
    unique_users: number;
  };
  period: {
    days: number;
    start_date: string;
    end_date: string;
    month_start: string;
  };
  per_day_spend: Array<{
    day: string;
    cost_ore: number;
    requests: number;
  }>;
  per_user_spend: Array<{
    user_id: string;
    user_label: string;
    cost_ore: number;
    requests: number;
  }>;
  top_users: Array<{
    user_id: string;
    user_label: string;
    cost_ore: number;
    requests: number;
  }>;
  key_slot_budgets: Array<{
    key_slot: 'primary' | 'secondary';
    monthly_limit_ore: number;
    spent_ore: number;
    reserved_ore: number;
    remaining_ore: number;
    status: 'active' | 'exhausted' | 'disabled';
    currency: 'SEK';
  }>;
  failure_breakdown: Array<{
    failure_code: string;
    count: number;
  }>;
};

function formatSekFromOre(ore: number): string {
  return `${(ore / 100).toFixed(2)} SEK`;
}

function statusVariant(
  status: 'active' | 'exhausted' | 'disabled'
): 'default' | 'secondary' | 'destructive' {
  if (status === 'active') return 'default';
  if (status === 'exhausted') return 'destructive';
  return 'secondary';
}

export default function AdminAiSpendPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SpendPayload | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFetch('/api/admin/analytics/cv-import-spend?days=30');
        const payload = (await response.json()) as SpendPayload & {
          error?: string;
          message?: string;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || payload.error || 'Failed to load spend analytics');
        }

        setData(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load spend analytics');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const topFailure = useMemo(() => data?.failure_breakdown[0] || null, [data]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Spend Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          CV import Gemini usage, budgets, and failure analytics.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading spend analytics...
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="py-8 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Spend (30d)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-2xl font-semibold">{formatSekFromOre(data.totals.cost_ore)}</p>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Requests (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.totals.requests}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Active Users (30d)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-2xl font-semibold">{data.totals.unique_users}</p>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Slot Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.key_slot_budgets.map((slot) => (
                  <div key={slot.key_slot} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">{slot.key_slot}</p>
                      <Badge variant={statusVariant(slot.status)}>{slot.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Spent: {formatSekFromOre(slot.spent_ore)} /{' '}
                      {formatSekFromOre(slot.monthly_limit_ore)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reserved: {formatSekFromOre(slot.reserved_ore)}
                    </p>
                    <p className="text-sm font-medium">
                      Remaining: {formatSekFromOre(slot.remaining_ore)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.user_label}</TableCell>
                      <TableCell>{user.requests}</TableCell>
                      <TableCell>{formatSekFromOre(user.cost_ore)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spend Per Day</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.per_day_spend.map((day) => (
                    <TableRow key={day.day}>
                      <TableCell>{day.day}</TableCell>
                      <TableCell>{day.requests}</TableCell>
                      <TableCell>{formatSekFromOre(day.cost_ore)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Failure Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.failure_breakdown.length === 0 && (
                <p className="text-sm text-muted-foreground">No failures in the selected period.</p>
              )}
              {data.failure_breakdown.map((failure) => (
                <div
                  key={failure.failure_code}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <span className="text-sm">{failure.failure_code}</span>
                  <Badge variant="secondary">{failure.count}</Badge>
                </div>
              ))}
              {topFailure && (
                <p className="text-xs text-muted-foreground pt-2">
                  Top failure: {topFailure.failure_code} ({topFailure.count})
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
