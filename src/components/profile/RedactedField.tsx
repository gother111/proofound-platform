'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';

interface RedactedFieldProps {
  value?: string | null;
  label: string;
  isVisible: boolean;
  redactionReason?: 'private' | 'match_only' | 'link_only';
  className?: string;
  fallbackText?: string;
}

/**
 * Display a field that might be redacted based on visibility settings
 *
 * If isVisible=false, shows a redaction message instead of the value
 */
export function RedactedField({
  value,
  label,
  isVisible,
  redactionReason,
  className = '',
  fallbackText = 'Not provided',
}: RedactedFieldProps) {
  if (!isVisible) {
    const messages = {
      private: 'This field is private',
      match_only: 'Visible in assignment review only when reveal rules allow it',
      link_only: 'Visible with profile link only',
    };

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Lock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground italic">
          {redactionReason ? messages[redactionReason] : 'Hidden'}
        </span>
      </div>
    );
  }

  if (!value) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-muted-foreground italic">{fallbackText}</span>
      </div>
    );
  }

  return <div className={className}>{value}</div>;
}

/**
 * Display a field value or redacted placeholder
 * Simpler version without icons
 */
export function RedactedText({
  value,
  isVisible,
  fallback = '•••',
}: {
  value?: string | null;
  isVisible: boolean;
  fallback?: string;
}) {
  if (!isVisible) {
    return <span className="text-muted-foreground italic">{fallback}</span>;
  }

  if (!value) {
    return <span className="text-muted-foreground italic">—</span>;
  }

  return <span>{value}</span>;
}

/**
 * Badge indicating field visibility level
 */
export function VisibilityBadge({
  level,
  size = 'sm',
}: {
  level: 'public' | 'link_only' | 'match_only' | 'private';
  size?: 'sm' | 'md';
}) {
  const configs = {
    public: {
      icon: Eye,
      label: 'Public',
      color: 'bg-green-100 text-green-700',
    },
    link_only: {
      icon: EyeOff,
      label: 'Link Only',
      color: 'bg-blue-100 text-blue-700',
    },
    match_only: {
      icon: EyeOff,
      label: 'Match Only',
      color: 'bg-amber-100 text-amber-700',
    },
    private: {
      icon: Lock,
      label: 'Private',
      color: 'bg-muted text-muted-foreground',
    },
  };

  const config = configs[level];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${config.color} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}
