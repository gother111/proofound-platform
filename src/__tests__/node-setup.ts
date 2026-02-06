// Minimal setup for node-only vitest suites to satisfy Vite SSR helpers
const g = globalThis as typeof globalThis & {
  __vite_ssr_exports__?: Record<string, unknown>;
  __vite_ssr_exportName__?: (name: string, valueOrGetter: unknown) => unknown;
};
g.__vite_ssr_exportName__ =
  g.__vite_ssr_exportName__ ||
  ((name: string, valueOrGetter: any) => {
    const exp = (globalThis as any).__vite_ssr_exports__;
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
    return valueOrGetter;
  });
