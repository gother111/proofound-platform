import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ImpactSnapshotCard() {
  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <h5 className="text-sm font-medium mb-3" style={{ color: '#2D3330' }}>
        Impact
      </h5>
      <div className="text-center py-6">
        <TrendingUp className="w-10 h-10 mx-auto mb-2 text-muted" />
        <p className="text-xs text-muted-foreground">Track your impact as you grow.</p>
      </div>
    </Card>
  );
}
