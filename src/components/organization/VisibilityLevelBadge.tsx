'use client';

import { Badge } from '@/components/ui/badge';
import { Globe, Users, MessageCircle, Lock } from 'lucide-react';

interface VisibilityLevelBadgeProps {
  level: 'public' | 'post_match' | 'post_conversation_start' | 'internal_only';
  showLabel?: boolean;
}

const VISIBILITY_CONFIG = {
  public: {
    label: 'Public',
    icon: Globe,
    color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400',
    description: 'Visible to anyone',
  },
  post_match: {
    label: 'Post-Match',
    icon: Users,
    color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400',
    description: 'Visible after matching',
  },
  post_conversation_start: {
    label: 'Post-Conversation',
    icon: MessageCircle,
    color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400',
    description: 'Visible after conversation starts',
  },
  internal_only: {
    label: 'Internal Only',
    icon: Lock,
    color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400',
    description: 'Visible to org members only',
  },
};

export function VisibilityLevelBadge({ level, showLabel = true }: VisibilityLevelBadgeProps) {
  const config = VISIBILITY_CONFIG[level];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}

export function getVisibilityDescription(level: string): string {
  return VISIBILITY_CONFIG[level as keyof typeof VISIBILITY_CONFIG]?.description || 'Unknown';
}

