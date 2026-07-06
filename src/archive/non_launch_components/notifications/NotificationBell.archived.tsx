'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from './NotificationDropdown';
import { apiFetch } from '@/lib/api/fetch';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  const pathSegments = pathname?.split('/').filter(Boolean) ?? [];
  const isIndividualShell = pathSegments[0] === 'app' && pathSegments[1] === 'i';
  const isOrganizationShell = pathSegments[0] === 'app' && pathSegments[1] === 'o';
  const shellType = isIndividualShell
    ? 'individual'
    : isOrganizationShell
      ? 'organization'
      : 'unknown';
  const orgSlug = isOrganizationShell ? pathSegments[2] : undefined;

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const updateIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateIsMobile();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile);
      return () => mediaQuery.removeEventListener('change', updateIsMobile);
    }

    mediaQuery.addListener(updateIsMobile);
    return () => mediaQuery.removeListener(updateIsMobile);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiFetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleNotificationRead = () => {
    // Refresh unread count when a notification is read
    fetchUnreadCount();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onNotificationRead={handleNotificationRead}
          isMobile={isMobile}
          shellType={shellType}
          orgSlug={orgSlug}
        />
      )}
    </div>
  );
}
