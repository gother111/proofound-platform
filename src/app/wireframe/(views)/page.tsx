'use client';

import { useState } from 'react';
import { EnhancedJapandiWireframe } from '@/components/wireframe/EnhancedJapandiWireframe';
import { VisualArtifacts } from '@/components/wireframe/VisualArtifacts';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LayoutTemplate, Palette, Sparkles, Users } from 'lucide-react';

const VIEWS = [
  { id: 'landing', label: 'Landing', icon: Sparkles },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'matching', label: 'Matching', icon: Users },
  { id: 'expertise', label: 'Expertise', icon: Palette },
  { id: 'assets', label: 'Artifacts', icon: LayoutTemplate },
] as const;

type ViewId = (typeof VIEWS)[number]['id'];

export default function WireframeIndexPage() {
  const [view, setView] = useState<ViewId>('landing');

  return (
    <div className="relative">
      <TopSwitcher current={view} onChange={setView} />
      <main>
        {view === 'landing' && <EnhancedJapandiWireframe />}
        {view === 'assets' && <VisualArtifacts />}
        {view !== 'landing' && view !== 'assets' && (
          <Placeholder label={VIEWS.find((v) => v.id === view)?.label ?? view} />
        )}
      </main>
    </div>
  );
}

function TopSwitcher({
  current,
  onChange,
}: {
  current: ViewId;
  onChange: (value: ViewId) => void;
}) {
  return (
    <div className="fixed inset-x-0 top-6 z-50 flex justify-center">
      <div className="flex gap-2 rounded-full border border-[#2C2A27]/10 bg-white/80 p-2 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#251F1B]/80">
        {VIEWS.map((view) => {
          const Icon = view.icon;
          const active = current === view.id;
          return (
            <Button
              key={view.id}
              size="sm"
              variant={active ? 'default' : 'ghost'}
              className={`rounded-full px-4 ${active ? 'bg-[#4A5943] text-white hover:bg-[#4A5943]/90' : 'text-[#2C2A27]/70 dark:text-[#E8E6DD]/70'}`}
              onClick={() => onChange(view.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#F5F3EE] px-6 py-32 text-center text-[#2C2A27]/70 dark:bg-[#1F1A16] dark:text-[#E8E6DD]/60">
      <div className="max-w-xl space-y-4">
        <h1 className="text-4xl font-semibold">{label} wireframe</h1>
        <p>
          This section will host the {label.toLowerCase()} view from the Figma wireframe. We&apos;ll
          bring over the dashboard, matching, expertise atlas, and zen hub experiences next.
        </p>
      </div>
    </section>
  );
}
