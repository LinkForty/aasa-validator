import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Test against core source so the suite never depends on a stale build.
      '@linkforty/aasa-core': fileURLToPath(
        new URL('./packages/core/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environmentMatchGlobs: [['packages/react/**', 'jsdom']],
  },
});
