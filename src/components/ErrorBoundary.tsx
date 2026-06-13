'use client';

import React from 'react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component - React Error Handler
 *
 * Design Philosophy:
 * - Graceful degradation - app doesn't completely break
 * - Clear error messaging with actionable recovery options
 * - Automatic error reporting for monitoring
 *
 * Accessibility:
 * - Error messages use role="alert" for screen reader announcement
 * - Clear, descriptive text explains what happened
 * - Keyboard accessible retry button
 * - High contrast error indicators
 *
 * Error Handling:
 * - Catches JavaScript errors in child component tree
 * - Reports to Sentry for monitoring and debugging
 * - Emits local diagnostics in development
 * - Provides reset functionality
 *
 * UX Considerations:
 * - Users see a friendly message, not blank screen
 * - Retry button gives users control
 * - Error details shown only in development
 * - Visual hierarchy guides users to action
 *
 * Usage:
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Load Sentry only on the rare path where an error boundary actually catches an error.
    void import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      })
      .catch((reportingError) => {
        dispatchClientErrorDiagnostic('error_boundary.sentry_report_failed', reportingError);
      });

    // Emit local diagnostics in development without writing to the console.
    if (process.env.NODE_ENV === 'development') {
      dispatchClientErrorDiagnostic('error_boundary.caught', error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const canShowErrorDetails = this.props.showDetails && process.env.NODE_ENV === 'development';

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with proper accessibility
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-destructive/60 bg-background p-6 text-foreground shadow-sm"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                An error occurred while rendering this component. The error has been reported to our
                team.
              </p>
            </div>
            {canShowErrorDetails && this.state.error && (
              <div className="rounded-md bg-muted p-4">
                <p className="font-mono text-sm text-muted-foreground">
                  {this.state.error.name || 'Error'}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simplified Error Boundary for inline use
 *
 * Usage:
 * <InlineErrorBoundary>
 *   <MyComponent />
 * </InlineErrorBoundary>
 */
export function InlineErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Failed to load this section</p>
            <p className="text-sm text-muted-foreground">Please refresh and try again.</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary for form components
 * Shows a more compact error message suitable for forms
 */
export function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Something went wrong</p>
            <p className="text-sm text-destructive">
              An error occurred. Please refresh the page and try again.
            </p>
          </div>
        </div>
      }
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary for data tables and lists
 * Shows an error message with retry option
 */
export function DataErrorBoundary({
  children,
  onRetry,
}: {
  children: React.ReactNode;
  onRetry?: () => void;
}) {
  return (
    <ErrorBoundary
      onReset={onRetry}
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">Failed to load data</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            An error occurred while loading this data. The error has been reported.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Retry
            </button>
          )}
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
