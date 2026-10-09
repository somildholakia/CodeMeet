import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const spaNotFoundFallback = {
  name: 'codemeet-spa-404-fallback',
  closeBundle() {
    copyFileSync(resolve(projectRoot, 'dist/index.html'), resolve(projectRoot, 'dist/404.html'));
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), spaNotFoundFallback],
  server: {
    port: 5173,
  },
});
