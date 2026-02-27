import { ReactNode } from 'react';

// Core Application Types
export type PersonaKind = 'individual' | 'organization';
export type PageTemplate = 'dashboard' | 'profile' | 'workspace' | 'settings' | 'message';
export type SurfaceDensity = 'comfortable' | 'compact' | 'spacious';

// Header and Action Models
export interface HeaderAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  disabled?: boolean;
}

export interface MetricStripModel {
  id: string;
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  icon?: ReactNode;
}

export interface StatTileModel {
  id: string;
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  action?: HeaderAction;
}

export interface EmptyStateModel {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: HeaderAction;
  secondaryAction?: HeaderAction;
}
