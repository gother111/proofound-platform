/**
 * ProofoundToaster - Toast notification system
 *
 * Configured with Proofound's Japandi design system.
 * Import this once in your root layout.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * import { ProofoundToaster } from '@/components/common/Toaster';
 *
 * export default function Layout() {
 *   return (
 *     <>
 *       <YourApp />
 *       <ProofoundToaster />
 *     </>
 *   );
 * }
 *
 * // Anywhere in your app
 * import { showToast } from '@/components/common/Toaster';
 *
 * showToast.success('Profile updated successfully!');
 * showToast.error('Failed to save changes');
 * showToast.info('New match found');
 * ```
 */

import { Toaster } from 'sonner';
import { colors, shadows, typography, componentDimensions, borderRadius } from '@/lib/design-tokens';

export function ProofoundToaster() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          background: colors.surfaces.white,
          color: colors.text.primary,
          border: `1px solid ${colors.brand.stone}`,
          boxShadow: shadows.lg,
          fontSize: typography.sizes.sm,
          fontFamily: typography.fonts.body,
          borderRadius: borderRadius.md,
          padding: componentDimensions.toast.padding,
        },
        className: 'proofound-toast',
        duration: 4000,

        // Custom classNames for different toast types
        classNames: {
          success: 'proofound-toast-success',
          error: 'proofound-toast-error',
          warning: 'proofound-toast-warning',
          info: 'proofound-toast-info',
        },
      }}
    />
  );
}

/**
 * Dark mode toaster (automatically applied via CSS)
 */
export function ProofoundToasterDark() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        style: {
          background: colors.dark.surface,
          color: colors.dark.text.primary,
          border: `1px solid ${colors.dark.border}`,
          boxShadow: shadows.dark.lg,
          fontSize: typography.sizes.sm,
          fontFamily: typography.fonts.body,
          borderRadius: borderRadius.md,
          padding: componentDimensions.toast.padding,
        },
        duration: 4000,
      }}
    />
  );
}

/**
 * Helper functions for common toast patterns
 */
import { toast } from 'sonner';

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      style: {
        border: `1px solid ${colors.extended.sage}`,
      }
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      style: {
        border: `1px solid ${colors.brand.terracotta}`,
      }
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      style: {
        border: `1px solid ${colors.extended.ochre}`,
      }
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      style: {
        border: `1px solid ${colors.extended.teal}`,
      }
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  // Custom toast with action
  withAction: (
    message: string,
    actionLabel: string,
    onAction: () => void,
    description?: string
  ) => {
    toast(message, {
      description,
      action: {
        label: actionLabel,
        onClick: onAction,
      },
    });
  },

  // Loading toast (returns ID for manual dismissal)
  loading: (message: string) => {
    return toast.loading(message);
  },

  // Dismiss a specific toast
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

/**
 * Common toast messages for Proofound
 */
export const toastMessages = {
  // Profile
  profileUpdated: () => showToast.success('Profile updated successfully'),
  profileUpdateFailed: () => showToast.error('Failed to update profile', 'Please try again'),

  // Matching
  matchSaved: () => showToast.success('Match saved to your list'),
  matchRemoved: () => showToast.info('Match removed from your list'),

  // Assignments
  assignmentCreated: () => showToast.success('Assignment created successfully'),
  assignmentUpdated: () => showToast.success('Assignment updated'),
  assignmentDeleted: () => showToast.success('Assignment deleted'),

  // Promo codes
  promoCodeApplied: (code: string) =>
    showToast.success('Promo code applied', `Code "${code}" has been applied to your account`),
  promoCodeInvalid: () =>
    showToast.error('Invalid promo code', 'Please check the code and try again'),

  // Settings
  settingsSaved: () => showToast.success('Settings saved'),
  settingsFailed: () => showToast.error('Failed to save settings'),

  // Authentication
  signInSuccess: (name: string) => showToast.success(`Welcome back, ${name}!`),
  signOutSuccess: () => showToast.success('Signed out successfully'),
  passwordChanged: () => showToast.success('Password updated successfully'),

  // Errors
  networkError: () =>
    showToast.error('Connection error', 'Please check your internet connection'),
  serverError: () =>
    showToast.error('Server error', 'Something went wrong. Please try again later'),

  // Generic
  copied: () => showToast.success('Copied to clipboard'),
  saved: () => showToast.success('Saved'),
  deleted: () => showToast.success('Deleted'),

  // File upload
  fileUploadSuccess: () => showToast.success('File uploaded successfully'),
  fileUploadError: () => showToast.error('Failed to upload file', 'Please try again'),
  fileTooLarge: () => showToast.error('File too large', 'Maximum file size is 10MB'),

  // Development Hub
  resourceSaved: () => showToast.success('Resource saved to your library'),
  resourceRemoved: () => showToast.info('Resource removed from library'),

  // Proofs
  proofSubmitted: () => showToast.success('Proof submitted for verification'),
  proofVerified: () => showToast.success('Proof verified successfully'),
  proofRejected: () => showToast.error('Proof verification failed', 'Please review and resubmit'),

  // Expertise Atlas
  branchAdded: () => showToast.success('Branch added to your expertise'),
  branchRemoved: () => showToast.info('Branch removed'),
  skillAdded: () => showToast.success('Skill added'),
  skillUpdated: () => showToast.success('Skill updated'),
};
