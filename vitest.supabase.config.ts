import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    {
      name: 'vitest-ssr-exportname-shim',
      enforce: 'pre',
      transform(code, id) {
        if (id.includes('/node_modules/') && !id.includes('/node_modules/@supabase/')) return;
        if (!/\.[cm]?[jt]sx?$/.test(id)) return;
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
  ],
  test: {
    environment: 'node',
    globals: true,
    // Increase timeout for integration tests (Supabase API calls can be slow)
    testTimeout: 30000,
    // Run tests sequentially to avoid race conditions with test data
    sequence: {
      concurrent: false,
    },
    // Setup file for loading environment variables
    setupFiles: ['./tests/privacy/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
