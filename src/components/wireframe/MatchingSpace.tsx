'use client';

import { useMemo, useState } from 'react';
import { Building2, Filter, Info, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AssignmentBuilder } from '@/components/matching/AssignmentBuilder';
import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';
import { TypeaheadChips } from '@/components/matching/TypeaheadChips';
import { MatchingProfileSetup } from '@/components/matching/MatchingProfileSetup';
import { MatchResultCard } from '@/components/matching/MatchResultCard';

const INDIVIDUAL_MATCHES = [
  {
    name: 'Green Streets',
    subtitle: 'Cause • Regenerative urbanism',
    score: '92',
    tags: ['Local', 'Community'],
  },
  {
    name: 'Repair Café',
    subtitle: 'Project • Facilitation',
    score: '89',
    tags: ['Hands-on', 'Circular economy'],
  },
  {
    name: 'Commons Atlas Collective',
    subtitle: 'Partner • Research',
    score: '87',
    tags: ['Research', 'Policy'],
  },
];

const ORGANIZATION_MATCHES = [
  {
    name: 'Alex Rivera',
    subtitle: 'Data viz • 5 hrs/week',
    score: '94',
    tags: ['D3.js', 'Impact reporting'],
  },
  {
    name: 'Maya Chen',
    subtitle: 'Facilitation • Weekends',
    score: '91',
    tags: ['Community ops', 'Volunteer lead'],
  },
  {
    name: 'Climate Action Network',
    subtitle: 'Partner org',
    score: '88',
    tags: ['Policy', 'Global network'],
  },
];

const INDIVIDUAL_FILTERS = ['Regenerative design', 'Co-ops', 'Climate justice'];
const ORGANIZATION_FILTERS = ['Volunteer availability', 'Impact verification', 'Location'];

type Persona = 'individual' | 'organization';
type View = 'matches' | 'profile' | 'assignment';

