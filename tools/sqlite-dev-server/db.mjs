// @golden - SQLite connection & schema management for SmartFeed Studio Dev Server
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data/smartfeed-dev.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log(`🔌 [SQLite-Dev] Opening database at: ${DB_PATH}`);
export const db = new DatabaseSync(DB_PATH);

// Initialize schema
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaFile = path.resolve(__dirname, 'schema.sql');
let schemaFileHash = '';

if (fs.existsSync(schemaFile)) {
  const schemaSql = fs.readFileSync(schemaFile, 'utf-8');
  schemaFileHash = crypto.createHash('sha256').update(schemaSql).digest('hex');
  db.exec(schemaSql);
  console.log('✅ [SQLite-Dev] Schema initialized successfully');
}

export function getTables() {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name);
}

export function getSchemaFingerprint() {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((r) => r.name);

  const parts = [];
  for (const table of tables) {
    const cols = db
      .prepare(`PRAGMA table_info(${table})`)
      .all()
      .map((c) => `${c.cid}:${c.name}:${c.type}:${c.notnull}:${c.dflt_value}:${c.pk}`)
      .join('|');
    parts.push(`${table}[${cols}]`);
  }

  const raw = parts.join(';');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function resetDb() {
  db.exec(`
    DELETE FROM local_products;
    DELETE FROM local_product_images;
    DELETE FROM local_supplier_categories;
    DELETE FROM local_feed_sources;
    DELETE FROM local_suppliers;
    DELETE FROM local_supplier_pricing_rules;
    DELETE FROM local_supplier_sync_settings;
    DELETE FROM local_supplier_sync_logs;
    DELETE FROM local_export_channels;
    DELETE FROM local_export_channel_pricing_rules;
    DELETE FROM local_marketplace_categories;
    DELETE FROM local_supplier_category_marketplace_maps;
  `);
}

export { DB_PATH, schemaFileHash };
