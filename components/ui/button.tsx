import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-250 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[#4A5943] text-white hover:bg-[#4A5943]/90 dark:bg-[#D4C4A8] dark:text-[#1A1D2E] dark:hover:bg-[#D4784F] dark:hover:shadow-[0_0_24px_rgba(212,120,79,0.30)] shadow-sm",
        destructive:
          "bg-[#A85C4F] text-white hover:bg-[#A85C4F]/90 shadow-sm dark:bg-[#D4826F]/60",
        outline:
          "border-2 border-input bg-background hover:bg-[#E8E4DC] hover:text-accent-foreground dark:bg-card/80 dark:border-border dark:hover:bg-card dark:hover:border-[rgba(212,120,79,0.30)]",
        secondary:
          "bg-[#D4C5B0] text-[#2C2A27] hover:bg-[#D4C5B0]/80 dark:bg-[#C86B4A] dark:text-white dark:hover:bg-[rgba(212,120,79,0.15)] dark:hover:border-[rgba(212,120,79,0.50)] dark:hover:text-[#D4784F]",
        ghost:
          "hover:bg-[#E8E4DC] hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline dark:hover:text-[#D4784F]",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 py-2 text-xs rounded-md",
        lg: "h-12 px-8 py-3 text-base rounded-lg",
        icon: "h-11 w-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
