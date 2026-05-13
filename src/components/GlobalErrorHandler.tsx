'use client';

/**
 * Global Error Handler Component
 *
 * Catches unhandled errors and promise rejections at the window level
 * Prevents "[object Event]" and other cryptic errors from reaching users
 *
 * This runs on the client side and provides a safety net for any errors
 * that slip through component-level error boundaries.
 */

import { useEffect } from 'react';
import { getErrorMessage, logError } from '@/lib/error-handler';

async function showErrorToast(message: string) {
  const { toast } = await import('sonner');
  toast.error(message);
}

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      // Prevent default browser error handling
      event.preventDefault();

      // Extract error
      const error = event.error || event.message;

      // Log it properly
      logError('GlobalErrorHandler.unhandledError', error);

      // Show user-friendly message
      const message = getErrorMessage(error);

      // Only show toast if it's not already shown by component
      if (!message.includes('[object')) {
        void showErrorToast(message);
      } else {
        void showErrorToast('An unexpected error occurred. Please refresh the page.');
      }
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Prevent default browser handling
      event.preventDefault();

      // Extract reason
      const reason = event.reason;

      // Log it properly
      logError('GlobalErrorHandler.unhandledRejection', reason);

      // Show user-friendly message
      const message = getErrorMessage(reason);

      // Only show toast for non-navigation errors
      // (Next.js throws promise rejections for redirects which is normal)
      if (!message.includes('NEXT_REDIRECT') && !message.includes('NEXT_NOT_FOUND')) {
        if (!message.includes('[object')) {
          void showErrorToast(message);
        } else {
          void showErrorToast('An unexpected error occurred. Please try again.');
        }
      }
    };

    // Attach listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
