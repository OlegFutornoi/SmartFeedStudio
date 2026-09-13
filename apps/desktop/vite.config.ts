import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';
import { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Vite dev-server middleware: GET /feed-proxy?url=<encoded>
 * Fetches the remote feed or image server-side to avoid CORS restrictions in the browser.
 */
function feedProxyPlugin(): Plugin {
  return {
    name: 'feed-proxy',
    configureServer(server) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
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
          let targetUrl: string;
          try {
            targetUrl = decodeURIComponent(match[1]);
            const parsed = new URL(targetUrl);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
              throw new Error('Invalid protocol');
            }
          } catch {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid URL parameter');
            return;
          }

          try {
            const response = await fetch(targetUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SmartFeedStudio/1.0',
                Accept: (req.headers['accept'] as string) || '*/*',
              },
              signal: AbortSignal.timeout(120_000),
            });

            if (!res.headersSent) {
              res.writeHead(response.status, {
                'Content-Type':
                  response.headers.get('content-type') || 'application/xml; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400',
              });
            }

            if (response.body) {
              const arrayBuffer = await response.arrayBuffer();
              res.end(Buffer.from(arrayBuffer));
            } else {
              res.end();
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown proxy error';
            if (!res.headersSent) {
              res.writeHead(504, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
              });
            }
            res.end(`Feed proxy timeout/error: ${msg}`);
          }
        },
      );
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
