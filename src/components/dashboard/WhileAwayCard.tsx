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
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
          {title}
        </h5>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/50 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" style={{ color: '#6B6760' }} />
        </button>
      </div>
      {/* Update items would go here when API returns data */}
      <div className="space-y-2">
        {updates.map((update, idx) => (
          <div key={idx} className="text-sm">
            {update.text}
          </div>
        ))}
      </div>
    </Card>
  );
}
