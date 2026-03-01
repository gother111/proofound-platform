'use client';

import React, { useState } from 'react';
import { DraggableDashboard } from '@/components/dashboard/DraggableDashboard';
import { DashboardWidget } from '@/lib/dashboard/layout';

interface DashboardClientProps {
  initialLayout?: DashboardWidget[];
  initialData?: any;
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

export function DashboardClient({ initialLayout, initialData }: DashboardClientProps) {
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [hasRenderError, setHasRenderError] = useState(false);

  const handleErrorFallback = (_message: string) => {
    setHasRenderError(true);
    setIsDashboardLoading(false);
  };

  return (
    <div className="space-y-2">
      {isDashboardLoading && !hasRenderError ? (
        <div className="text-xs text-gray-600" aria-live="polite">
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
            initialData={initialData}
            onError={(message: string) => handleErrorFallback(message)}
            onLoadingChange={(isLoading: boolean) => setIsDashboardLoading(isLoading)}
          />
        )}
      </DashboardErrorBoundary>
    </div>
  );
}
