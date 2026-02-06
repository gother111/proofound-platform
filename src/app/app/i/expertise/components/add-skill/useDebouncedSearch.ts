'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type UseDebouncedSearchOptions<T> = {
  delayMs?: number;
  minLength?: number;
  search: (query: string, signal: AbortSignal) => Promise<T[]>;
};

export function useDebouncedSearch<T>(options: UseDebouncedSearchOptions<T>) {
  const { delayMs = 300, minLength = 2, search } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  const onChange = useCallback(
    (value: string) => {
      setQuery(value);

      abortRef.current?.abort();
      abortRef.current = null;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (value.trim().length < minLength) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);

        const abortController = new AbortController();
        abortRef.current = abortController;

        try {
          const nextResults = await search(value, abortController.signal);
          if (!abortController.signal.aborted) {
            setResults(nextResults);
          }
        } catch (err: any) {
          if (err?.name !== 'AbortError' && !abortController.signal.aborted) {
            console.error('Debounced search failed:', err);
            setResults([]);
            setError('Search failed. Please check your connection and try again.');
          }
        } finally {
          if (!abortController.signal.aborted) {
            setLoading(false);
          }
        }
      }, delayMs);
    },
    [delayMs, minLength, search]
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    loading,
    error,
    setQuery,
    setResults,
    setLoading,
    setError,
    onChange,
    reset,
  };
}
