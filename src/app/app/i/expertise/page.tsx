'use client';

import { useState } from 'react';
import {
  capabilitySignals,
  growthTimeline,
  personaCopy,
  whyItMatters,
  type PersonaMode,
} from '@/data/expertise';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Globe2,
  Layers,
  LineChart,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

const personaOptions: { id: PersonaMode; label: string }[] = [
  { id: 'individual', label: 'Individual view' },
  { id: 'organization', label: 'Organization view' },
];

export default function ExpertiseAtlasPage() {
  const [persona, setPersona] = useState<PersonaMode>('individual');

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
        <Header persona={persona} onPersonaChange={setPersona} />
        <WhyItMatters />
        <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
          <CapabilitySignals persona={persona} />
          <ProofDensity />
        </div>
        <GrowthTimeline />
      </div>
    </div>
  );
}

function Header({
  persona,
  onPersonaChange,
}: {
  persona: PersonaMode;
  onPersonaChange: (value: PersonaMode) => void;
}) {
  const copy = personaCopy[persona];

  return (
    <Card className="relative overflow-hidden border border-[#D8D2C8] bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1C4D3A]/10 via-[#F7F6F1]/40 to-[#C76B4A]/10" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <Badge variant="outline" className="border-[#4A5943] text-[#4A5943]">
            Expertise Atlas · Beta
          </Badge>
          <h1 className="text-3xl font-semibold text-[#2D3330]">{copy.headline}</h1>
          <p className="text-sm text-[#6B6760]">{copy.description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-[#4A5943]">
            <span className="flex items-center gap-2 rounded-full bg-[#EEF1EA] px-3 py-1">
              <Users className="h-3.5 w-3.5" />
              Proof teams invited to co-curate
            </span>
            <span className="flex items-center gap-2 rounded-full bg-[#EEF1EA] px-3 py-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              Level 4+ proof sources highlighted
            </span>
          </div>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3 rounded-2xl border border-[#D8D2C8] bg-white/80 p-4 text-sm text-[#2D3330] shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#7A9278]">Persona</p>
          <div className="grid grid-cols-2 gap-2">
            {personaOptions.map((option) => (
              <Button
                key={option.id}
                size="sm"
                variant={option.id === persona ? 'default' : 'outline'}
                className={
                  option.id === persona
                    ? 'bg-[#4A5943] text-white shadow-sm'
                    : 'border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]'
                }
                onClick={() => onPersonaChange(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="rounded-xl bg-[#EEF1EA] p-3 text-xs text-[#4A5943]">
            <p>Next sync window:</p>
            <p className="font-medium">Auto-refreshes nightly via Supabase pipelines</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function WhyItMatters() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {whyItMatters.map((item) => (
        <Card
          key={item.title}
          className="border border-[#D8D2C8] bg-white/90 p-4 text-sm text-[#2D3330] shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3 text-lg">
            <span>{item.emoji}</span>
            <span className="font-semibold">{item.title}</span>
          </div>
          <p className="mt-3 text-sm text-[#6B6760]">{item.description}</p>
        </Card>
      ))}
    </section>
  );
}

function CapabilitySignals({ persona }: { persona: PersonaMode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#2D3330]">Capability signals</h2>
          <p className="text-sm text-[#6B6760]">
            Ranked by proof density, peer corroboration, and recency. Toggle persona view to see
            different calibrations.
          </p>
        </div>
        <Button variant="outline" className="border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]">
          Export proof map
        </Button>
      </div>
      <div className="space-y-4">
        {capabilitySignals.map((signal) => (
          <Card
            key={signal.id}
            className="border border-[#D8D2C8] bg-white/90 p-5 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#7A9278]">
                  <Compass className="h-3.5 w-3.5" />
                  {persona === 'individual' ? 'Personal scope' : 'Org network scope'}
                </div>
                <h3 className="text-lg font-semibold text-[#2D3330]">{signal.title}</h3>
                <p className="text-sm text-[#6B6760]">{signal.summary}</p>
                <p className="text-xs text-[#4A5943]">{signal.proof}</p>
              </div>
              <div className="flex w-32 flex-col items-end gap-3">
                <Badge variant="outline" className="border-[#4A5943] text-[#4A5943]">
                  Confidence {signal.confidence}/4
                </Badge>
                <Progress value={signal.confidence} max={4} indicatorClassName="bg-[#4A5943]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ProofDensity() {
  const stats = [
    {
      label: 'Proof vault entries',
      value: '328',
      detail: '+28 this quarter · 93% linked to verified sources',
      icon: Layers,
    },
    {
      label: 'Peer attestations',
      value: '57',
      detail: '12 new cross-coop endorsements · 0 outstanding disputes',
      icon: Users,
    },
    {
      label: 'External signal',
      value: 'Trust score 87',
      detail: 'Updated weekly · Weighted by verified impact outcomes',
      icon: Globe2,
    },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-[#2D3330]">Proof density snapshot</h2>
      <Card className="space-y-4 border border-[#D8D2C8] bg-white/90 p-5 shadow-sm">
        <div className="rounded-2xl bg-[#EEF1EA] p-4 text-sm text-[#4A5943]">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span>Trajectory: trending upward for three consecutive quarters</span>
          </div>
          <p className="mt-2 text-xs text-[#2D3330]">
            Confidence auto-adjusts based on Supabase verifications, archived artifacts, and manual
            curator notes.
          </p>
        </div>
        <div className="space-y-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-start gap-3 rounded-xl border border-[#D8D2C8] bg-white/90 p-3"
            >
              <stat.icon className="mt-1 h-5 w-5 text-[#4A5943]" />
              <div className="space-y-1 text-sm text-[#2D3330]">
                <p className="font-semibold">{stat.value}</p>
                <p className="text-xs uppercase tracking-wide text-[#7A9278]">{stat.label}</p>
                <p className="text-xs text-[#6B6760]">{stat.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full bg-[#4A5943] text-white hover:bg-[#3C4936]">
          Send briefing to leadership
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>
    </section>
  );
}

function GrowthTimeline() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#2D3330]">Growth & proof timeline</h2>
          <p className="text-sm text-[#6B6760]">
            Composite view across projects, mentorship, and community impact.
          </p>
        </div>
        <Button variant="ghost" className="text-[#4A5943]">
          View full log
        </Button>
      </div>
      <div className="space-y-4">
        {growthTimeline.map((moment) => (
          <Card
            key={moment.id}
            className="flex flex-col gap-2 border border-[#D8D2C8] bg-white/90 p-4 text-sm text-[#2D3330] shadow-sm lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[#4A5943]" />
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7A9278]">{moment.period}</p>
                <p className="font-semibold">{moment.focus}</p>
              </div>
            </div>
            <div className="max-w-xl text-sm text-[#6B6760]">{moment.highlight}</div>
            <div className="flex items-center gap-2 rounded-full bg-[#EEF1EA] px-3 py-1 text-xs text-[#4A5943]">
              <Target className="h-3.5 w-3.5" />
              {moment.sentiment}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
