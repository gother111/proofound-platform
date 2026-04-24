'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Lock,
  User,
  Users,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Video,
  Briefcase,
  Building,
  ClipboardList,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ORG_MVP_NAV_ITEMS } from '@/lib/org/mvp-surface-policy';

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
  individualPortfolioGate?: {
    locked: boolean;
    reason?: string | null;
  };
  isBetaTesting?: boolean;
}

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  dataTour?: string;
  locked?: boolean;
  lockReason?: string | null;
}

export function LeftNav({ basePath = '/app/i', isBetaTesting = false }: LeftNavProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

  const isOrg = basePath?.startsWith('/app/o/');

  const individualNavItems: NavItem[] = [
    { href: `${basePath}/home`, icon: Home, label: 'Overview', dataTour: 'home-link' },
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
    { href: `${basePath}/settings`, icon: Settings, label: 'Settings', dataTour: 'settings-link' },
  ];

  const orgIconMap = {
    home: Home,
    briefcase: Briefcase,
    building: Building,
    clipboard: ClipboardList,
  } as const;

  const orgNavItems: NavItem[] = ORG_MVP_NAV_ITEMS.map((item) => ({
    href: `${basePath}${item.hrefSuffix}`,
    icon: orgIconMap[item.icon],
    label: item.label,
    dataTour:
      item.hrefSuffix === '/home'
        ? 'home-link'
        : item.hrefSuffix === '/matching'
          ? 'matching-link'
          : item.hrefSuffix === '/profile'
            ? 'org-profile'
            : 'portfolio-link',
  }));

  const navItems = isOrg ? orgNavItems : individualNavItems;
  const filteredNavItems = navItems;
  const settingsHref = `${basePath}/settings`;
  const settingsNavItem = filteredNavItems.find((item) => item.href === settingsHref);
  const mobileNavItems = settingsNavItem
    ? [
        ...filteredNavItems.filter((item) => item.href !== settingsHref).slice(0, 4),
        settingsNavItem,
      ]
    : filteredNavItems.slice(0, 5);

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';

  return (
    <>
      {/* Desktop/Tablet Sidebar Navigation */}
      <aside
        data-tour="left-nav"
        className={cn(
          'hidden md:flex border-r transition-all duration-300 ease-in-out flex-shrink-0 flex-col z-30',
          isV2
            ? 'bg-card/50 backdrop-blur-xl border-r border-black/[0.04] shadow-none rounded-none dark:border-white/5 dark:bg-card'
            : 'bg-neutral-light-50 border-proofound-stone/60',
          isExpanded ? 'w-60' : 'w-14'
        )}
        aria-label={isExpanded ? 'Main navigation' : 'Main navigation (collapsed)'}
      >
        <div className="flex-1 py-3 overflow-y-auto">
          {/* Semantic navigation element with proper ARIA labeling */}
          <nav className="space-y-0.5 px-2" aria-label="Primary navigation">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isLocked = Boolean(item.locked);
              const isActive =
                !isLocked && (pathname === item.href || pathname?.startsWith(item.href));
              const tooltipText = !isExpanded
                ? isLocked
                  ? `${item.label} (Locked)`
                  : item.label
                : '';

              // V2 Active/Hover styles vs Legacy
              const itemStyles = isV2
                ? isActive
                  ? 'bg-proofound-forest text-white shadow-sm'
                  : 'text-proofound-charcoal hover:bg-proofound-stone/20 focus-visible:bg-proofound-stone/20'
                : isActive
                  ? 'bg-proofound-forest text-proofound-parchment'
                  : 'text-proofound-charcoal hover:bg-proofound-stone/50 focus-visible:bg-proofound-stone/60';

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {isLocked ? (
                    <button
                      type="button"
                      data-tour={item.dataTour}
                      className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 min-h-12 text-proofound-charcoal/40 bg-proofound-stone/10 cursor-not-allowed"
                      title={isExpanded ? item.lockReason || '' : tooltipText}
                      aria-label={`${item.label} (locked)`}
                      aria-disabled="true"
                      onFocus={() => setHoveredItem(item.label)}
                      onBlur={() => setHoveredItem(null)}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      {isExpanded && (
                        <span className="text-sm font-medium whitespace-nowrap flex items-center gap-1.5">
                          {item.label}
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      data-tour={item.dataTour}
                      className={cn(
                        'group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 min-h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2',
                        itemStyles
                      )}
                      title={tooltipText}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      onFocus={() => setHoveredItem(item.label)}
                      onBlur={() => setHoveredItem(null)}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      {isExpanded && (
                        <span
                          className={cn(
                            'min-w-0 truncate text-sm whitespace-nowrap',
                            isV2 && 'font-medium'
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Enhanced tooltip for collapsed state */}
                  {!isExpanded && hoveredItem === item.label && (
                    <div className="absolute left-full ml-2 px-3 py-2 rounded-md shadow-lg whitespace-nowrap z-50 pointer-events-none bg-proofound-charcoal text-proofound-parchment top-1/2 -translate-y-1/2">
                      {item.locked ? `${item.label} (Locked)` : item.label}
                      <div className="absolute right-full top-1/2 border-4 border-transparent border-r-proofound-charcoal -translate-y-1/2" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-2 border-t border-proofound-stone/60">
          {isBetaTesting ? (
            <div
              className={cn(
                'mb-2 rounded-md border px-2 py-1 text-xs font-medium text-center',
                isV2
                  ? 'border-proofound-forest/25 bg-proofound-forest/10 text-proofound-forest'
                  : 'border-proofound-forest/30 bg-proofound-parchment text-proofound-forest'
              )}
            >
              {isExpanded ? 'Beta testing' : 'Beta'}
            </div>
          ) : null}
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-neutral-light-50 border-proofound-stone/60 pointer-events-none"
        role="navigation"
        aria-label="Mobile primary navigation"
      >
        <div className="flex items-center gap-1 px-1 py-2 safe-area-inset-bottom pointer-events-none">
          {/* Show mobile nav items with settings always included */}
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isLocked = Boolean(item.locked);
            const isActive =
              !isLocked && (pathname === item.href || pathname?.startsWith(item.href));

            if (isLocked) {
              return (
                <button
                  key={item.href}
                  type="button"
                  className="relative flex flex-1 min-w-0 flex-col items-center gap-1 px-1 py-2 rounded-lg min-h-[64px] justify-center text-muted-foreground/60 cursor-not-allowed pointer-events-auto"
                  aria-label={`${item.label} (locked)`}
                  aria-disabled="true"
                  title={item.lockReason || ''}
                >
                  <Icon className="w-6 h-6 relative z-10" aria-hidden="true" />
                  <span className="w-full max-w-full truncate text-center text-[11px] font-medium leading-none relative z-10">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-1 min-w-0 flex-col items-center gap-1 px-1 py-2 rounded-lg transition-colors min-h-[64px] justify-center pointer-events-auto ${
                  isActive
                    ? 'text-proofound-forest'
                    : 'text-muted-foreground hover:text-proofound-charcoal'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                {/* Fluid Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-proofound-forest/10 rounded-lg pointer-events-none"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                <Icon className="w-6 h-6 relative z-10" aria-hidden="true" />
                <span className="w-full max-w-full truncate text-center text-[11px] font-medium leading-none relative z-10">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
