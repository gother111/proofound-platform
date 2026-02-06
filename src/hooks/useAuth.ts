/**
 * useAuth Hook
 *
 * Provides access to the current authenticated user on the client side.
 * Uses Supabase's browser client to get the current user.
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data, error }: { data: { user: User | null }; error: any }) => {
      if (error) {
        setError(error);
        setUser(null);
      } else {
        setUser(data.user);
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    userId: user?.id ?? null,
    isLoading,
    error,
  };
}
