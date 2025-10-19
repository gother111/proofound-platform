import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface CustomizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const widgets = [
  'Goals overview',
  'Recent activity',
  'Matching suggestions',
  'Upcoming deadlines',
  'Impact metrics',
];

export function CustomizeModal({ open, onOpenChange }: CustomizeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize (coming soon)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Select which widgets to show on your dashboard
        </p>
        <div className="space-y-3 mt-4">
          {widgets.map((widget) => (
            <div key={widget} className="flex items-center gap-3">
              <Checkbox disabled id={widget} />
              <label htmlFor={widget} className="text-sm text-muted-foreground cursor-not-allowed">
                {widget}
              </label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
