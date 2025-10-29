import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked = false, onCheckedChange, disabled, className, ...props }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
    const isControlled = typeof checked !== "undefined";
    const isOn = isControlled ? checked : uncontrolledChecked;

    const toggle = () => {
      if (disabled) return;
      const next = !isOn;
      if (!isControlled) {
        setUncontrolledChecked(next);
      }
      onCheckedChange?.(next);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isOn}
        onClick={toggle}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest disabled:cursor-not-allowed disabled:opacity-40",
          isOn ? "bg-proofound-forest" : "bg-proofound-stone/80",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
            isOn ? "translate-x-5" : "translate-x-1",
          )}
        />
      </button>
    );
  },
);

Switch.displayName = "Switch";


