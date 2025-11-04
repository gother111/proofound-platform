'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationRead: () => void;
}

export function NotificationDropdown({
  onClose,
  onNotificationRead,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.items);
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
      onNotificationRead();
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
      onNotificationRead();
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
      onClose();
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Notifications</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
            disabled={notifications.every((n) => n.read)}
          >
            <Check className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              router.push('/app/i/settings/notifications');
              onClose();
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <Bell className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              We'll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'w-full text-left p-4 hover:bg-gray-50 transition-colors',
                  !notification.read && 'bg-blue-50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                      !notification.read ? 'bg-blue-500' : 'bg-transparent'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              router.push('/app/i/notifications');
              onClose();
            }}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
}
