import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM build for bundler consumers (lit stays external).
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['lit'],
  },
  // Self-contained build for a plain <script> tag (lit + core bundled in).
  {
    entry: { 'aasa-validator': 'src/index.ts' },
    format: ['iife'],
    globalName: 'AASAValidator',
    minify: true,
    sourcemap: true,
    noExternal: [/.*/],
  },
]);
