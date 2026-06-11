'use client';

import type { ReactNode } from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { FieldVisibilityControls } from './FieldVisibilityControls';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

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
  const [userLoadError, setUserLoadError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    setCurrentUserId(null);
    setUserLoadError(null);

    try {
      const response = await apiFetch('/api/user/me');
      if (!response.ok) {
        throw new Error('Current user request failed');
      }

      const data = await response.json();
      if (typeof data?.id !== 'string' || !data.id.trim()) {
        throw new Error('Current user id missing');
      }

      setCurrentUserId(data.id);
    } catch (error) {
      dispatchClientErrorDiagnostic('privacy.visibility_modal.user_load_failed', error);
      setUserLoadError(
        'We could not identify your account for privacy controls. Retry before changing field visibility.'
      );
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    if (userId) {
      setCurrentUserId(userId);
      setUserLoadError(null);
      return;
    }

    void fetchCurrentUser();
  }, [fetchCurrentUser, open, userId]);

  let contentBody: ReactNode;

  if (currentUserId) {
    contentBody = <FieldVisibilityControls userId={currentUserId} />;
  } else if (userLoadError) {
    contentBody = (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-4 dark:border-yellow-800 dark:bg-yellow-950/20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#D97706]" aria-hidden="true" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-[#92400E] dark:text-yellow-100">
                Privacy controls could not open
              </h3>
              <p className="mt-1 text-sm text-[#92400E] dark:text-yellow-200">{userLoadError}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void fetchCurrentUser();
              }}
              className="border-[#D97706] text-[#92400E] hover:bg-[#FEF3C7] dark:border-yellow-700 dark:text-yellow-100 dark:hover:bg-yellow-950/40"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Retry privacy controls
            </Button>
          </div>
        </div>
      </div>
    );
  } else {
    contentBody = (
      <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
        <p className="text-muted-foreground">Loading privacy visibility controls...</p>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-['Crimson_Pro']">
              Field-Level Privacy Controls
            </DialogTitle>
            <DialogDescription>
              Choose which profile fields are public, shared with your network, matched privately,
              or hidden.
            </DialogDescription>
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
          <DrawerDescription>
            Choose which profile fields are public, shared with your network, matched privately, or
            hidden.
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">{contentBody}</div>
      </DrawerContent>
    </Drawer>
  );
}
