/**
 * Dashboard Tile Component (Sortable)
 *
 * Individual draggable tile for dashboard customization
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface DashboardTileProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  visible: boolean;
  onToggleVisibility: () => void;
}

export function DashboardTile({
  id,
  title,
  description,
  icon,
  visible,
  onToggleVisibility,
}: DashboardTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-white border border-proofound-stone rounded-lg hover:border-proofound-forest transition-colors"
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={visible}
          onCheckedChange={onToggleVisibility}
          aria-label={`Toggle ${title} visibility`}
        />
        {visible ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
