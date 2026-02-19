'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { MomentumSummary } from '@/lib/momentum/types';

const titles = [
  'While you were away making impact',
  'While you were out doing real-world things',
  'Meanwhile, momentum kept moving',
];

interface WhileAwayCardProps {
  persona?: 'individual' | 'organization';
  orgRef?: string;
}

export function WhileAwayCard({ persona = 'individual', orgRef }: WhileAwayCardProps) {
  const [updates, setUpdates] = useState<Array<{ text: string; actionUrl?: string }>>([]);
  const [dismissed, setDismissed] = useState(false);
  const [title] = useState(() => titles[Math.floor(Math.random() * titles.length)]);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ persona, limit: '6' });
        if (orgRef) params.set('org', orgRef);

        const response = await fetch(`/api/updates?${params.toString()}`, { cache: 'no-store' });
        const payload = await response.json();

        const eventUpdates = (payload.updates || []).map((item: any) => ({
          text: item.text,
          actionUrl: item.actionUrl,
        }));

        if (eventUpdates.length > 0) {
          setUpdates(eventUpdates);
          return;
        }

        const summaryResponse = await fetch(`/api/momentum/summary?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!summaryResponse.ok) {
          setUpdates([]);
          return;
        }

        const summary = (await summaryResponse.json()) as MomentumSummary;
        const actionUpdates = (summary.topActions || []).map((action) => ({
          text: action.title,
          actionUrl: action.actionUrl,
        }));
        setUpdates(actionUpdates);
      } catch {
        setUpdates([]);
      }
    }

    load();
  }, [persona, orgRef]);

  const hasContent = useMemo(() => updates.length > 0 && !dismissed, [updates.length, dismissed]);

  if (!hasContent) return null;

  return (
    <Card
      className="p-4 border"
      style={{
        borderColor: 'rgba(124, 146, 120, 0.4)',
        backgroundColor: 'rgba(122, 146, 120, 0.08)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm" style={{ color: '#2D3330' }}>
          {title}
        </h4>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 hover:bg-white/50 rounded"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" style={{ color: '#2D3330' }} />
        </button>
      </div>
      <div className="space-y-2">
        {updates.map((update, idx) => (
          <div key={idx} className="text-xs" style={{ color: '#2D3330' }}>
            {update.actionUrl ? (
              <Link href={update.actionUrl} className="hover:underline">
                {update.text}
              </Link>
            ) : (
              update.text
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
