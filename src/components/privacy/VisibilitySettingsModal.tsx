'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { FieldVisibilityControls } from './FieldVisibilityControls';
import { apiFetch } from '@/lib/api/fetch';

interface VisibilitySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function VisibilitySettingsModal({
  open,
  onOpenChange,
  userId,
}: VisibilitySettingsModalProps) {
  const isDesktop = useResponsiveModalMode(open);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open && !userId) {
      // Fetch current user ID
      apiFetch('/api/user/me')
        .then((res) => res.json())
        .then((data) => setCurrentUserId(data.id))
        .catch(console.error);
    } else if (userId) {
      setCurrentUserId(userId);
    }
  }, [open, userId]);

  const contentBody = currentUserId ? (
    <FieldVisibilityControls userId={currentUserId} />
  ) : (
    <div className="flex items-center justify-center py-8">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-['Crimson_Pro']">
              Field-Level Privacy Controls
            </DialogTitle>
          </DialogHeader>
          {contentBody}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-2xl font-['Crimson_Pro']">
            Field-Level Privacy Controls
          </DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">{contentBody}</div>
      </DrawerContent>
    </Drawer>
  );
}
