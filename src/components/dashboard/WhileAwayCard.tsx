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
    <Card className="p-4 border border-brand-sage/40 dark:border-brand-sage/20 bg-brand-sage/8 dark:bg-brand-sage/5 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-['Crimson_Pro'] font-medium text-proofound-charcoal dark:text-foreground">
          {title}
        </h5>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/50 dark:hover:bg-card/50 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-proofound-charcoal/70 dark:text-muted-foreground" />
        </button>
      </div>
      {/* Update items would go here when API returns data */}
      <div className="space-y-2">
        {updates.map((update, idx) => (
          <div key={idx} className="text-sm text-proofound-charcoal dark:text-foreground">
            {update.text}
          </div>
        ))}
      </div>
    </Card>
  );
}
