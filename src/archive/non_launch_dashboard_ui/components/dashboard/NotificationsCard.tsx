/**
 * Notifications Tile
 *
 * Archived for the locked MVP launch corridor.
 */

'use client';

import { useEffect } from 'react';

type NotificationsCardProps = {
  useMockData?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
};

export function NotificationsCard({ onVisibilityChange }: NotificationsCardProps) {
  useEffect(() => {
    onVisibilityChange?.(false);
  }, [onVisibilityChange]);

  return null;
}
