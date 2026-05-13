'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
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

type ProfileMenuComponent = ComponentType<{
  userName: string;
  onClose: () => void;
}>;

export function TopBar({ userName = 'User', userInitials = 'U' }: TopBarProps) {
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [ProfileMenu, setProfileMenu] = useState<ProfileMenuComponent | null>(null);

  // V2 Feature Flag
  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';

  // V2 uses the centralized metadata map, otherwise fallback to old hardcoded text
  const getPageTitle = () => {
    if (isV2 && pathname) {
      return getRouteMeta(pathname).title;
    }

    if (!pathname) return 'Overview';

    if (pathname.includes('/home')) return 'Overview';
    if (pathname.includes('/matching')) return 'Matching';
    if (pathname.includes('/interviews')) return 'Interviews';
    if (pathname.includes('/messages')) return 'Messages';
    if (pathname.includes('/profile')) return 'Profile';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname.includes('/verifications')) return 'Verifications';
    if (pathname.includes('/assignments')) return 'Assignments';

    return 'Overview';
  };

  useEffect(() => {
    if (!isProfileMenuOpen || ProfileMenu) {
      return;
    }

    let cancelled = false;

    void import('./TopBarProfileMenu').then((module) => {
      if (!cancelled) {
        setProfileMenu(() => module.TopBarProfileMenu);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ProfileMenu, isProfileMenuOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isProfileMenuOpen]);

  return (
    <>
      {/* Semantic header with role="banner" for main site header */}
      <header
        className={cn(
          'sticky top-0 z-40 min-h-14 px-4 flex items-center justify-between gap-2 md:gap-4 py-2 md:py-0 transition-all duration-300',
          isV2
            ? 'bg-card/50 backdrop-blur-xl border-b border-black/[0.04] shadow-none rounded-none dark:border-white/5 dark:bg-card/80'
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

          <div
            className="hidden h-4 w-px shrink-0 bg-proofound-stone sm:block"
            aria-hidden="true"
          />

          {/* Current page indicator - hide on very small screens */}
          <h1
            className={cn(
              'text-lg hidden sm:block text-proofound-charcoal font-display',
              isV2 ? 'font-medium' : 'font-normal'
            )}
          >
            {getPageTitle()}
          </h1>
        </div>

        {/* Right: Avatar */}
        <div ref={profileMenuRef} className="relative flex items-center gap-2 md:gap-3">
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-proofound-forest text-xs font-medium text-proofound-parchment shadow-sm">
              {userInitials}
            </span>
          </button>
          {isProfileMenuOpen && ProfileMenu ? (
            <ProfileMenu userName={userName} onClose={() => setIsProfileMenuOpen(false)} />
          ) : null}
        </div>
      </header>
    </>
  );
}
