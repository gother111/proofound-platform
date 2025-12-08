// Minimal setup for node-only vitest suites to satisfy Vite SSR helpers
const g = globalThis as typeof globalThis & {
  __vite_ssr_exportName__?: (name: string, value: unknown) => unknown;
};
g.__vite_ssr_exportName__ =
  g.__vite_ssr_exportName__ || ((_name: string, value: unknown) => value);

