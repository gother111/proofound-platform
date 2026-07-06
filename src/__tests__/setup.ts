import { expect, afterEach } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';
import { TextDecoder, TextEncoder } from 'node:util';

// Ensure TextEncoder/TextDecoder exist (needed for esbuild in jsdom)
if (!(globalThis as any).TextEncoder) {
  (globalThis as any).TextEncoder = TextEncoder;
}
if (!(globalThis as any).TextDecoder) {
  (globalThis as any).TextDecoder = TextDecoder;
}

// Load environment variables for tests (supports .env.local)
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Only load DOM-specific helpers when a DOM exists (jsdom environment)
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
if (isBrowser) {
  if (!(globalThis as any).IntersectionObserver) {
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin = '0px';
      readonly thresholds = [0];

      disconnect() {}
      observe() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      unobserve() {}
    }

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      value: MockIntersectionObserver,
    });
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: MockIntersectionObserver,
    });
  }

  if (typeof window.localStorage?.clear !== 'function') {
    const store = new Map<string, string>();
    const memoryLocalStorage: Storage = {
      get length() {
        return store.size;
      },
      clear() {
        store.clear();
      },
      getItem(key: string) {
        return store.get(key) ?? null;
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null;
      },
      removeItem(key: string) {
        store.delete(key);
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: memoryLocalStorage,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memoryLocalStorage,
    });
  }
  await import('@testing-library/jest-dom/vitest');
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => {
    cleanup();
  });
}

// Provide Vite SSR helper expected by Next.js transforms during Vitest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__vite_ssr_exportName__ =
  (globalThis as any).__vite_ssr_exportName__ ||
  ((name: string, valueOrGetter: any) => {
    const g = globalThis as any;
    const exp = g.__vite_ssr_exports__;

    // When running transformed SSR modules, Vite uses a per-module `__vite_ssr_exports__`
    // object + `__vite_ssr_exportName__` helper to register named exports.
    if (exp && typeof exp === 'object') {
      if (typeof valueOrGetter === 'function') {
        Object.defineProperty(exp, name, {
          enumerable: true,
          configurable: true,
          get: valueOrGetter,
        });
        return undefined;
      }

      Object.defineProperty(exp, name, {
        enumerable: true,
        configurable: true,
        value: valueOrGetter,
      });
      return undefined;
    }

    // Fallback: behave like an identity helper when used in expression form.
    return valueOrGetter;
  });
