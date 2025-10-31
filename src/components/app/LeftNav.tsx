'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  Users,
  MapPin,
  ShieldCheck,
  Sparkles,
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

  const navItems = [
    { href: `${basePath}/home`, icon: Home, label: 'Dashboard' },
    { href: `${basePath}/profile`, icon: User, label: 'Profile' },
    { href: `${basePath}/matching`, icon: Users, label: 'Matching' },
    { href: `${basePath}/expertise`, icon: MapPin, label: 'Expertise' },
    { href: `${basePath}/verifications`, icon: ShieldCheck, label: 'Verifications' },
    { href: `${basePath}/zen`, icon: Sparkles, label: 'Zen Hub' },
    { href: `${basePath}/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className={`border-r transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col ${
        isExpanded ? 'w-52' : 'w-14'
      }`}
      style={{
        backgroundColor: '#FDFCFA',
        borderColor: 'rgba(232, 230, 221, 0.6)',
      }}
    >
      <div className="flex-1 py-3 overflow-y-auto">
        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href);

            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 min-h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFCFA] ${
                    isActive
                      ? 'bg-[#1C4D3A] text-[#F7F6F1]'
                      : 'text-[#2D3330] hover:bg-[#E8E6DD]/50 focus-visible:bg-[#E8E6DD]/60'
                  }`}
                  title={!isExpanded ? item.label : ''}
                  aria-label={item.label}
                  onFocus={() => setHoveredItem(item.label)}
                  onBlur={() => setHoveredItem(null)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {isExpanded && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                </Link>

                {/* Enhanced tooltip for collapsed state */}
                {!isExpanded && hoveredItem === item.label && (
                  <div
                    className="absolute left-full ml-2 px-3 py-2 rounded-md shadow-lg whitespace-nowrap z-50 pointer-events-none"
                    style={{
                      backgroundColor: '#2D3330',
                      color: '#F7F6F1',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {item.label}
                    <div
                      className="absolute right-full top-1/2 border-4 border-transparent"
                      style={{
                        borderRightColor: '#2D3330',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-center h-8"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </aside>
  );
}
