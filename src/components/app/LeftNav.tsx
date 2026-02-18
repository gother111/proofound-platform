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
  Video,
  Briefcase,
  Building,
  ClipboardList,
  MessageCircle,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * LeftNav Component - Primary Navigation Sidebar
 *
 * Design: Collapsible sidebar with icon-only or full-text navigation items
 * Accessibility:
 * - Semantic <nav> element with aria-label
 * - aria-current="page" for active links
 * - Keyboard navigable with visible focus states
 * - Tooltips in collapsed state for icon-only display
 * - ARIA labels for all interactive elements
 * Responsive:
 * - Collapsible to icon-only on user preference
 * - Will convert to bottom tab bar on mobile (future enhancement)
 * - Touch targets are 44px minimum (WCAG 2.5.5)
 * Animation: 300ms smooth expansion/collapse with easeInOut
 */

interface LeftNavProps {
  basePath?: string;
}

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  dataTour?: string;
}

export function LeftNav({ basePath = '/app/i' }: LeftNavProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

  const isOrg = basePath?.startsWith('/app/o/');

  const individualNavItems: NavItem[] = [
    { href: `${basePath}/home`, icon: Home, label: 'Dashboard', dataTour: 'home-link' },
    { href: `${basePath}/profile`, icon: User, label: 'Profile', dataTour: 'profile-link' },
    {
      href: `${basePath}/matching`,
      icon: Users,
      label: 'Matching',
      dataTour: 'matching-link',
    },
    {
      href: `${basePath}/messages`,
      icon: MessageCircle,
      label: 'Messages',
      dataTour: 'messages-link',
    },
    { href: `${basePath}/expertise`, icon: MapPin, label: 'Expertise', dataTour: 'expertise-link' },
    {
      href: `${basePath}/interviews`,
      icon: Video,
      label: 'Interviews',
      dataTour: 'interviews-link',
    },
    {
      href: `${basePath}/verifications`,
      icon: ShieldCheck,
      label: 'Verifications',
      dataTour: 'verifications-link',
    },
    { href: `${basePath}/zen`, icon: Sparkles, label: 'Zen Hub', dataTour: 'zen-link' },
    { href: `${basePath}/settings`, icon: Settings, label: 'Settings', dataTour: 'settings-link' },
  ];

  const orgNavItems: NavItem[] = [
    { href: `${basePath}/home`, icon: Home, label: 'Dashboard', dataTour: 'home-link' },
    {
      href: `${basePath}/assignments`,
      icon: Briefcase,
      label: 'Assignments',
      dataTour: 'assignments',
    },
    { href: `${basePath}/candidates`, icon: Users, label: 'Candidates', dataTour: 'candidates' },
    { href: `${basePath}/shortlist`, icon: UserCheck, label: 'Shortlist', dataTour: 'shortlist' },
    {
      href: `${basePath}/messages`,
      icon: MessageCircle,
      label: 'Messages',
      dataTour: 'messages-link',
    },
    {
      href: `${basePath}/interviews`,
      icon: Video,
      label: 'Interviews',
      dataTour: 'interviews-link',
    },
    { href: `${basePath}/profile`, icon: Building, label: 'Org Profile', dataTour: 'org-profile' },
    { href: `${basePath}/team`, icon: Users, label: 'Team', dataTour: 'team-link' },
    { href: `${basePath}/settings`, icon: Settings, label: 'Settings', dataTour: 'settings-link' },
  ];

  const navItems = isOrg ? orgNavItems : individualNavItems;
  const settingsHref = `${basePath}/settings`;
  const settingsNavItem = navItems.find((item) => item.href === settingsHref);
  const mobileNavItems = settingsNavItem
    ? [...navItems.filter((item) => item.href !== settingsHref).slice(0, 4), settingsNavItem]
    : navItems.slice(0, 5);

  return (
    <>
      {/* Desktop/Tablet Sidebar Navigation */}
      <aside
        data-tour="left-nav"
        className={`hidden md:flex border-r transition-all duration-300 ease-in-out flex-shrink-0 flex-col bg-neutral-light-50 border-proofound-stone/60 ${
          isExpanded ? 'w-52' : 'w-14'
        }`}
        aria-label={isExpanded ? 'Main navigation' : 'Main navigation (collapsed)'}
      >
        <div className="flex-1 py-3 overflow-y-auto">
          {/* Semantic navigation element with proper ARIA labeling */}
          <nav className="space-y-0.5 px-2" aria-label="Primary navigation">
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
                    data-tour={item.dataTour}
                    className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 min-h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-light-50 ${
                      isActive
                        ? 'bg-proofound-forest text-proofound-parchment'
                        : 'text-proofound-charcoal hover:bg-proofound-stone/50 focus-visible:bg-proofound-stone/60'
                    }`}
                    title={!isExpanded ? item.label : ''}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    onFocus={() => setHoveredItem(item.label)}
                    onBlur={() => setHoveredItem(null)}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {isExpanded && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                  </Link>

                  {/* Enhanced tooltip for collapsed state */}
                  {!isExpanded && hoveredItem === item.label && (
                    <div className="absolute left-full ml-2 px-3 py-2 rounded-md shadow-lg whitespace-nowrap z-50 pointer-events-none bg-proofound-charcoal text-proofound-parchment top-1/2 -translate-y-1/2">
                      {item.label}
                      <div className="absolute right-full top-1/2 border-4 border-transparent border-r-proofound-charcoal -translate-y-1/2" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-2 border-t border-proofound-stone/60">
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

      {/* Mobile Bottom Tab Bar Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-neutral-light-50 border-proofound-stone/60"
        role="navigation"
        aria-label="Mobile primary navigation"
      >
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {/* Show mobile nav items with settings always included */}
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px] min-h-[64px] justify-center ${
                  isActive
                    ? 'text-proofound-forest'
                    : 'text-muted-foreground hover:text-proofound-charcoal'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
