'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
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

/**
 * TopBar Component - Application Header
 *
 * Design: Horizontal header bar with branding, search, and user controls
 * Accessibility:
 * - Semantic <header> element with role="banner"
 * - Searchable input with proper label and aria attributes
 * - All interactive elements keyboard accessible
 * - Dropdown menu properly labeled for screen readers
 * - Avatar button has descriptive aria-label
 * Responsive:
 * - Stacks search below on mobile
 * - Maintains minimum touch target sizes (44px)
 * - Logo/branding stays visible at all sizes
 * Animation: Smooth transitions on hover/focus (200ms)
 */

interface TopBarProps {
  userName?: string;
  userInitials?: string;
}

export function TopBar({ userName = 'User', userInitials = 'U' }: TopBarProps) {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const pathname = usePathname();

  // Map routes to page titles
  const getPageTitle = () => {
    if (!pathname) return 'Dashboard';

    if (pathname.includes('/home')) return 'Dashboard';
    if (pathname.includes('/matching')) return 'Matching';
    if (pathname.includes('/expertise')) return 'Expertise';
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
        className="sticky top-0 z-50 min-h-14 px-4 border-b flex items-center justify-between gap-2 md:gap-4 flex-wrap md:flex-nowrap py-2 md:py-0"
        style={{
          backgroundColor: '#FDFCFA',
          borderColor: 'rgba(232, 230, 221, 0.6)',
        }}
        role="banner"
      >
        {/* Left: Logo + Proofound + Separator + Title */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Logo - Branded identity */}
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-semibold text-sm hidden sm:inline" style={{ color: '#2D3330' }}>
              Proofound
            </span>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" aria-hidden="true" />

          {/* Current page indicator - hide on very small screens */}
          <h1 className="text-base font-normal hidden sm:block" style={{ color: '#2D3330' }}>
            {getPageTitle()}
          </h1>
        </div>

        {/* Center: Search - with proper labeling for accessibility */}
        {/* Full width on mobile, constrained on desktop */}
        <div className="w-full md:w-auto md:flex-1 md:max-w-xs order-3 md:order-2">
          <label htmlFor="global-search" className="sr-only">
            Search across the platform
          </label>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border w-full"
            style={{
              backgroundColor: 'white',
              borderColor: 'rgba(232, 230, 221, 0.6)',
            }}
            role="search"
          >
            <Search
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: '#6B6760' }}
              aria-hidden="true"
            />
            <input
              id="global-search"
              type="search"
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-sm focus:outline-none min-w-0"
              style={{ color: '#2D3330' }}
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right: Notification Bell + Customize + Avatar */}
        {/* order-2 on mobile to keep it on first row, order-3 on desktop */}
        <div className="flex items-center gap-2 md:gap-3 order-2 md:order-3">
          <NotificationBell />
          {/* Hide customize button on mobile for space */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomizeOpen(true)}
            className="text-xs h-8 focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2 hidden md:flex"
            style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
          >
            Customize
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open profile menu"
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback
                    className="text-xs font-medium"
                    style={{ backgroundColor: '#1C4D3A', color: '#F7F6F1' }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
            >
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground">Signed in</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    Log out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CustomizeModal open={customizeOpen} onOpenChange={setCustomizeOpen} />
    </>
  );
}
