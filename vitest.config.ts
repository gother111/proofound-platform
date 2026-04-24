import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_NON_MVP_TEST_EXCLUDES = [
  // Archived launch surfaces live under src/archive and are verified separately when needed.
  '**/src/archive/**',
  // These tests target removed or intentionally gated non-MVP routes/pages that should not block
  // the default unit test signal for the locked launch corridor.
  '**/tests/api/messages-legacy-route.test.ts',
  '**/tests/api/moderation-appeals-route.test.ts',
  '**/tests/api/moderation-statements-of-reasons-route.test.ts',
  '**/tests/api/moderation-transparency-report-route.test.ts',
  '**/tests/api/organization-test-matches-route.test.ts',
  '**/tests/api/updates-cache-flag-route.test.ts',
  '**/tests/ui/admin-ai-spend-page.test.tsx',
  '**/tests/ui/admin-fairness-notes-page.test.tsx',
  '**/tests/ui/organization-settings-integrations.test.tsx',
] as const;

export default defineConfig({
  plugins: [
    // Vitest uses vite-node which (in this repo's current dependency versions) does not
    // provide `__vite_ssr_exportName__` in the module evaluation context.
    //
    // Vite's SSR transform can still emit calls to `__vite_ssr_exportName__` to register
    // named exports. When it's missing, imported project modules show up as empty objects
    // at runtime, leading to errors like "(0, foo) is not a function" for every export.
    //
    // We inject a shim into project source modules so that SSR-transformed exports are
    // defined on `__vite_ssr_exports__` (which *is* provided by vite-node).
    {
      name: 'vitest-ssr-exportname-shim',
      enforce: 'pre',
      transform(code, id) {
        if (id.includes('/node_modules/')) return;
        if (!/\.[cm]?[jt]sx?$/.test(id)) return;

        // Avoid clobbering any local definitions.
        if (code.includes('__vite_ssr_exportName__')) return;

        const shim = [
          '// Injected by vitest-ssr-exportname-shim',
          'function __vite_ssr_exportName__(name, getterOrValue) {',
          '  try {',
          "    if (typeof __vite_ssr_exports__ !== 'undefined' && __vite_ssr_exports__) {",
          "      if (typeof getterOrValue === 'function') {",
          '        Object.defineProperty(__vite_ssr_exports__, name, {',
          '          enumerable: true,',
          '          configurable: true,',
          '          get: getterOrValue,',
          '        });',
          '      } else {',
          '        Object.defineProperty(__vite_ssr_exports__, name, {',
          '          enumerable: true,',
          '          configurable: true,',
          '          value: getterOrValue,',
          '        });',
          '      }',
          '    }',
          '  } catch {}',
          '  return getterOrValue;',
          '}',
          '',
        ].join('\n');

        return shim + code;
      },
    },
    react(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/tests/a11y/**',
      '**/tests/integration/**',
      // Privacy/RLS suites are run via dedicated scripts (see package.json `test:privacy*`).
      '**/tests/privacy/**',
      ...DEFAULT_NON_MVP_TEST_EXCLUDES,
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
