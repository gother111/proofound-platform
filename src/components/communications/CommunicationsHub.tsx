'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, Handshake, Loader2, MessageCircle } from 'lucide-react';

import IndividualInterviewsPage from '@/app/app/i/interviews/IndividualInterviewsPage';
import { MessagesClient as IndividualMessagesClient } from '@/app/app/i/messages/MessagesClient';
import OrganizationInterviewsPage from '@/app/app/o/[slug]/interviews/page';
import { DeferredOrgMessagesClient } from '@/app/app/o/[slug]/messages/DeferredOrgMessagesClient';
import { cn } from '@/lib/utils';

type CommunicationsPerspective = 'individual' | 'organization';
type CommunicationsSection = 'messages' | 'interviews';
type CommunicationsSectionConfig = {
  id: CommunicationsSection;
  label: string;
  description: string;
  icon: typeof MessageCircle;
};

interface CommunicationsHubProps {
  perspective: CommunicationsPerspective;
  currentUserId?: string;
  initialSection?: string | null;
}

const sectionsByPerspective: Record<CommunicationsPerspective, CommunicationsSectionConfig[]> = {
  individual: [
    {
      id: 'messages',
      label: 'Messages',
      description: 'Introductions, reveal choices, and private threads.',
      icon: MessageCircle,
    },
    {
      id: 'interviews',
      label: 'Interviews',
      description: 'Interview times, decisions, and visible feedback.',
      icon: CalendarCheck,
    },
  ],
  organization: [
    {
      id: 'messages',
      label: 'Messages',
      description: 'Reviewer threads, intros, and reveal requests.',
      icon: MessageCircle,
    },
    {
      id: 'interviews',
      label: 'Interviews',
      description: 'Scheduling, decisions, and engagement handoff.',
      icon: CalendarCheck,
    },
  ],
};

const corridorCopy: Record<CommunicationsPerspective, string> = {
  individual:
    'Messages, interview timing, and reveal decisions stay consent-bound before identity-bearing access.',
  organization:
    'Reviewer messages, scheduling, and reveal steps stay inside the proof-first review corridor.',
};

function normalizeSection(value: string | null): CommunicationsSection {
  if (value === 'interviews' || value === 'decisions') {
    return 'interviews';
  }
  return 'messages';
}

function OrganizationMessagesLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-proofound-stone/70 bg-white/70 px-5 text-center shadow-sm"
    >
      <div className="max-w-sm space-y-3">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-proofound-forest" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-proofound-charcoal">
            Preparing organization messages
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Loading team conversation context before showing threads, intros, and reveal requests.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CommunicationsHub({
  perspective,
  currentUserId,
  initialSection,
}: CommunicationsHubProps) {
  const pathname = usePathname() ?? (perspective === 'organization' ? '/app/o' : '/app/i');
  const activeSection = normalizeSection(initialSection ?? null);
  const sections = sectionsByPerspective[perspective];

  const sectionHref = (section: CommunicationsSection) => {
    const params = new URLSearchParams();
    params.set('section', section);
    return `${pathname}?${params.toString()}`;
  };

  const isOrganization = perspective === 'organization';

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col bg-japandi-bg md:h-[calc(100vh-3.5rem)] md:flex-row md:overflow-hidden">
      {/* Left Sidebar for Tab/Section Selection */}
      <aside className="flex w-full shrink-0 flex-col gap-5 border-b border-proofound-stone/70 bg-neutral-light-50/95 p-4 md:w-72 md:justify-between md:border-b-0 md:border-r md:p-5">
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-proofound-forest">
              Assignment Review Corridor
            </p>
            <h1 className="font-display text-xl font-semibold text-proofound-charcoal">
              Communications
            </h1>
          </div>

          <nav
            className="grid gap-2 sm:grid-cols-2 md:block md:space-y-2"
            aria-label="Communication sections"
          >
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;

              return (
                <Link
                  key={section.id}
                  href={sectionHref(section.id)}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none sm:w-auto',
                    isActive
                      ? 'border-proofound-forest bg-proofound-forest text-white shadow-sm'
                      : 'border-proofound-stone/50 bg-white/60 text-proofound-charcoal hover:border-proofound-forest/40 hover:bg-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Switch to ${section.label.toLowerCase()}: ${section.description}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold">{section.label}</span>
                    <span
                      className={cn(
                        'block text-[10px] leading-snug line-clamp-2',
                        isActive ? 'text-white/80' : 'text-muted-foreground'
                      )}
                    >
                      {section.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Supporting Privacy/Trust Panel */}
        <div className="space-y-1 rounded-lg border border-proofound-stone/60 bg-white/50 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-proofound-charcoal">
            <Handshake className="h-3.5 w-3.5 text-proofound-forest shrink-0" />
            <span>Secure Corridor</span>
          </div>
          <p className="text-[10px] leading-4 text-muted-foreground">{corridorCopy[perspective]}</p>
        </div>
      </aside>

      {/* Right Pane for Active Workspace */}
      <main className="min-h-0 flex-1 overflow-y-auto" aria-label={`${activeSection} workspace`}>
        <div className="min-h-full">
          {activeSection === 'messages' ? (
            isOrganization ? (
              currentUserId ? (
                <DeferredOrgMessagesClient currentUserId={currentUserId} hideHeader />
              ) : (
                <OrganizationMessagesLoading />
              )
            ) : (
              <IndividualMessagesClient />
            )
          ) : isOrganization ? (
            <OrganizationInterviewsPage />
          ) : (
            <IndividualInterviewsPage />
          )}
        </div>
      </main>
    </div>
  );
}
