import { requirePersona } from '@/lib/auth';
import { LeftNav } from '@/components/app/LeftNav';
import { TopBar } from '@/components/app/TopBar';
import { DeferredTourProvider } from '@/components/tour/DeferredTourProvider';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { SpotlightProvider } from '@/components/ui/spotlight-provider';

/**
 * Individual User Layout
 *
 * Design: Two-column layout with sidebar navigation and top bar
 * Accessibility:
 * - Semantic HTML structure with proper landmark regions
 * - Main content has ID for skip-to-content link
 * - Proper heading hierarchy within child pages
 * Responsive: Sidebar collapses on mobile, bottom tab bar alternative
 */

export default async function IndividualLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePersona('individual');

  const userName = user.displayName || user.handle || 'User';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';

  return (
    <SpotlightProvider>
      <div className={`flex h-screen ${isV2 ? 'bg-japandi-bg' : 'bg-proofound-parchment'}`}>
        <LeftNav basePath="/app/i" isBetaTesting={user.isBetaTesting} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar userName={userName} userInitials={userInitials} basePath="/app/i" />
          {/* Main content region with ID for skip-to-content link */}
          {/* Reserve mobile space for the fixed bottom navigation. */}
          <main
            id="main-content"
            className="relative mb-[4.75rem] flex-1 overflow-y-auto overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] scroll-pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:mb-0 md:pb-0 md:scroll-pb-0"
            role="main"
            aria-label="Main content"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable landmark must be keyboard focusable for WCAG 2.1.1
            tabIndex={0}
          >
            {children}
          </main>
        </div>
        <CommandPalette />
        <DeferredTourProvider />
      </div>
    </SpotlightProvider>
  );
}
