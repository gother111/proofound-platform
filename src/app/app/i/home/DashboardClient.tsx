'use client';

import React, { useState } from 'react';
import { DraggableDashboard } from '@/components/dashboard/DraggableDashboard';
import { DashboardWidget } from '@/lib/dashboard/layout';
import { useSpotlight } from '@/components/ui/spotlight-provider';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

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
  const { startTour } = useSpotlight();

  const handleStartTour = () => {
    const candidateSteps = [
      {
        id: 'widget-profile-activation',
        title: 'Public Portfolio',
        description:
          'Start with your public portfolio. Preview it, share it, and see what proof to add next.',
      },
      {
        id: 'widget-matching-readiness',
        title: 'Browse Readiness',
        description:
          'Browsing stays available before introductions. Add only the signal needed to personalize results.',
      },
      {
        id: 'widget-momentum-metrics',
        title: 'Momentum',
        description:
          'Check your recent activity and progress. Keep the momentum going to stay visible!',
      },
    ];

    const availableSteps = candidateSteps.filter((step) => document.getElementById(step.id));
    if (availableSteps.length > 0) {
      startTour(availableSteps);
      return;
    }

    // Fallback for customized layouts that hide the preferred widgets.
    const fallbackTarget = document.getElementById('main-content');
    if (fallbackTarget) {
      startTour([
        {
          id: 'main-content',
          title: 'Dashboard',
          description: 'This is your personalized dashboard workspace.',
        },
      ]);
    }
  };

  const handleErrorFallback = (_message: string) => {
    setHasRenderError(true);
    setIsDashboardLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {isDashboardLoading && !hasRenderError ? (
          <div className="text-xs text-gray-600" aria-live="polite">
            Dashboard loading…
          </div>
        ) : (
          <div />
        )}
        {!isDashboardLoading && !hasRenderError && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartTour}
            className="gap-2 text-proofound-forest border-proofound-forest/20 hover:bg-proofound-forest/5"
          >
            <Sparkles className="w-4 h-4" />
            Take a Tour
          </Button>
        )}
      </div>
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
