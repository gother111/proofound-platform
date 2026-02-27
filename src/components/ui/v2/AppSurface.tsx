import React from 'react';
import { cn } from '@/lib/utils';
import { SurfaceDensity } from '@/lib/ui/v2/types';

interface AppSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: SurfaceDensity;
  withBackground?: boolean;
}

export function AppSurface({
  children,
  className,
  density = 'comfortable',
  withBackground = true,
  ...props
}: AppSurfaceProps) {
  return (
    <div
      className={cn(
        'w-full min-h-[calc(100vh-3.5rem)] text-foreground flex flex-col', // 3.5rem accounts for TopBar height typically
        withBackground ? 'bg-japandi-bg' : 'bg-transparent',
        density === 'comfortable' && 'p-4 md:p-8',
        density === 'compact' && 'p-2 md:p-4',
        density === 'spacious' && 'p-6 md:p-12 lg:p-16',
        className
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl flex flex-col gap-6 flex-1">{children}</div>
    </div>
  );
}
