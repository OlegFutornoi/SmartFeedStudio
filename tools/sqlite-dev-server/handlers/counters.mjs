// @golden - SQLite Dev Server: Counters
import { db } from '../db.mjs';

export function computeCountersSummary() {
  const totalSuppliers = db.prepare('SELECT COUNT(*) as cnt FROM local_suppliers').get().cnt;
  const totalFeeds = db.prepare('SELECT COUNT(*) as cnt FROM local_feed_sources').get().cnt;
  const totalProducts = db.prepare('SELECT COUNT(*) as cnt FROM local_products').get().cnt;
  const totalRules = db.prepare('SELECT COUNT(*) as cnt FROM local_supplier_pricing_rules').get().cnt;

  const feedRows = db.prepare('SELECT supplier_id, COUNT(*) as cnt FROM local_feed_sources GROUP BY supplier_id').all();
  const feedsBySupplierId = {};
  for (const r of feedRows) feedsBySupplierId[r.supplier_id] = r.cnt;

  const prodRows = db.prepare('SELECT supplier_id, COUNT(*) as cnt FROM local_products GROUP BY supplier_id').all();
  const productsBySupplierId = {};
  for (const r of prodRows) productsBySupplierId[r.supplier_id] = r.cnt;

  const catRows = db.prepare('SELECT supplier_id, COUNT(*) as cnt, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_cnt FROM local_supplier_categories GROUP BY supplier_id').all();
  const categoriesBySupplierId = {};
  const activeCategoriesBySupplierId = {};
  let totalCategories = 0;
  for (const r of catRows) {
    categoriesBySupplierId[r.supplier_id] = r.cnt;
    activeCategoriesBySupplierId[r.supplier_id] = r.active_cnt || 0;
    totalCategories += r.cnt;
  }

  return {
    totalSuppliers,
    totalFeeds,
    totalProducts,
    totalRules,
    totalCategories,
    feedsBySupplierId,
    productsBySupplierId,
    categoriesBySupplierId,
    activeCategoriesBySupplierId,
  };
}

export function handleCounters(command) {
  switch (command) {
    case 'db_get_counters': {
      const summary = computeCountersSummary();
      return {
        id: 'counters_root',
        suppliersCount: summary.totalSuppliers,
        feedsCount: summary.totalFeeds,
        productsCount: summary.totalProducts,
      };
    }
    case 'db_get_counters_summary': {
      return computeCountersSummary();
    }
    default:
      return undefined;
  }
}
