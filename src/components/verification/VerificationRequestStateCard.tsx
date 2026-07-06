'use client';

import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface VerificationRequestStateCardProps {
  title: string;
  message: string;
  Icon: LucideIcon;
  iconClassName: string;
  iconBgClassName: string;
  stateNote: string;
  guidance: string;
  actionLabel: string;
  onAction: () => void;
  maxWidthClassName?: string;
  noticeRole?: 'alert' | 'status';
}

export function VerificationRequestStateCard({
  title,
  message,
  Icon,
  iconClassName,
  iconBgClassName,
  stateNote,
  guidance,
  actionLabel,
  onAction,
  maxWidthClassName = 'max-w-lg',
  noticeRole = 'status',
}: VerificationRequestStateCardProps) {
  const ariaLive = noticeRole === 'alert' ? 'assertive' : 'polite';

  return (
    <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
      <Card
        className={`w-full ${maxWidthClassName} rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]`}
      >
        <CardContent className="space-y-4 pb-12 pt-12 text-center">
          <span
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBgClassName}`}
          >
            <Icon className={`h-6 w-6 ${iconClassName}`} />
          </span>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal">
              {title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          </div>
          <div
            role={noticeRole}
            aria-live={ariaLive}
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-950"
          >
            <p className="font-semibold">{stateNote}</p>
            <p className="mt-1">{guidance}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={onAction}>
            {actionLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
