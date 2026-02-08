'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  createdAt: string;
}

export default function OrgNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;

  useEffect(() => {
    fetchNotifications(0, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchNotifications = async (newOffset: number, filterType: 'all' | 'unread') => {
    setIsLoading(true);
    try {
      const url =
        filterType === 'unread'
          ? `/api/notifications?unread=true&limit=20&offset=${newOffset}`
          : `/api/notifications?limit=20&offset=${newOffset}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (newOffset === 0) {
          setNotifications(data.items);
        } else {
          setNotifications((prev) => [...prev, ...data.items]);
        }
        setHasMore(data.hasMore);
        setOffset(newOffset);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const loadMore = () => {
    fetchNotifications(offset + 20, filter);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2D3330]">Notifications</h1>
            <p className="text-[#6B6760] mt-1">Stay updated with your activity</p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                slug ? `/app/o/${slug}/settings/notifications` : '/app/settings/notifications'
              )
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#6B6760]" />
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={notifications.every((n) => n.read)}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        </Card>

        {/* Notifications List */}
        {isLoading && offset === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-[#6B6760]">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8E6DD] flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-[#6B6760]" />
              </div>
              <h3 className="text-xl font-semibold text-[#2D3330] mb-2">No notifications yet</h3>
              <p className="text-[#6B6760] max-w-md">
                We'll notify you when something important happens, like new matches, messages, or
                verification requests.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  'p-4 cursor-pointer hover:shadow-md transition-shadow',
                  !notification.read && 'bg-blue-50 border-blue-200'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full mt-1.5 flex-shrink-0',
                      !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p
                          className={cn(
                            'text-base font-medium text-[#2D3330]',
                            !notification.read && 'font-semibold'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-[#6B6760] mt-1">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-[#6B6760]">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {notification.type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
