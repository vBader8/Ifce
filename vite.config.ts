import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Two build targets:
//  - default: multi-file PWA build in dist/ (with offline service worker)
//  - standalone: one self-contained HTML file in dist-standalone/ that opens via file://
export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';
  return {
    base: './',
    plugins: [react(), ...(standalone ? [viteSingleFile()] : [])],
    define: { __STANDALONE__: JSON.stringify(standalone) },
    build: {
      outDir: standalone ? 'dist-standalone' : 'dist',
      emptyOutDir: true,
      assetsInlineLimit: standalone ? 100_000_000 : 4096,
      chunkSizeWarningLimit: 2000,
      copyPublicDir: !standalone,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      css: false,
    },
  };
});
