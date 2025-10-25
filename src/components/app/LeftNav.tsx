'use client';

import { useState, type ComponentType } from 'react';
import Link from 'next/link';
import {
  Home,
  User,
  FolderKanban,
  Users,
  Shield,
  Briefcase,
  Settings,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScopeAwareNavLinks } from './NavLinks';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Dashboard: Home,
  Profile: User,
  Projects: FolderKanban,
  Matching: Users,
  Verifications: Shield,
  Opportunities: Briefcase,
  Settings: Settings,
  Team: UsersRound,
};

export function LeftNav() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { links, pathname } = useScopeAwareNavLinks();

  return (
    <nav
      className={`h-screen border-r transition-all duration-300 flex flex-col ${
        isExpanded ? 'w-52' : 'w-14'
      }`}
      style={{ backgroundColor: '#FDFCFA', borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      <div className="flex-1 overflow-y-auto py-4">
        {links.map((item) => {
          const Icon = iconMap[item.label] ?? Home;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition-colors ${
                isActive ? 'text-white' : 'hover:bg-[#E8E6DD]'
              }`}
              style={isActive ? { backgroundColor: '#7A9278' } : {}}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Toggle button */}
      <div className="p-2 border-t" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-center"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </nav>
  );
}
