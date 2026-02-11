'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
 * - Logs to console in development
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
    // Lazy-load Sentry so homepage bundles do not pay this cost upfront.
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
      .catch(() => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Sentry failed to load in ErrorBoundary');
        }
      });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with proper accessibility
      return (
        <div role="alert" aria-live="assertive">
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An error occurred while rendering this component. The error has been reported to our
                team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.props.showDetails && this.state.error && (
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
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
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Failed to load this section</p>
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
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
          <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Failed to load data</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            An error occurred while loading this data. The error has been reported.
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
