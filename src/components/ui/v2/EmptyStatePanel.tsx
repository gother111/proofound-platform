import React from 'react';
import { cn } from '@/lib/utils';
import { EmptyStateModel } from '@/lib/ui/v2/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStatePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  model: EmptyStateModel;
  compact?: boolean;
}

export function EmptyStatePanel({
  model,
  compact = false,
  className,
  ...props
}: EmptyStatePanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-proofound-stone bg-white/50 w-full',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
      {...props}
    >
      {model.icon && (
        <div
          className={cn(
            'bg-proofound-stone/30 rounded-full flex items-center justify-center text-proofound-forest/70 mb-4',
            compact ? 'w-12 h-12' : 'w-16 h-16'
          )}
        >
          {React.cloneElement(model.icon as React.ReactElement, {
            className: compact ? 'w-6 h-6' : 'w-8 h-8',
          })}
        </div>
      )}

      <h3
        className={cn(
          'font-medium text-proofound-charcoal mb-2',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        {model.title}
      </h3>

      <p className="text-sm text-muted-foreground max-w-sm mb-6">{model.description}</p>

      {(model.action || model.secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {model.action &&
            (model.action.href ? (
              <Button asChild onClick={model.action.onClick} disabled={model.action.disabled}>
                <Link href={model.action.href}>
                  {model.action.icon && <span className="mr-2">{model.action.icon}</span>}
                  {model.action.label}
                </Link>
              </Button>
            ) : (
              <Button onClick={model.action.onClick} disabled={model.action.disabled}>
                {model.action.icon && <span className="mr-2">{model.action.icon}</span>}
                {model.action.label}
              </Button>
            ))}

          {model.secondaryAction &&
            (model.secondaryAction.href ? (
              <Button
                variant="outline"
                asChild
                onClick={model.secondaryAction.onClick}
                disabled={model.secondaryAction.disabled}
              >
                <Link href={model.secondaryAction.href}>
                  {model.secondaryAction.icon && (
                    <span className="mr-2">{model.secondaryAction.icon}</span>
                  )}
                  {model.secondaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={model.secondaryAction.onClick}
                disabled={model.secondaryAction.disabled}
              >
                {model.secondaryAction.icon && (
                  <span className="mr-2">{model.secondaryAction.icon}</span>
                )}
                {model.secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
