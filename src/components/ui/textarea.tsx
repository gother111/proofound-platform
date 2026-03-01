import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-proofound-stone bg-white px-3 py-2 text-base text-foreground transition-all duration-300 hover:border-proofound-stone/80 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground dark:focus-visible:ring-primary',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
