import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TeamRolesCard() {
  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <h5 className="text-sm font-medium mb-3" style={{ color: '#2D3330' }}>
        Team
      </h5>
      <div className="text-center py-6">
        <Users className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
        <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
          Build your team.
        </p>
        <Button
          size="sm"
          className="h-7 text-xs"
          style={{ backgroundColor: '#1C4D3A', color: '#F7F6F1' }}
        >
          Add members
        </Button>
      </div>
    </Card>
  );
}
