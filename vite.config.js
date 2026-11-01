import { defineConfig } from 'vite';

// base relative : le build fonctionne sur n'importe quel hébergement statique (GitHub Pages, etc.)
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 800 },
});
