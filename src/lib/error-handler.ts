/**
 * Global Error Handler Utilities
 *
 * Provides safe error message extraction and formatting.
 * Prevents "[object Event]" and other cryptic error messages.
 *
 * Purpose: Convert any error type into a user-friendly message
 */

/**
 * Extract a readable error message from any error type
 * Handles: Error objects, Event objects, strings, unknown types
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return 'An unexpected error occurred';
  }

  // Handle Event objects (the main culprit of "[object Event]")
  if (error instanceof Event) {
    // Extract useful info from the event
    const eventType = error.type || 'unknown';
    const target = error.target;

    // Try to get more context
    if (target && 'status' in target) {
      return `Network error during ${eventType} (status: ${(target as any).status})`;
    }

    return `A ${eventType} error occurred`;
  }

  // Handle Error objects (standard JavaScript errors)
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with error/message properties
  if (typeof error === 'object') {
    const err = error as any;

    // Try common error property names
    if (err.message && typeof err.message === 'string') {
      return err.message;
    }

    if (err.error && typeof err.error === 'string') {
      return err.error;
    }

    if (err.statusText && typeof err.statusText === 'string') {
      return err.statusText;
    }
  }

  // Last resort: generic message
  return 'An unexpected error occurred';
}

/**
 * Safe error diagnostic dispatch.
 * Converts Event objects to readable format before reporting.
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);

  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent('proofound:client-diagnostic', {
        detail: {
          reason: 'global_error_handler.error',
          context,
          error: message,
          includeOriginalType: process.env.NODE_ENV === 'development',
          originalType:
            process.env.NODE_ENV === 'development'
              ? error instanceof Error
                ? error.name
                : typeof error
              : undefined,
        },
      })
    );
  } catch {
    // Diagnostics must never affect the user flow.
  }
}

/**
 * Create a safe error message for user display
 * Includes a fallback message for better UX
 */
export function getUserErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const message = getErrorMessage(error);

  // Return fallback if message is too generic
  if (
    message === 'An unexpected error occurred' ||
    message === 'Unknown error' ||
    message === 'Error'
  ) {
    return fallback;
  }

  return message;
}

/**
 * Safe error handler for async functions
 * Use in catch blocks to ensure errors are properly formatted
 */
export function handleAsyncError(
  context: string,
  error: unknown
): {
  message: string;
  shouldRetry: boolean;
} {
  logError(context, error);

  const message = getUserErrorMessage(error);

  // Determine if error is retryable (network errors, timeouts, etc.)
  const shouldRetry =
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('connection');

  return { message, shouldRetry };
}
