import React from 'react';
import { Heart, Phone, FileText } from 'lucide-react';
import { Button } from '../../ui/button';

interface HighRiskOverlayProps {
  onOpenSafetyPlan: () => void;
  onGetSupport: () => void;
  onClose: () => void;
}

export function HighRiskOverlay({ onOpenSafetyPlan, onGetSupport, onClose }: HighRiskOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-background)] dark:bg-[var(--color-background-dark)] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[var(--color-border)]">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <h2 className="text-center mb-2 text-[var(--color-text-primary)]">
          Let&apos;s get you support
        </h2>
        <p className="text-center text-[var(--color-text-secondary)] mb-6">
          We&apos;ve paused practice starts. Your safety plan and help resources are ready.
        </p>

        <div className="space-y-3 mb-6">
          <Button
            onClick={onGetSupport}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white"
            size="lg"
          >
            <Phone className="w-5 h-5 mr-2" />
            Get support now
          </Button>

          <Button onClick={onOpenSafetyPlan} variant="outline" className="w-full" size="lg">
            <FileText className="w-5 h-5 mr-2" />
            Open my safety plan
          </Button>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            I&apos;m okay, continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
