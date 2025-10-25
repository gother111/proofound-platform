'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  zenPractices,
  localGatherings,
  supportChannels,
  toolkitFilters,
  type ZenPractice,
} from '@/data/zen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  Clock,
  Compass,
  Heart,
  MapPin,
  Moon,
  Sparkles,
  Sun,
  Users,
  Zap,
} from 'lucide-react';

const riskStates = [
  {
    id: 'normal',
    label: 'Steady nervous system',
    tone: 'bg-[#4A5943] text-white',
    description: 'Clear to focus · light check-ins only',
  },
  {
    id: 'elevated',
    label: 'Heightened alert',
    tone: 'bg-amber-600 text-white',
    description: 'Recommend 10 minute reset + breathing stack',
  },
  {
    id: 'high',
    label: 'Emergency support',
    tone: 'bg-rose-600 text-white',
    description: 'Pause deliverables · escalate to support team',
  },
] as const;

type RiskState = (typeof riskStates)[number]['id'];
type DeviceView = 'desktop' | 'mobile';

type FilterMode = 'all' | 'short' | 'long' | 'spiritual' | 'secular';

const filterMap: Record<FilterMode, (practice: ZenPractice) => boolean> = {
  all: () => true,
  short: (practice) => practice.time > 0 && practice.time <= 5,
  long: (practice) => practice.time > 5 && practice.time < 900,
  spiritual: (practice) => practice.isSpiritual,
  secular: (practice) => !practice.isSpiritual,
};

const filterFromLabel = (label: string): FilterMode => {
  const normalised = label.toLowerCase();
  if (normalised.includes('short')) return 'short';
  if (normalised.includes('long') || normalised.includes('deep')) return 'long';
  if (normalised.includes('spiritual')) return 'spiritual';
  if (normalised.includes('secular')) return 'secular';
  return 'all';
};

