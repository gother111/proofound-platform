'use client';

import type { ReactNode } from 'react';
import { Shield, Eye, EyeOff, Info } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

type ConsentExplainerProps = {
  nowVisible: string[];
  hiddenUntilLater: string[];
  whyThisRequestExists: string;
  privacyNote?: string;
};

function ExplainerList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-black/5 bg-white/70 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ConsentExplainer({
  nowVisible,
  hiddenUntilLater,
  whyThisRequestExists,
  privacyNote,
}: ConsentExplainerProps) {
  return (
    <Card variant="flat" className="border border-[#D9E4DE] bg-[#F7FBF8]">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3 rounded-2xl border border-[#CFE0D8] bg-white/80 p-4">
          <Shield className="mt-0.5 h-5 w-5 text-[#1C4D3A]" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Blind-by-default still applies until you approve this step
            </p>
            <p className="text-sm text-muted-foreground">
              Public Page publication does not widen review-stage access on its own.
            </p>
            {privacyNote ? <p className="text-sm text-muted-foreground">{privacyNote}</p> : null}
          </div>
        </div>

        <ExplainerList
          title="What becomes visible now"
          icon={<Eye className="h-4 w-4 text-[#1C4D3A]" />}
          items={nowVisible}
        />

        <ExplainerList
          title="What stays hidden until interview coordination"
          icon={<EyeOff className="h-4 w-4 text-[#6B6760]" />}
          items={hiddenUntilLater}
        />

        <div className="rounded-2xl border border-[#E7D7C8] bg-[#FFF8F2] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="h-4 w-4 text-[#C76B4A]" />
            <span>Why this request exists</span>
          </div>
          <p className="text-sm text-muted-foreground">{whyThisRequestExists}</p>
        </div>
      </CardContent>
    </Card>
  );
}
