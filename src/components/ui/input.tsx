'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Input Component - Text Input Field
 *
 * Design Philosophy:
 * - Clean, minimal styling with focus on readability
 * - Border becomes more prominent on focus to show active state
 * - Validation states use color + icons for accessibility
 *
 * Accessibility:
 * - Minimum 44px touch target height (WCAG 2.5.5)
 * - Label association via htmlFor/id required for all inputs
 * - Error/helper text linked via aria-describedby
 * - Error state communicated via aria-invalid
 * - Success state shows checkmark icon
 * - Focus ring clearly visible (2px ring + border color change)
 * - Disabled state properly communicated to assistive tech
 *
 * Responsive:
 * - Text size scales appropriately (16px base prevents zoom on iOS)
 * - Full width by default, can be constrained by parent
 *
 * Animation:
 * - Smooth transition on focus (200ms)
 * - Error/success states fade in smoothly
 *
 * Validation States:
 * - Default: Neutral border color
 * - Error: Red border + error icon + helper text
 * - Success: Green border + checkmark icon (optional)
 * - Disabled: Reduced opacity + not-allowed cursor
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message to display below input */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Success state - shows checkmark icon */
  success?: boolean;
  /** Character limit for the input */
  maxLength?: number;
  /** Show character counter */
  showCounter?: boolean;
  /** Label for the input (for better form structure) */
  label?: string;
  /** Whether label is required */
  isRequired?: boolean;
  /** Allow clearing the input */
  clearable?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      helperText,
      success,
      maxLength,
      showCounter,
      label,
      isRequired,
      clearable,
      onClear,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || '');
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Track value for counter
    const currentValue = value !== undefined ? value : internalValue;
    const valueLength = String(currentValue).length;

    // Determine validation state classes
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const inputClasses = cn(
      'flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-base text-foreground transition-all duration-300 hover:border-border/80',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-muted-foreground/70',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-proofound-parchment',
      // Default state
      !hasError &&
        !hasSuccess &&
        'border-border focus-visible:ring-ring focus-visible:border-primary',
      // Error state
      hasError &&
        'border-destructive focus-visible:ring-destructive focus-visible:border-destructive',
      // Success state
      hasSuccess && 'border-success focus-visible:ring-success focus-visible:border-success',
      // Dark mode
      'dark:border-border dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground dark:focus-visible:ring-primary',
      className
    );

    const handleClear = () => {
      if (onClear) {
        onClear();
      }
      // Also update internal state if controlled
      setInternalValue('');
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {isRequired && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper for icons */}
        <div className="relative">
          <input
            type={type}
            id={inputId}
            className={inputClasses}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            maxLength={maxLength}
            value={value}
            onChange={(e) => {
              setInternalValue(e.target.value);
              props.onChange?.(e);
            }}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Clear button */}
            {clearable && currentValue && !props.disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-proofound-charcoal transition-colors"
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Error icon */}
            {hasError && <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />}

            {/* Success icon */}
            {hasSuccess && <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
          </div>
        </div>

        {/* Helper/Error text and counter */}
        <div className="mt-1.5 flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Error message */}
            {hasError && (
              <p
                id={errorId}
                className="text-sm text-destructive flex items-start gap-1.5"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            {/* Helper text */}
            {!hasError && helperText && (
              <p id={helperId} className="text-sm text-muted-foreground dark:text-muted-foreground">
                {helperText}
              </p>
            )}
          </div>

          {/* Character counter */}
          {showCounter && maxLength && (
            <p
              className={cn(
                'text-sm tabular-nums',
                valueLength > maxLength * 0.9 ? 'text-destructive' : 'text-muted-foreground'
              )}
              aria-live="polite"
            >
              {valueLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
