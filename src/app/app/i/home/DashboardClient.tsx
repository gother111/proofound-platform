'use client';

import { DraggableDashboard } from '@/components/dashboard/DraggableDashboard';
import { DashboardWidget } from '@/lib/dashboard/layout';

interface DashboardClientProps {
  initialLayout?: DashboardWidget[];
}

export function DashboardClient({ initialLayout }: DashboardClientProps) {
  return <DraggableDashboard initialLayout={initialLayout} />;
}
