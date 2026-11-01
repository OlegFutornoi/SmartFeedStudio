# Topology Map Update Protocol

When introducing a new module, endpoint, table, Tauri command, port, or shared contract:

1. Update domain entry in `map.md` (keep to 1-2 lines per domain).
2. Synchronize `wiki/README.md` and related `wiki/0X-*` documents.
3. Update relevant package `AGENTS.md` if architectural invariants or boundaries change.
4. Keep entries concise: specify locations, ports, and contracts without bloated code snippets.
