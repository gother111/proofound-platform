'use client';

import React, { useEffect, useState } from 'react';
import { DraggableDashboard } from '@/components/dashboard/DraggableDashboard';
import { DashboardWidget } from '@/lib/dashboard/layout';

interface DashboardClientProps {
  initialLayout?: DashboardWidget[];
}

class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : 'Render error' };
  }

  componentDidCatch(error: unknown) {
    // Swallow error logging in production; handled by boundary UI
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          The dashboard failed to load. Please refresh or try again.
        </div>
      );
    }
    return this.props.children;
  }
}

export function DashboardClient({ initialLayout }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [hasRenderError, setHasRenderError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleErrorFallback = (message: string) => {
    setHasRenderError(true);
  };

  return (
    <div className="space-y-2">
      {mounted ? (
        <div className="text-xs text-gray-600 dark:text-gray-300" aria-live="polite">
          Dashboard loading…
        </div>
      ) : null}
      <DashboardErrorBoundary>
        {hasRenderError ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            The dashboard failed to load. Please refresh or try again.
          </div>
        ) : (
          <DraggableDashboard
            initialLayout={initialLayout}
            onError={(message: string) => handleErrorFallback(message)}
          />
        )}
      </DashboardErrorBoundary>
    </div>
  );
}
