'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { EvidenceBadge } from './EvidenceBadge';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '../../ui/button';

interface EvidenceDrawerProps {
  open: boolean;
  onClose: () => void;
  evidenceType: 'rct-backed' | 'nice-recommended' | 'meta-reviewed' | 'initial' | 'third-party';
  evidencePoints: string[];
  adverseNote?: string;
}

export function EvidenceDrawer({
  open,
  onClose,
  evidenceType,
  evidencePoints,
  adverseNote,
}: EvidenceDrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-[var(--color-text-primary)]">Why this works</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 max-w-2xl mx-auto">
          <EvidenceBadge type={evidenceType} />

          <div className="space-y-4">
            {evidencePoints.map((point, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                <p className="text-[var(--color-text-secondary)]">{point}</p>
              </div>
            ))}
          </div>

          {adverseNote && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-900 dark:text-amber-200 mb-2">{adverseNote}</p>
                  <button className="text-sm text-amber-700 dark:text-amber-300 hover:underline">
                    Stop practice &amp; open Help
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--color-border)]">
            <button className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline">
              <ExternalLink className="w-4 h-4" />
              How we vet content
            </button>
          </div>

          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
