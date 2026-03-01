'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api/fetch';

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
  isMobile: boolean;
  shellType: 'individual' | 'organization' | 'unknown';
  orgSlug?: string;
}

export function NotificationDropdown({
  onClose,
  onNotificationRead,
  isMobile,
  shellType,
  orgSlug,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const settingsPath =
    shellType === 'organization' && orgSlug
      ? `/app/o/${orgSlug}/settings`
      : '/app/i/settings/notifications';
  const viewAllPath =
    shellType === 'organization' && orgSlug ? `/app/o/${orgSlug}/messages` : '/app/i/notifications';

  const clearAutoCloseTimer = useCallback(() => {
    if (!autoCloseTimerRef.current) {
      return;
    }

    clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = null;
  }, []);

  const scheduleAutoClose = useCallback(() => {
    if (!isMobile) {
      return;
    }

    clearAutoCloseTimer();
    autoCloseTimerRef.current = setTimeout(() => {
      onClose();
    }, 4500);
  }, [clearAutoCloseTimer, isMobile, onClose]);

  const handleMobileInteraction = () => {
    if (!isMobile) {
      return;
    }

    scheduleAutoClose();
  };

  useEffect(() => {
    fetchNotifications();
    scheduleAutoClose();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearAutoCloseTimer();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearAutoCloseTimer, onClose, scheduleAutoClose]);

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch('/api/notifications?limit=10');
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
      await apiFetch(`/api/notifications/${notificationId}/read`, {
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
      await apiFetch('/api/notifications/mark-all-read', {
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
      data-testid="notifications-dropdown"
      className={cn(
        'z-50 flex flex-col rounded-lg border border-border bg-background shadow-lg dark:shadow-none',
        isMobile ? 'fixed inset-x-2 top-16 overflow-hidden' : 'absolute right-0 top-12 w-96'
      )}
      style={isMobile ? { bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' } : undefined}
      onPointerDown={handleMobileInteraction}
      onWheel={handleMobileInteraction}
      onTouchStart={handleMobileInteraction}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b p-4 sm:items-center">
        <h3 className="min-w-0 pr-1 text-base font-semibold sm:text-lg">Notifications</h3>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="h-11 min-h-[44px] px-2 text-xs sm:h-9 sm:min-h-0 sm:px-3"
            aria-label="Mark all notifications as read"
            disabled={notifications.every((n) => n.read)}
          >
            <Check className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                router.push(settingsPath);
                onClose();
              }}
              aria-label="Notification settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close notifications">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className={cn('min-h-0', isMobile ? 'flex-1' : 'h-[400px]')}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
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
                  'w-full text-left p-4 hover:bg-muted/50 transition-colors',
                  !notification.read && 'bg-blue-50 dark:bg-blue-900/10'
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
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
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
              router.push(viewAllPath);
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
