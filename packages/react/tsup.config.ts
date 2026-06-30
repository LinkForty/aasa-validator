import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  // Mark the output as a client component so it works in Next.js App Router.
  banner: { js: '"use client";' },
});
