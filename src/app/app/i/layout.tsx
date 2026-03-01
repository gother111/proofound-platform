import { requirePersona } from '@/lib/auth';
import { LeftNav } from '@/components/app/LeftNav';
import { TopBar } from '@/components/app/TopBar';
import { TourProvider } from '@/components/tour/TourProvider';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { SUSTriggerProvider } from '@/components/feedback/SUSTriggerProvider';
import { SpotlightProvider } from '@/components/ui/spotlight-provider';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';

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
  const completionState = await getIndividualProfileCompletionState(user.id);

  const userName = user.displayName || user.handle || 'User';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';

  return (
    <SUSTriggerProvider userId={user.id}>
      <SpotlightProvider>
        <div className={`flex h-screen ${isV2 ? 'bg-japandi-bg' : 'bg-proofound-parchment'}`}>
          <LeftNav
            basePath="/app/i"
            individualPortfolioGate={{
              locked: !completionState.isPortfolioReady,
              reason: completionState.portfolioLockReason,
            }}
            isBetaTesting={user.isBetaTesting}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar userName={userName} userInitials={userInitials} />
            {/* Main content region with ID for skip-to-content link */}
            {/* Add bottom padding on mobile to account for bottom navigation (80px) */}
            <main
              id="main-content"
              className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0 relative"
              role="main"
              aria-label="Main content"
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable landmark must be keyboard focusable for WCAG 2.1.1
              tabIndex={0}
            >
              {children}
            </main>
          </div>
          <CommandPalette />
          <TourProvider />
        </div>
      </SpotlightProvider>
    </SUSTriggerProvider>
  );
}
