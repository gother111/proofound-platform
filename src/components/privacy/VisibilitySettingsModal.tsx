'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldVisibilityControls } from './FieldVisibilityControls';

interface VisibilitySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function VisibilitySettingsModal({ open, onOpenChange, userId }: VisibilitySettingsModalProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open && !userId) {
      // Fetch current user ID
      fetch('/api/user/me')
        .then((res) => res.json())
        .then((data) => setCurrentUserId(data.id))
        .catch(console.error);
    } else if (userId) {
      setCurrentUserId(userId);
    }
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-['Crimson_Pro']">
            Field-Level Privacy Controls
          </DialogTitle>
        </DialogHeader>

        {currentUserId ? (
          <FieldVisibilityControls userId={currentUserId} />
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-[#6B6760]">Loading...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
