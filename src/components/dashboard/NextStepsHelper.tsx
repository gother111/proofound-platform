'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Lightbulb } from 'lucide-react';

import { Button } from '@/components/ui/button';

type NextStepsHelperAction = {
  id?: string;
  title: string;
  description?: string | null;
  actionUrl?: string | null;
};

type NextStepsHelperProps = {
  actions: NextStepsHelperAction[];
  label?: string;
  description?: string;
  onActionSelect?: (actionId: string) => void;
};

export function NextStepsHelper({
  actions,
  label = 'Next steps',
  description = 'Open practical follow-up suggestions.',
  onActionSelect,
}: NextStepsHelperProps) {
  const helperId = useId();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const visibleActions = useMemo(() => actions.filter((action) => action.title.trim()), [actions]);

  if (visibleActions.length === 0) return null;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openHelper = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={openHelper}
      onMouseLeave={scheduleClose}
      onFocus={openHelper}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="touch"
        aria-expanded={open}
        aria-controls={helperId}
        aria-describedby={`${helperId}-description`}
        onClick={(event) => {
          clearCloseTimer();
          setOpen((current) => (event.detail === 0 ? true : !current));
        }}
        className="border-proofound-stone bg-white text-proofound-charcoal hover:border-proofound-forest/40 hover:bg-[#fbf8f1] motion-reduce:transition-none"
      >
        <Lightbulb className="h-4 w-4 text-proofound-forest" aria-hidden="true" />
        {label}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform motion-reduce:transition-none ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </Button>
      <span id={`${helperId}-description`} className="sr-only">
        {description}
      </span>

      {open ? (
        <div
          id={helperId}
          role="region"
          aria-label={label}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-proofound-stone/70 bg-white p-3 text-left shadow-lg motion-reduce:transition-none"
        >
          <ul className="grid gap-2">
            {visibleActions.map((action, index) => {
              const actionId = action.id || `${index}-${action.title}`;
              const content = (
                <>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-proofound-charcoal">
                      {action.title}
                    </span>
                    {action.description ? (
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {action.description}
                      </span>
                    ) : null}
                  </span>
                  {action.actionUrl ? (
                    <ArrowRight
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : null}
                </>
              );

              return (
                <li key={actionId}>
                  {action.actionUrl ? (
                    <a
                      href={action.actionUrl}
                      className="flex min-h-11 items-start justify-between gap-3 rounded-md border border-proofound-stone/60 bg-[#fbf8f1]/45 px-3 py-2 text-sm transition-colors hover:border-proofound-forest/40 hover:bg-[#fbf8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
                      onClick={() => onActionSelect?.(actionId)}
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="min-h-11 rounded-md border border-proofound-stone/60 bg-[#fbf8f1]/45 px-3 py-2 text-sm">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
