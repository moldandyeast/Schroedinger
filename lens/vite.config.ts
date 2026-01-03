import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'serve-docs',
      configureServer(server) {
        server.middlewares.use('/docs', (req, res, next) => {
          const url = req.url || '/index.html';
          const filePath = resolve(__dirname, '..', 'docs', url.slice(1) || 'index.html');
          
          if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8');
            const ext = filePath.split('.').pop() || 'html';
            const mimeTypes: Record<string, string> = {
              html: 'text/html; charset=utf-8',
              css: 'text/css',
              js: 'application/javascript',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
            res.end(content);
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3333',
        ws: true,
      },
    },
    fs: {
      allow: ['..'],
    },
  },
});

