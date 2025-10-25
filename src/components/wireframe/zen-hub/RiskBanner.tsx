import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '../../ui/button';

interface RiskBannerProps {
  level: 'elevated' | 'high';
  onHelp?: () => void;
}

export function RiskBanner({ level, onHelp }: RiskBannerProps) {
  if (level === 'high') {
    return (
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-rose-900 dark:text-rose-100 mb-1">
              High risk detected
            </h3>
            <p className="text-sm text-rose-800 dark:text-rose-200 mb-3">
              All practice starts are paused. Your safety resources are available.
            </p>
            {onHelp && (
              <Button
                onClick={onHelp}
                variant="outline"
                size="sm"
                className="border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Get help now
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
            Take care with longer practices
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your recent check-in suggests elevated stress. We&apos;ve sorted practices by
            duration—shorter ones first.
          </p>
        </div>
      </div>
    </div>
  );
}
