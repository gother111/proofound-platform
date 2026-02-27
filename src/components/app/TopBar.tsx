'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/actions/auth';
import { CustomizeModal } from '@/components/dashboard/CustomizeModal';
import { Logo } from '@/components/brand/Logo';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { getRouteMeta } from '@/lib/ui/v2/routeMeta';
import { cn } from '@/lib/utils';

/**
 * TopBar Component - Application Header
 *
 * Design: Horizontal header bar with branding and user controls
 * Accessibility:
 * - Semantic <header> element with role="banner"
 * - All interactive elements keyboard accessible
 * - Dropdown menu properly labeled for screen readers
 * - Avatar button has descriptive aria-label
 * Responsive:
 * - Maintains minimum touch target sizes (44px)
 * - Logo/branding stays visible at all sizes
 * - Animation: Smooth transitions on hover/focus (200ms)
 */

interface TopBarProps {
  userName?: string;
  userInitials?: string;
}

export function TopBar({ userName = 'User', userInitials = 'U' }: TopBarProps) {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const pathname = usePathname();
  const isDashboardTab = pathname?.includes('/home') ?? false;

  // V2 Feature Flag
  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';

  useEffect(() => {
    if (!isDashboardTab && customizeOpen) {
      setCustomizeOpen(false);
    }
  }, [isDashboardTab, customizeOpen]);

  // V2 uses the centralized metadata map, otherwise fallback to old hardcoded text
  const getPageTitle = () => {
    if (isV2 && pathname) {
      return getRouteMeta(pathname).title;
    }

    if (!pathname) return 'Dashboard';

    if (pathname.includes('/home')) return 'Dashboard';
    if (pathname.includes('/matching')) return 'Matching';
    if (pathname.includes('/expertise')) return 'Expertise';
    if (pathname.includes('/interviews')) return 'Interviews';
    if (pathname.includes('/messages')) return 'Messages';
    if (pathname.includes('/notifications')) return 'Notifications';
    if (pathname.includes('/opportunities')) return 'Opportunities';
    if (pathname.includes('/profile')) return 'Profile';
    if (pathname.includes('/zen')) return 'Zen Hub';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname.includes('/verifications')) return 'Verifications';
    if (pathname.includes('/projects')) return 'Projects';
    if (pathname.includes('/experiences')) return 'Experiences';
    if (pathname.includes('/education')) return 'Education';
    if (pathname.includes('/volunteering')) return 'Volunteering';
    if (pathname.includes('/impact')) return 'Impact';
    if (pathname.includes('/partnerships')) return 'Partnerships';
    if (pathname.includes('/assignments')) return 'Assignments';

    return 'Dashboard';
  };

  return (
    <>
      {/* Semantic header with role="banner" for main site header */}
      <header
        className={cn(
          'sticky top-0 z-40 min-h-14 px-4 flex items-center justify-between gap-2 md:gap-4 py-2 md:py-0 transition-all',
          isV2
            ? 'bg-white/80 backdrop-blur-md border-b border-proofound-stone/40 shadow-sm'
            : 'bg-neutral-light-50 border-b border-proofound-stone/60'
        )}
        role="banner"
      >
        {/* Left: Logo + Proofound + Separator + Title */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Logo - Branded identity */}
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-semibold text-sm hidden sm:inline text-proofound-charcoal">
              Proofound
            </span>
          </div>

          <Separator
            orientation="vertical"
            className="h-4 bg-proofound-stone hidden sm:block"
            aria-hidden="true"
          />

          {/* Current page indicator - hide on very small screens */}
          <h1
            className={cn(
              'text-base hidden sm:block text-proofound-charcoal',
              isV2 ? 'font-medium' : 'font-normal'
            )}
          >
            {getPageTitle()}
          </h1>
        </div>

        {/* Right: Notification Bell + Customize + Avatar */}
        <div className="flex items-center gap-2 md:gap-3">
          <NotificationBell />
          {isDashboardTab && (
            /* Hide customize button on mobile for space */
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomizeOpen(true)}
              className={cn(
                'text-xs h-8 focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 hidden md:flex',
                isV2
                  ? 'border-proofound-stone/40 hover:bg-proofound-stone/20'
                  : 'border-proofound-stone/60'
              )}
            >
              Customize
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open profile menu"
                className="rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 transition-transform hover:scale-105"
              >
                <Avatar className="w-8 h-8 border border-white shadow-sm">
                  <AvatarFallback className="text-xs font-medium bg-proofound-forest text-proofound-parchment">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-proofound-stone/60 rounded-xl shadow-lg"
            >
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground">Signed in</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer focus:bg-rose-50 focus:text-rose-600 rounded-md"
                >
                  <button type="submit" className="w-full text-left">
                    Log out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {isDashboardTab && <CustomizeModal open={customizeOpen} onOpenChange={setCustomizeOpen} />}
    </>
  );
}
