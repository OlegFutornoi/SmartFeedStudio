import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';
import { IncomingMessage, ServerResponse } from 'node:http';
import * as https from 'node:https';
import * as http from 'node:http';

/**
 * Vite dev-server middleware: GET /feed-proxy?url=<encoded>
 * Fetches the remote feed server-side to avoid CORS restrictions in the browser.
 */
function feedProxyPlugin(): Plugin {
  return {
    name: 'feed-proxy',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        if (!url.startsWith('/feed-proxy')) {
          return next();
        }
        const match = url.match(/\/feed-proxy\?url=(.+)/);
        if (!match) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing url param');
          return;
        }
        const targetUrl = decodeURIComponent(match[1]);
        const mod = targetUrl.startsWith('https') ? https : http;
        const proxyReq = mod.get(
          targetUrl,
          { headers: { 'User-Agent': 'SmartFeedStudio/1.0', Accept: 'text/xml,*/*' } },
          (feedRes) => {
            res.writeHead(feedRes.statusCode || 200, {
              'Content-Type': feedRes.headers['content-type'] || 'text/xml; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            });
            feedRes.pipe(res);
          },
        );
        proxyReq.on('error', (err: Error) => {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
          res.end(`Feed proxy error: ${err.message}`);
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), feedProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@smartfeed/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: '127.0.0.1',
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
