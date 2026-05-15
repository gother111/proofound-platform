'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CalendarCheck,
  FileCheck,
  Handshake,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

import IndividualInterviewsPage from '@/app/app/i/interviews/page';
import { MessagesClient as IndividualMessagesClient } from '@/app/app/i/messages/MessagesClient';
import OrganizationInterviewsPage from '@/app/app/o/[slug]/interviews/page';
import OrganizationMessagesPage from '@/app/app/o/[slug]/messages/page';
import { cn } from '@/lib/utils';

type CommunicationsPerspective = 'individual' | 'organization';
type CommunicationsSection = 'messages' | 'intros' | 'interviews' | 'decisions';

interface CommunicationsHubProps {
  perspective: CommunicationsPerspective;
}

const sections: Array<{
  id: CommunicationsSection;
  label: string;
  description: string;
  icon: typeof MessageCircle;
  workstream: 'messages' | 'interviews';
}> = [
  {
    id: 'messages',
    label: 'Messages',
    description: 'Conversation threads opened by proof-safe introductions.',
    icon: MessageCircle,
    workstream: 'messages',
  },
  {
    id: 'intros',
    label: 'Intros & reveal',
    description: 'Introduction state, masked identity context, and reveal approvals.',
    icon: ShieldCheck,
    workstream: 'messages',
  },
  {
    id: 'interviews',
    label: 'Interviews',
    description: 'Scheduling, reschedules, meeting links, completion, and no-show handling.',
    icon: CalendarCheck,
    workstream: 'interviews',
  },
  {
    id: 'decisions',
    label: 'Decisions & feedback',
    description: 'Decision windows, private handoff notes, and engagement confirmation.',
    icon: FileCheck,
    workstream: 'interviews',
  },
];

function normalizeSection(value: string | null): CommunicationsSection {
  if (value === 'intros' || value === 'interviews' || value === 'decisions') {
    return value;
  }
  return 'messages';
}

export function CommunicationsHub({ perspective }: CommunicationsHubProps) {
  const pathname = usePathname() ?? (perspective === 'organization' ? '/app/o' : '/app/i');
  const searchParams = useSearchParams();
  const activeSection = normalizeSection(searchParams?.get('section') ?? null);
  const activeConfig = sections.find((section) => section.id === activeSection) ?? sections[0];
  const ActiveIcon = activeConfig.icon;

  const sectionHref = (section: CommunicationsSection) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set('section', section);

    return `${pathname}?${params.toString()}`;
  };

  const isOrganization = perspective === 'organization';
  const surfaceNoun = isOrganization ? 'organization' : 'individual';

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-japandi-bg">
      <header className="border-b border-proofound-stone/70 bg-neutral-light-50/95 px-4 py-5 backdrop-blur md:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-proofound-forest">
                Hiring corridor
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-proofound-charcoal">
                Communications
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                One place for the conversation layer: messages, introductions, reveal approvals,
                interviews, decisions, and feedback handoff.
              </p>
            </div>

            <div className="rounded-lg border border-proofound-stone/70 bg-white/70 px-4 py-3 text-sm text-proofound-charcoal shadow-sm">
              <div className="flex items-center gap-2 font-medium">
                <Handshake className="h-4 w-4 text-proofound-forest" />
                Proof-safe process center
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Reveal and interview actions stay visible inside their live corridor surfaces.
              </p>
            </div>
          </div>

          <nav
            className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
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
                    'group flex min-h-24 items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2',
                    isActive
                      ? 'border-proofound-forest bg-proofound-forest text-white shadow-sm'
                      : 'border-proofound-stone/70 bg-white/70 text-proofound-charcoal hover:border-proofound-forest/50 hover:bg-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-proofound-parchment text-proofound-forest'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{section.label}</span>
                    <span
                      className={cn(
                        'mt-1 block text-xs leading-5',
                        isActive ? 'text-white/80' : 'text-muted-foreground'
                      )}
                    >
                      {section.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <section className="flex-1 min-h-0" aria-label={`${activeConfig.label} workspace`}>
        <div className="border-b border-proofound-stone/60 bg-white/55 px-4 py-3 md:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-proofound-parchment text-proofound-forest">
                <ActiveIcon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-proofound-charcoal">
                  {activeConfig.label}
                </h2>
                <p className="text-xs leading-5 text-muted-foreground">
                  {activeConfig.workstream === 'messages'
                    ? `Use the ${surfaceNoun} conversation thread for messages, intros, and reveal requests.`
                    : `Use the ${surfaceNoun} corridor cards for interview, decision, and feedback steps.`}
                </p>
              </div>
            </div>
            <Link
              href={sectionHref(activeConfig.workstream === 'messages' ? 'interviews' : 'messages')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-proofound-forest hover:underline"
            >
              Switch to {activeConfig.workstream === 'messages' ? 'interviews' : 'messages'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div
          className={cn(
            'min-h-0',
            activeConfig.workstream === 'messages'
              ? 'h-[calc(100vh-17.5rem)] min-h-[540px] overflow-hidden'
              : 'min-h-[calc(100vh-14rem)]'
          )}
        >
          {activeConfig.workstream === 'messages' ? (
            isOrganization ? (
              <OrganizationMessagesPage />
            ) : (
              <IndividualMessagesClient />
            )
          ) : isOrganization ? (
            <OrganizationInterviewsPage />
          ) : (
            <IndividualInterviewsPage />
          )}
        </div>
      </section>
    </div>
  );
}