export default function ZenHubPage() {
  const [risk, setRisk] = useState<RiskState>('normal');
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [isDark, setIsDark] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterMode>('short');
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>(zenPractices[0]?.id ?? '');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    return () => document.documentElement.classList.remove('dark');
  }, [isDark]);

  const filteredPractices = useMemo(() => {
    const predicate = filterMap[activeFilter] ?? (() => true);
    return zenPractices.filter(predicate);
  }, [activeFilter]);

  const selectedPractice = useMemo(
    () => zenPractices.find((practice) => practice.id === selectedPracticeId) ?? zenPractices[0],
    [selectedPracticeId]
  );

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#2A2520' : '#F7F6F1' }}
    >
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
        <HeaderBar
          risk={risk}
          onRiskChange={setRisk}
          deviceView={deviceView}
          onDeviceViewChange={setDeviceView}
          isDark={isDark}
          onThemeToggle={() => setIsDark((prev) => !prev)}
        />

        <div className="grid gap-8 lg:grid-cols-[2fr,1.4fr]">
          <div className="space-y-8">
            <section className="space-y-4">
              <div>
                <Badge variant="outline" className="border-[#7A9278] text-[#4A5943]">
                  Zen Hub · Quiet tools to steady the mind
                </Badge>
                <h1 className="mt-4 text-3xl font-semibold text-[#2D3330] dark:text-[#E8E6DD]">
                  Your proof-backed nervous system kit
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#6B6760] dark:text-[#D8D2C8]">
                  Practices sized to the moment, grounded in research, and ready when the internet
                  gets loud.
                </p>
              </div>

              <div className="rounded-2xl border border-[#D8D2C8] bg-white/80 p-4 shadow-sm backdrop-blur lg:p-6 dark:border-[#3C332C] dark:bg-[#2F2823]/80">
                <ToolkitFilters
                  activeFilter={activeFilter}
                  onFilterChange={(value) => setActiveFilter(filterFromLabel(value))}
                />

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {filteredPractices.slice(0, 4).map((practice) => (
                    <QuickPracticeCard
                      key={practice.id}
                      practice={practice}
                      isActive={practice.id === selectedPractice?.id}
                      onSelect={() => setSelectedPracticeId(practice.id)}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#2D3330] dark:text-[#E8E6DD]">
                Local & virtual gatherings
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {localGatherings.map((gathering) => (
                  <Card
                    key={gathering.id}
                    className="border border-[#D8D2C8] bg-white/80 p-4 backdrop-blur dark:border-[#3C332C] dark:bg-[#2F2823]/70"
                  >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#7A9278]">
                      <MapPin className="h-3.5 w-3.5" />
                      {gathering.location}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-[#2D3330] dark:text-[#F2ECE3]">
                      {gathering.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#6B6760] dark:text-[#C9C2B8]">
                      {gathering.subtitle}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#4A5943] dark:text-[#CBE5CA]">
                      <Badge
                        variant="secondary"
                        className="bg-[#EEF1EA] text-[#4A5943] dark:bg-[#3F473B] dark:text-[#E8F2E4]"
                      >
                        {gathering.when}
                      </Badge>
                      <span>{gathering.host}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-[#6B6760] dark:text-[#D8D2C8]">
                        {gathering.spotsRemaining} spots open
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#4A5943] text-[#4A5943]"
                      >
                        RSVP
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <PracticeDetailCard practice={selectedPractice} risk={risk} />
            <SupportChannels />
          </aside>
        </div>
      </div>
    </div>
  );
}

function HeaderBar({
  risk,
  onRiskChange,
  deviceView,
  onDeviceViewChange,
  isDark,
  onThemeToggle,
}: {
  risk: RiskState;
  onRiskChange: (value: RiskState) => void;
  deviceView: DeviceView;
  onDeviceViewChange: (value: DeviceView) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <Card className="border border-[#D8D2C8] bg-white/80 p-4 backdrop-blur dark:border-[#3C332C] dark:bg-[#2F2823]/70">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-[#7A9278]">Risk signal (demo)</p>
            <p className="text-sm text-[#2D3330] dark:text-[#E8E6DD]">
              Choose the nervous system guidance that matches what you are feeling.
            </p>
          </div>
          <div className="flex gap-2">
            {riskStates.map((state) => (
              <button
                key={state.id}
                onClick={() => onRiskChange(state.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  risk === state.id
                    ? state.tone
                    : 'bg-[#EEF1EA] text-[#4A5943] hover:bg-[#E2E8DD] dark:bg-[#3C4539] dark:text-[#E2EDD9]'
                }`}
              >
                {state.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-[#6B6760] dark:text-[#C9C2B8]">
          {riskStates.find((state) => state.id === risk)?.description}
        </p>
      </Card>

      <div className="flex flex-col gap-4 lg:w-80">
        <Card className="border border-[#D8D2C8] bg-white/80 p-3 backdrop-blur dark:border-[#3C332C] dark:bg-[#2F2823]/70">
          <p className="text-xs uppercase tracking-wide text-[#7A9278]">View</p>
          <div className="mt-2 flex gap-2">
            {(['desktop', 'mobile'] as DeviceView[]).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={deviceView === option ? 'default' : 'outline'}
                className={
                  deviceView === option
                    ? 'bg-[#4A5943] text-white'
                    : 'border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]'
                }
                onClick={() => onDeviceViewChange(option)}
              >
                {option === 'desktop' ? 'Desktop' : 'Mobile'}
              </Button>
            ))}
          </div>
        </Card>
        <Card className="border border-[#D8D2C8] bg-white/80 p-3 backdrop-blur dark:border-[#3C332C] dark:bg-[#2F2823]/70">
          <p className="text-xs uppercase tracking-wide text-[#7A9278]">Theme</p>
          <div className="mt-2 flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onThemeToggle}
              className="flex items-center gap-2 border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{isDark ? 'Light' : 'Dark'} mode</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ToolkitFilters({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: FilterMode;
  onFilterChange: (label: string) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[#7A9278]">Filter toolkit</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {toolkitFilters.map((label) => {
          const isActive = activeFilter === filterFromLabel(label);
          return (
            <button
              key={label}
              onClick={() => onFilterChange(label)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                isActive
                  ? 'bg-[#4A5943] text-white shadow-sm'
                  : 'bg-[#EEF1EA] text-[#4A5943] hover:bg-[#E2E8DD]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickPracticeCard({
  practice,
  isActive,
  onSelect,
}: {
  practice: ZenPractice;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex h-full flex-col rounded-xl border p-4 text-left transition-all ${
        isActive
          ? 'border-[#4A5943] bg-[#EEF1EA] shadow-md'
          : 'border-[#D8D2C8] bg-white/80 hover:border-[#4A5943] dark:border-[#3C332C] dark:bg-[#2F2823]/80'
      }`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[#7A9278]">
        <span>{practice.duration}</span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          {practice.benefit}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-[#2D3330] dark:text-[#F2ECE3]">
        {practice.title}
      </h3>
      <p className="mt-2 text-sm text-[#6B6760] dark:text-[#C9C2B8] line-clamp-2">
        {practice.whatToExpect}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-[#4A5943] dark:text-[#CBE5CA]">
        <span>{practice.evidenceType.replace('-', ' ')} evidence</span>
        {isActive && <Check className="h-4 w-4" />}
      </div>
    </button>
  );
}

function PracticeDetailCard({
  practice,
  risk,
}: {
  practice: ZenPractice | undefined;
  risk: RiskState;
}) {
  if (!practice) return null;
  return (
    <Card className="space-y-4 border border-[#D8D2C8] bg-white/85 p-5 backdrop-blur dark:border-[#3C332C] dark:bg-[#2F2823]/75">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7A9278]">Featured practice</p>
          <h2 className="mt-1 text-xl font-semibold text-[#2D3330] dark:text-[#F2ECE3]">
            {practice.title}
          </h2>
          <p className="mt-1 text-sm text-[#6B6760] dark:text-[#C9C2B8]">{practice.whatToExpect}</p>
        </div>
        <Badge variant="outline" className="border-[#4A5943] text-[#4A5943]">
          {practice.duration}
        </Badge>
      </div>

      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#EEF1EA] text-[#4A5943]">
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>
        <TabsContent value="steps" className="mt-4 space-y-2">
          {practice.steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl bg-[#FDFCFA] p-3 text-sm text-[#2D3330] shadow-sm dark:bg-[#3A332E] dark:text-[#E8E1D8]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF1EA] text-xs font-semibold text-[#4A5943] dark:bg-[#3F473B] dark:text-[#D8E8D0]">
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </TabsContent>
        <TabsContent
          value="evidence"
          className="mt-4 space-y-3 text-sm text-[#2D3330] dark:text-[#E8E1D8]"
        >
          {practice.evidencePoints.map((point, index) => (
            <div key={index} className="flex items-start gap-3">
              <Zap className="mt-0.5 h-4 w-4 text-[#4A5943]" />
              <span>{point}</span>
            </div>
          ))}
          {practice.adverseNote && (
            <div className="flex items-start gap-3 text-xs text-[#B4584A] dark:text-[#F2B7A9]">
              <Heart className="mt-0.5 h-4 w-4" />
              <span>{practice.adverseNote}</span>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="grid gap-3 rounded-xl bg-[#EEF1EA] p-3 text-sm text-[#4A5943] dark:bg-[#3F473B] dark:text-[#E2EDD9]">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{practice.isThirdParty ? 'Third-party partner' : 'Proofound guided'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4" />
          <span>
            {practice.style} practice · goal: {practice.goal}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {risk === 'high'
              ? 'Extend to 10 minutes and notify support contact.'
              : risk === 'elevated'
                ? 'Pair with grounded movement or a short walk.'
                : 'Return to work gently. Save progress to proof vault.'}
          </span>
        </div>
      </div>
    </Card>
  );
}

function SupportChannels() {
  return (
    <Card className="space-y-4 border border-[#D8D2C8] bg-white/85 p-5 backdrop-blur dark:border-[#3C332C] dark:bg-[#2F2823]/75">
      <div className="flex items-center gap-2 text-[#4A5943]">
        <Heart className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Support network</h3>
      </div>
      <div className="space-y-3">
        {supportChannels.map((channel) => (
          <div
            key={channel.id}
            className="rounded-xl border border-[#D8D2C8] bg-[#FDFCFA] p-3 text-sm text-[#2D3330] transition-colors hover:border-[#4A5943] dark:border-[#3C332C] dark:bg-[#3A332E] dark:text-[#E8E1D8]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{channel.label}</p>
                <p className="text-xs text-[#6B6760] dark:text-[#C9C2B8]">{channel.description}</p>
              </div>
              <span className="text-xs font-medium text-[#4A5943] dark:text-[#CBE5CA]">
                {channel.contact}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
