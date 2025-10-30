import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-proofound-stone/70 bg-white px-4 py-3 text-sm text-proofound-charcoal placeholder:text-proofound-charcoal/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";


