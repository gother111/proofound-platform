import React from 'react';
import { cn } from '@/lib/utils';

interface SplitPaneWorkspaceProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: 'narrow' | 'default' | 'wide';
}

export function SplitPaneWorkspace({
  sidebarContent,
  mainContent,
  sidebarPosition = 'left',
  sidebarWidth = 'default',
  className,
  ...props
}: SplitPaneWorkspaceProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row gap-6 w-full h-full min-h-[500px]',
        sidebarPosition === 'right' && 'md:flex-row-reverse',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex-shrink-0 flex flex-col',
          sidebarWidth === 'narrow' && 'md:w-[250px] lg:w-[280px]',
          sidebarWidth === 'default' && 'md:w-[300px] lg:w-[340px]',
          sidebarWidth === 'wide' && 'md:w-[350px] lg:w-[400px]'
        )}
      >
        {sidebarContent}
      </div>

      <div className="flex-1 flex flex-col min-w-0">{mainContent}</div>
    </div>
  );
}
