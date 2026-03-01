/**
 * Notifications Tile
 *
 * Shows latest unread notifications and deep links.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/fetch';
import { Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';

type NotificationsCardProps = {
  useMockData?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  actionUrl?: string;
  read?: boolean;
  createdAt?: string;
};

type NotificationsResponse = {
  items?: NotificationItem[];
};

export function NotificationsCard({ useMockData, onVisibilityChange }: NotificationsCardProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockData) {
      setItems([
        {
          id: '1',
          title: 'New match ready',
          message: 'Check your shortlist',
          actionUrl: '/app/i/matching',
        },
        {
          id: '2',
          title: 'Verification approved',
          message: 'Skill evidence verified',
          actionUrl: '/app/i/profile',
        },
        {
          id: '3',
          title: 'Interview feedback',
          message: 'Feedback due in 12h',
          actionUrl: '/app/i/matching?tab=feedback',
        },
      ]);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await apiFetch('/api/notifications?limit=3&unread=true');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const json = (await response.json()) as NotificationsResponse;
        setItems(json.items || []);
      } catch (error) {
        console.error(error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [useMockData]);

  useEffect(() => {
    if (loading) return;
    onVisibilityChange?.(items.length > 0);
  }, [items.length, loading, onVisibilityChange]);

  return (
    <Card variant="bento" className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-proofound-forest" />
            Inbox
          </CardTitle>
          <p className="text-sm text-muted-foreground">Latest unread updates and reminders.</p>
        </div>
        <Badge variant="outline" className={DASHBOARD_STATUS_CHIP_CLASS}>
          {items.length} unread
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {loading && (
            <div className="space-y-2">
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          )}

          {!loading &&
            items.map((item) => (
              <Link
                key={item.id}
                href={item.actionUrl || '/app/i/home'}
                className="block rounded-lg border border-proofound-stone px-3 py-2 hover:border-proofound-forest hover:bg-japandi-bg"
              >
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.message}</p>
              </Link>
            ))}

          {!loading && items.length === 0 && (
            <div className="rounded-lg border border-dashed border-proofound-stone px-3 py-6 text-center text-sm text-muted-foreground">
              No unread notifications. You’re all caught up.
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
          asChild
        >
          <Link href="/app/i/notifications">
            View all
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
