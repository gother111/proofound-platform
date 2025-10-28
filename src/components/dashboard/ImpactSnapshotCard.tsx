import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ImpactSnapshotCard() {
  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm" style={{ color: '#2D3330' }}>
          Impact
        </h5>
      </div>
      <div className="text-center py-6">
        <TrendingUp className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
        <p className="text-xs" style={{ color: '#6B6760' }}>
          Track your impact as you grow.
        </p>
      </div>
    </Card>
  );
}
