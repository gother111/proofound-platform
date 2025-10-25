'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Phone, MessageCircle, FileText, ExternalLink } from 'lucide-react';

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
  onOpenSafetyPlan: () => void;
}

export function HelpPanel({ open, onClose, onOpenSafetyPlan }: HelpPanelProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-[var(--color-text-primary)]">Need support now?</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <p className="text-[var(--color-text-secondary)]">
            You&apos;re not alone. Help is available 24/7.
          </p>

          <div className="space-y-3">
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white justify-start"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div>Crisis hotline</div>
                <div className="text-xs opacity-90">988 (US) • Free &amp; confidential</div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start" size="lg">
              <MessageCircle className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div>Crisis text line</div>
                <div className="text-xs text-[var(--color-text-tertiary)]">Text HOME to 741741</div>
              </div>
            </Button>

            <Button
              onClick={onOpenSafetyPlan}
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-3" />
              My safety plan
            </Button>
          </div>

          <div className="pt-6 border-t border-[var(--color-border)] space-y-3">
            <h3 className="text-sm text-[var(--color-text-secondary)]">Additional resources</h3>

            <button className="flex items-center gap-2 text-[var(--color-primary)] hover:underline">
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Find a therapist near you</span>
            </button>

            <button className="flex items-center gap-2 text-[var(--color-primary)] hover:underline">
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Mental health first aid guide</span>
            </button>
          </div>

          <div className="pt-6 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              If you&apos;re in immediate danger, call emergency services (911 in the US) or go to
              your nearest emergency room.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