export function MatchingSpaceWireframe() {
  const [persona, setPersona] = useState<Persona>('individual');
  const [view, setView] = useState<View>('matches');

  const matches = persona === 'individual' ? INDIVIDUAL_MATCHES : ORGANIZATION_MATCHES;
  const filters = persona === 'individual' ? INDIVIDUAL_FILTERS : ORGANIZATION_FILTERS;

  const secondaryView = persona === 'individual' ? 'profile' : 'assignment';
  const secondaryLabel = persona === 'individual' ? 'Matching profile' : 'Create assignment';

  const chips = useMemo(() => filters.map((filter) => `${filter}`), [filters]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F1] text-[#2D3330]">
      <MatchingHeader
        persona={persona}
        onPersonaChange={(p) => {
          setPersona(p);
          setView('matches');
        }}
        view={view}
        onViewChange={setView}
        secondaryLabel={secondaryLabel}
        secondaryView={secondaryView}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 border-r border-[#E8E6DD] bg-[#FDFCFA] lg:block">
          <div className="flex h-full flex-col">
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold">Filters</h2>
              <p className="mt-1 text-xs text-[#6B6760]">Tune preferences for better matches.</p>
            </div>
            <ScrollArea className="flex-1 px-5" type="auto">
              <div className="space-y-6 pb-8">
                <section>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-[#4A5943]">
                    Focus Areas
                  </h3>
                  <div className="space-y-2">
                    <TypeaheadChips
                      label="Focus tags"
                      taxonomy={chips}
                      selected={filters.slice(0, 2)}
                      onChange={() => {}}
                      placeholder="Add focus"
                      max={6}
                      helpText="Choose up to 6 tags"
                    />
                  </div>
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-[#4A5943]">
                    Preferences
                  </h3>
                  <div className="space-y-2 text-xs">
                    <PreferenceToggle label="Open to new opportunities" value />
                    <PreferenceToggle
                      label="Show verified only"
                      value={persona === 'organization'}
                    />
                    <PreferenceToggle label="Include partners" value />
                  </div>
                </section>
              </div>
            </ScrollArea>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {view === 'matches' && <MatchesPanel persona={persona} matches={matches} />}
          {view === 'profile' && persona === 'individual' && <ProfilePanel />}
          {view === 'assignment' && persona === 'organization' && <AssignmentPanel />}
        </main>
      </div>
    </div>
  );
}

function MatchingHeader({
  persona,
  onPersonaChange,
  view,
  onViewChange,
  secondaryLabel,
  secondaryView,
}: {
  persona: Persona;
  onPersonaChange: (value: Persona) => void;
  view: View;
  onViewChange: (value: View) => void;
  secondaryLabel: string;
  secondaryView: View;
}) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-[#E8E6DD] bg-[#FDFCFA] px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium">Matching</h1>
        <div className="h-6 w-px bg-[#E8E6DD]" />
        <div className="flex items-center gap-2 rounded-full bg-[#E8E6DD] p-1 text-xs">
          <ToolbarButton
            active={persona === 'individual'}
            onClick={() => onPersonaChange('individual')}
            icon={<User className="h-3 w-3" />}
            label="Individual"
          />
          <ToolbarButton
            active={persona === 'organization'}
            onClick={() => onPersonaChange('organization')}
            icon={<Building2 className="h-3 w-3" />}
            label="Organization"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => onViewChange('matches')}
          className={`rounded-full px-3 py-1 transition ${view === 'matches' ? 'bg-[#1C4D3A] text-white' : 'text-[#6B6760]'}`}
        >
          Matches
        </button>
        <button
          onClick={() => onViewChange(secondaryView)}
          className={`rounded-full px-3 py-1 transition ${view === secondaryView ? 'bg-[#1C4D3A] text-white' : 'text-[#6B6760]'}`}
        >
          {secondaryLabel}
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition ${active ? 'bg-[#1C4D3A] text-white shadow-sm' : 'text-[#2D3330]'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function MatchesPanel({
  persona,
  matches,
}: {
  persona: Persona;
  matches: typeof INDIVIDUAL_MATCHES;
}) {
  return (
    <div className="grid gap-4 px-6 py-8 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <Card className="border border-[#E8E6DD] bg-white/90 p-6">
          <header className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2D3330]">Matches</h2>
              <p className="text-sm text-[#6B6760]">
                Proof-based suggestions tuned to your profile.
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full border-[#E8E6DD]">
              <Filter className="mr-2 h-4 w-4" />
              Refine results
            </Button>
          </header>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.name} {...match} />
            ))}
          </div>
        </Card>

        <Card className="border border-[#E8E6DD] bg-white/90 p-6">
          <header className="mb-6 flex items-center justify-between text-sm text-[#6B6760]">
            <span>Evidence coverage</span>
            <span>Last updated 2 days ago</span>
          </header>
          <div className="grid gap-4 md:grid-cols-3">
            {['Self-claim', 'Peer review', 'Verified artifacts'].map((label) => (
              <div key={label} className="rounded-2xl border border-[#E8E6DD] bg-white/80 p-4">
                <h3 className="text-xs font-semibold text-[#2D3330]">{label}</h3>
                <p className="mt-2 text-2xl font-semibold text-[#1C4D3A]">
                  {Math.floor(Math.random() * 40) + 60}%
                </p>
                <p className="mt-1 text-[11px] text-[#6B6760]">Comparing top 10 matches</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <aside className="space-y-4">
        <Card className="border border-[#E8E6DD] bg-white/90 p-6">
          <h2 className="text-sm font-medium text-[#2D3330]">Guide</h2>
          <p className="mt-3 text-xs leading-relaxed text-[#6B6760]">
            Tune your profile to improve signal clarity. Preference sliders, persona balance, and
            branch emphasis update matches in real-time.
          </p>
          <Button variant="outline" size="sm" className="mt-4 rounded-full border-[#E8E6DD]">
            View matching preferences
          </Button>
        </Card>

        <Card className="border border-[#E8E6DD] bg-white/90 p-6">
          <h2 className="text-sm font-medium text-[#2D3330]">Quick snippets</h2>
          <div className="mt-4 space-y-3 text-xs text-[#6B6760]">
            <div className="rounded-xl bg-[#F7F6F1] px-3 py-2">
              How to calibrate empathy vs. velocity
            </div>
            <div className="rounded-xl bg-[#F7F6F1] px-3 py-2">Signal weighting walkthrough</div>
            <div className="rounded-xl bg-[#F7F6F1] px-3 py-2">Team vs. solo missions</div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function MatchCard({
  name,
  subtitle,
  score,
  tags,
}: {
  name: string;
  subtitle: string;
  score: string;
  tags: string[];
}) {
  return (
    <div className="rounded-2xl border border-[#E8E6DD] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#2D3330]">{name}</h3>
          <p className="mt-1 text-xs text-[#6B6760]">{subtitle}</p>
        </div>
        <Badge variant="secondary" className="rounded-full bg-[#1C4D3A]/10 text-xs text-[#1C4D3A]">
          {score} fit
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="rounded-full border-[#E8E6DD] text-[11px] text-[#4A5943]"
          >
            {tag}
          </Badge>
        ))}
      </div>
      <Button size="sm" className="mt-4 h-7 w-full rounded-full bg-[#1C4D3A] text-xs text-white">
        View match
      </Button>
    </div>
  );
}

function ProfilePanel() {
  return (
    <div className="px-6 py-8">
      <Card className="border border-[#E8E6DD] bg-white/90">
        <MatchingProfileSetup onSubmit={() => {}} initialPreferences={{ intensity: 'balanced' }} />
      </Card>
    </div>
  );
}

function AssignmentPanel() {
  return (
    <div className="px-6 py-8">
      <Card className="border border-[#E8E6DD] bg-white/90 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#2D3330]">Create assignment</h2>
            <p className="text-sm text-[#6B6760]">
              Shape a credible mission or project brief with transparent criteria.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full border-[#E8E6DD]">
            View drafts
          </Button>
        </header>
        <AssignmentBuilder />
      </Card>
    </div>
  );
}

function PreferenceToggle({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E8E6DD] bg-white/90 px-3 py-2">
      <span>{label}</span>
      <span
        className={`inline-flex h-5 w-9 items-center rounded-full border border-[#E8E6DD] ${value ? 'justify-end bg-[#1C4D3A]' : 'justify-start bg-white'} p-0.5 transition`}
      >
        <span className={`h-4 w-4 rounded-full ${value ? 'bg-white' : 'bg-[#E8E6DD]'}`} />
      </span>
    </div>
  );
}
