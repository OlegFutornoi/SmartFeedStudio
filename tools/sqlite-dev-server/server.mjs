// @golden - Reference implementation of SmartFeed Studio Local SQLite Development Server
import http from 'node:http';
import { URL } from 'node:url';
import { db, DB_PATH, getTables, resetDb } from './db.mjs';
import { handleCounters } from './handlers/counters.mjs';
import { handleSuppliers } from './handlers/suppliers.mjs';
import { handleSync } from './handlers/sync.mjs';
import { handleFeeds } from './handlers/feeds.mjs';
import { handleCategories } from './handlers/categories.mjs';
import { handleProducts } from './handlers/products.mjs';
import { handlePricingRules } from './handlers/pricing-rules.mjs';
import { handleBankRates } from './handlers/bank-rates.mjs';
import { handleChannels } from './handlers/channels.mjs';
import { handleMarketplace } from './handlers/marketplace.mjs';
import { handleImages } from './handlers/images.mjs';

const PORT = parseInt(process.env.PORT || '5001', 10);
const HANDLERS = [
  handleCounters, handleSuppliers, handleSync, handleFeeds, handleCategories,
  handleProducts, handlePricingRules, handleBankRates, handleChannels, handleMarketplace, handleImages,
];

function handleCommand(command, args) {
  for (const handler of HANDLERS) {
    const res = handler(command, args);
    if (res !== undefined) return res;
  }
  console.warn(`[SQLite-Dev] Unhandled command: ${command}`);
  return null;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    const tables = getTables();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', dbPath: DB_PATH, tablesCount: tables.length, tables }));
    return;
  }

  if (url.pathname === '/api/reset' && req.method === 'POST') {
    resetDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'All local tables cleared' }));
    return;
  }

  if (url.pathname === '/api/invoke' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { command, args } = payload;
        if (!command) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Command is required' }));
          return;
        }
        const data = handleCommand(command, args);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
      } catch (err) {
        console.error(`[SQLite-Dev] Command failed:`, err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [SmartFeed Studio] SQLite Dev Server listening on http://0.0.0.0:${PORT}`);
});

export { db, server };
