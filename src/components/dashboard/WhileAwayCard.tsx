'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';

const titles = [
  'While you were away making impact',
  'While you were out doing real-world things',
  'Meanwhile, the internet was busy…',
];

export function WhileAwayCard() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [title] = useState(() => titles[Math.floor(Math.random() * titles.length)]);

  useEffect(() => {
    fetch('/api/updates')
      .then((res) => res.json())
      .then((data) => setUpdates(data.updates || []))
      .catch(() => setUpdates([]));
  }, []);

  // Don't render if no updates or dismissed
  if (updates.length === 0 || dismissed) return null;

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
            {update.text}
          </div>
        ))}
      </div>
    </Card>
  );
}
