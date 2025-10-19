import { FolderKanban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ProjectsCard() {
  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <h5 className="text-sm font-medium mb-3" style={{ color: '#2D3330' }}>
        Projects
      </h5>
      <div className="text-center py-6">
        <FolderKanban className="w-10 h-10 mx-auto mb-2 text-muted" />
        <p className="text-xs mb-3 text-muted-foreground">No active projects yet.</p>
        <Button size="sm" className="h-7 text-xs">
          Explore
        </Button>
      </div>
    </Card>
  );
}
