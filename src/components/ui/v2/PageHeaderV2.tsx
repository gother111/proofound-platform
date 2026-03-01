import React from 'react';
import { cn } from '@/lib/utils';
import { HeaderAction } from '@/lib/ui/v2/types';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderV2Props {
  title: string;
  description?: string;
  icon?: LucideIcon;
  primaryAction?: HeaderAction;
  secondaryActions?: HeaderAction[];
  className?: string;
}

export function PageHeaderV2({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryActions = [],
  className,
}: PageHeaderV2Props) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-start justify-between gap-4 w-full',
        className
      )}
    >
      <div className="flex gap-4">
        {Icon && (
          <div className="mt-1 flex-shrink-0 bg-card p-2.5 rounded-xl border border-border shadow-sm h-fit">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {(primaryAction || secondaryActions.length > 0) && (
        <div className="flex items-center gap-2 mt-2 md:mt-0 flex-wrap">
          {secondaryActions.map((action) => {
            if (action.href) {
              return (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  asChild
                  disabled={action.disabled}
                >
                  <Link href={action.href}>
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </Link>
                </Button>
              );
            }
            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            );
          })}

          {primaryAction &&
            (primaryAction.href ? (
              <Button
                variant={primaryAction.variant || 'default'}
                size="sm"
                asChild
                disabled={primaryAction.disabled}
              >
                <Link href={primaryAction.href}>
                  {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
                  {primaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                variant={primaryAction.variant || 'default'}
                size="sm"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
                {primaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
