import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[#E8E6DD] bg-white px-3 py-2 text-base text-[#2D3330] transition-colors placeholder:text-[#9B9891] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:border-[#1C4D3A] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#D4C4A8]/10 dark:bg-[#2C3244] dark:text-[#E8DCC4] dark:placeholder:text-[#6B6760] dark:focus-visible:ring-[#D4C4A8]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }


