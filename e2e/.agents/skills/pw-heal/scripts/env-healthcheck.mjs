/* eslint-disable */
/**
 * SmartFeed Studio Multi-Service Health Check
 * Quickly probes all 4 service targets to diagnose environment readiness:
 * - Server API (:4000/api/health)
 * - Admin Portal (:3000)
 * - SQLite Dev Container (:5001/health)
 * - Desktop Web Client (:1420)
 *
 * Usage:
 *   node .agents/skills/pw-heal/scripts/env-healthcheck.mjs
 */

const services = [
  { name: 'Server Backend API', url: 'http://localhost:4000/api/health' },
  { name: 'Server Admin Portal', url: 'http://localhost:3000' },
  { name: 'Local DB SQLite Container', url: 'http://localhost:5001/health' },
  { name: 'Local Desktop Web Client', url: 'http://127.0.0.1:1420' },
];

async function checkService(service) {
  try {
    const res = await fetch(service.url, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      console.log(`  ✅ [${service.name}] ONLINE (${res.status} OK at ${service.url})`);
      return true;
    } else {
      console.log(`  ⚠️ [${service.name}] RESPONDED WITH ${res.status} at ${service.url}`);
      return false;
    }
  } catch (err) {
    console.log(`  ❌ [${service.name}] OFFLINE (${err.message} at ${service.url})`);
    return false;
  }
}

async function main() {
  console.log('[HealthCheck] Probing SmartFeed Studio services...');
  let allHealthy = true;
  for (const s of services) {
    const ok = await checkService(s);
    if (!ok) allHealthy = false;
  }
  console.log(`[HealthCheck] Result: ${allHealthy ? 'All services ready' : 'Some services are offline'}`);
  process.exit(allHealthy ? 0 : 1);
}

main();
