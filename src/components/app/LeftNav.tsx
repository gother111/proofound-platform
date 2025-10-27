'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  FolderKanban,
  Users,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeftNavProps {
  basePath?: string;
}

export function LeftNav({ basePath = '/app/i' }: LeftNavProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  const navItems = [
    { href: `${basePath}/home`, icon: Home, label: 'Dashboard' },
    { href: `${basePath}/profile`, icon: User, label: 'Profile' },
    { href: `${basePath}/projects`, icon: FolderKanban, label: 'Projects' },
    { href: `${basePath}/matching`, icon: Users, label: 'Matching' },
    { href: `${basePath}/opportunities`, icon: Briefcase, label: 'Opportunities' },
    { href: `${basePath}/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav
      className={`h-screen border-r border-proofound-stone dark:border-border bg-white dark:bg-card transition-all duration-300 flex flex-col ${
        isExpanded ? 'w-52' : 'w-14'
      }`}
    >
      <div className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-proofound-forest text-white'
                  : 'text-proofound-charcoal dark:text-foreground hover:bg-proofound-stone dark:hover:bg-muted'
              }`}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Toggle button */}
      <div className="p-2 border-t border-proofound-stone dark:border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-center hover:bg-proofound-stone dark:hover:bg-muted"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </nav>
  );
}
