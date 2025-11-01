/**
 * Toast Hook
 * Simple toast notification system
 */

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const toastListeners = new Set<(toast: Toast) => void>();

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, title, description, variant };
      
      toastListeners.forEach((listener) => listener(newToast));
    },
    []
  );

  return { toast };
}

export function subscribeToToasts(callback: (toast: Toast) => void) {
  toastListeners.add(callback);
  return () => toastListeners.delete(callback);
}

