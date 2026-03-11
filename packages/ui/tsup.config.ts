import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  splitting: true,
  treeshake: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react-hook-form',
    /^@radix-ui\//,
    'framer-motion',
    'lucide-react',
    'class-variance-authority',
    'clsx',
    'cmdk',
    'sonner',
    'tailwind-merge',
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
